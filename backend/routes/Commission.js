import express from "express";
import CommissionLedger from "../models/CommissionLedger.js";
import Provider from "../models/Provider.js";
import { daysOverdue } from "../utils/commission.js";

const router = express.Router();

router.get("/:providerId", async (req, res) => {
  const entries = await CommissionLedger.find({ provider: req.params.providerId }).sort({ date: 1 });

  for (const entry of entries) {
    if (!entry.paid && !entry.penaltyApplied && daysOverdue(entry.date) >= 3) {
      const penalty = Math.round(entry.commissionAmount * 0.01);
      entry.commissionAmount += penalty;
      entry.penaltyApplied = true;
      await entry.save();
    }
  }

  const totalOwed = entries.filter((e) => !e.paid).reduce((sum, e) => sum + e.commissionAmount, 0);
  res.json({ entries, totalOwed });
});

router.post("/:providerId/pay", async (req, res) => {
  let { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "amount must be positive" });

  const unpaid = await CommissionLedger.find({ provider: req.params.providerId, paid: false }).sort({ date: 1 });

  const settled = [];
  for (const entry of unpaid) {
    if (amount <= 0) break;
    if (amount >= entry.commissionAmount) {
      amount -= entry.commissionAmount;
      entry.paid = true;
      entry.paidAt = new Date();
      await entry.save();
      settled.push(entry.date);
    } else {
      entry.commissionAmount -= amount;
      amount = 0;
      await entry.save();
    }
  }

  const provider = await Provider.findById(req.params.providerId);
  const remaining = await CommissionLedger.aggregate([
    { $match: { provider: provider._id, paid: false } },
    { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
  ]);
  provider.commissionOwed = remaining[0]?.total || 0;
  await provider.save();

  res.json({ success: true, settledDays: settled, commissionOwed: provider.commissionOwed });
});

export default router;

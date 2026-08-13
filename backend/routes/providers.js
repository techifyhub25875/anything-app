import express from "express";
import Provider from "../models/Provider.js";
import JobRequest from "../models/JobRequest.js";
const router = express.Router();

router.get("/by-user/:userId", async (req, res) => {
  const provider = await Provider.findOne({ user: req.params.userId }).populate("category");
  res.json({ provider: provider || null });
});

router.post("/register", async (req, res) => {
  const { userId, categoryId, subTypes, lat, lng, aadharNumber, aadharPhoto } = req.body;
  if (!aadharNumber || !aadharPhoto) {
    return res.status(400).json({ error: "aadharNumber and aadharPhoto are required" });
  }
  let provider = await Provider.findOne({ user: userId });
  if (provider) return res.json({ success: true, provider });
  provider = await Provider.create({
    user: userId,
    category: categoryId,
    subTypes,
    location: { lat, lng },
    aadharNumber,
    aadharPhoto,
  });
  res.json({ success: true, provider });
});

router.post("/:id/duty", async (req, res) => {
  const { onDuty, lat, lng } = req.body;
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { onDuty, ...(lat && lng ? { location: { lat, lng } } : {}) },
    { new: true }
  );
  res.json({ success: true, provider });
});

router.post("/:id/location", async (req, res) => {
  const { lat, lng } = req.body;
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { location: { lat, lng } },
    { new: true }
  );
  res.json({ success: true, provider });
});

router.get("/:id/earnings", async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  const jobs = await JobRequest.find({
    acceptedProvider: req.params.id,
    status: "completed",
  }).sort({ createdAt: -1 });
  res.json({
    totalEarnings: provider.totalEarnings,
    commissionOwed: provider.commissionOwed,
    rating: provider.rating,
    jobs,
  });
});

export default router;

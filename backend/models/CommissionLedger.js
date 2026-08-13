import mongoose from "mongoose";

const commissionLedgerSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
    date: { type: String, required: true },
    amountEarned: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    penaltyApplied: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

commissionLedgerSchema.index({ provider: 1, date: 1 }, { unique: true });

export default mongoose.model("CommissionLedger", commissionLedgerSchema);

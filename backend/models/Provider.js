import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subTypes: [{ type: String }], // which sub-types this provider handles
    onDuty: { type: Boolean, default: false },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    radiusKm: { type: Number, default: 4 }, // fixed at 4km for Phase 1
    rating: { type: Number, default: 5 },
    ratingCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }, // sum of client-reported amounts
    commissionOwed: { type: Number, default: 0 }, // 10% of totalEarnings, tracked not billed yet
  },
  { timestamps: true }
);

export default mongoose.model("Provider", providerSchema);

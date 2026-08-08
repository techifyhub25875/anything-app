import mongoose from "mongoose";

const jobRequestSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    subType: { type: String, required: true },
    description: { type: String, required: true },
    clientLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    // Ranked list of providers considered for this job, nearest first.
    // We walk this list one at a time — see routes/requests.js
    candidateProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Provider" }],
    currentCandidateIndex: { type: Number, default: 0 },

    // currently-pinged provider + when that ping expires
    activeProvider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", default: null },
    activeProviderExpiresAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ["searching", "accepted", "no_provider_found", "completed"],
      default: "searching",
    },

    acceptedProvider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", default: null },

    // filled in on completion
    amountPaid: { type: Number, default: null },
    commissionAmount: { type: Number, default: null }, // 10% of amountPaid
    rating: { type: Number, default: null },
    ratingText: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("JobRequest", jobRequestSchema);

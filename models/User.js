import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    role: { type: String, enum: ["client", "provider"], required: true },
    // Phase 1 uses mock OTP (any 4-digit code works) so you can test the full
    // flow without paying for an SMS provider. Swap in Firebase Phone Auth or
    // an SMS gateway (MSG91 / Twilio) here later without touching other code.
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

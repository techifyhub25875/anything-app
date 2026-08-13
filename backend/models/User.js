import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    language: { type: String, required: true },
    role: { type: String, enum: ["client", "provider"], required: true },
  },
  { timestamps: true }
);
export default mongoose.model("User", userSchema);

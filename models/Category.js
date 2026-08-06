import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Electrician"
  icon: { type: String, default: "" }, // emoji or icon key used by frontend
  description: { type: String, default: "" },
  subTypes: [{ type: String }], // e.g. ["Fridge Repair", "Washing Machine", "AC Repair", "Wiring"]
  active: { type: Boolean, default: true }, // turn categories off without deleting them
});

export default mongoose.model("Category", categorySchema);

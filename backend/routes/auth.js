import express from "express";
import User from "../models/User.js";
const router = express.Router();

router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });
  console.log(`[mock OTP] Code for ${phone} is 1234`);
  res.json({ success: true, message: "OTP sent (mock — use 1234)" });
});

router.post("/verify-otp", async (req, res) => {
  const { phone, otp, name, role, email, address, state, language } = req.body;
  if (otp !== "1234") {
    return res.status(400).json({ error: "Invalid OTP" });
  }
  let user = await User.findOne({ phone });
  if (!user) {
    if (!name || !role || !email || !address || !state || !language) {
      return res.status(400).json({ error: "name, role, email, address, state and language required for new users" });
    }
    user = await User.create({ phone, name, role, email, address, state, language });
  }
  res.json({ success: true, user });
});

export default router;

import express from "express";
import Provider from "../models/Provider.js";
import JobRequest from "../models/JobRequest.js";

const router = express.Router();

// Fetch a provider profile by their user id — used on login to check
// whether this provider has completed category registration yet.
router.get("/by-user/:userId", async (req, res) => {
  const provider = await Provider.findOne({ user: req.params.userId }).populate("category");
  res.json({ provider: provider || null });
});

// Register as a provider (after auth/verify-otp has created the User with role=provider)
router.post("/register", async (req, res) => {
  const { userId, categoryId, subTypes, lat, lng } = req.body;
  let provider = await Provider.findOne({ user: userId });
  if (provider) return res.json({ success: true, provider });
  provider = await Provider.create({
    user: userId,
    category: categoryId,
    subTypes,
    location: { lat, lng },
  });
  res.json({ success: true, provider });
});

// Toggle on/off duty. This is the single control that makes a provider
// visible or invisible to the matching engine — see routes/requests.js
router.post("/:id/duty", async (req, res) => {
  const { onDuty, lat, lng } = req.body;
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    {
      onDuty,
      ...(lat && lng ? { location: { lat, lng } } : {}),
    },
    { new: true }
  );
  res.json({ success: true, provider });
});

// Update location periodically while on duty (call this every ~30s from the app)
router.post("/:id/location", async (req, res) => {
  const { lat, lng } = req.body;
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    { location: { lat, lng } },
    { new: true }
  );
  res.json({ success: true, provider });
});

// Provider's earnings + owed (but not yet billed) commission history
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

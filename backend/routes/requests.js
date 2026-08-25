import express from "express";
import JobRequest from "../models/JobRequest.js";
import Provider from "../models/Provider.js";
import CommissionLedger from "../models/CommissionLedger.js";
import { distanceKm } from "../utils/distance.js";
import { todayStr } from "../utils/commission.js";

const router = express.Router();

const RESPONSE_WINDOW_MS = 2 * 60 * 1000;
const MATCH_RADIUS_KM = 4;

async function advanceToNextCandidate(job) {
  job.currentCandidateIndex += 1;
  if (job.currentCandidateIndex >= job.candidateProviders.length) {
    job.status = "no_provider_found";
    job.activeProvider = null;
    job.activeProviderExpiresAt = null;
  } else {
    job.activeProvider = job.candidateProviders[job.currentCandidateIndex];
    job.activeProviderExpiresAt = new Date(Date.now() + RESPONSE_WINDOW_MS);
  }
  await job.save();
  return job;
}

async function checkExpiry(job) {
  if (
    job.status === "searching" &&
    job.activeProviderExpiresAt &&
    job.activeProviderExpiresAt.getTime() < Date.now()
  ) {
    return advanceToNextCandidate(job);
  }
  return job;
}

router.post("/", async (req, res) => {
  const { clientId, categoryId, subType, description, lat, lng } = req.body;
  const candidates = await Provider.find({ category: categoryId, onDuty: true });
  const ranked = candidates
    .map((p) => ({ provider: p, distance: distanceKm(lat, lng, p.location.lat, p.location.lng) }))
    .filter((c) => c.distance <= MATCH_RADIUS_KM)
    .sort((a, b) => a.distance - b.distance);

  if (ranked.length === 0) {
    const job = await JobRequest.create({
      client: clientId, category: categoryId, subType, description,
      clientLocation: { lat, lng }, candidateProviders: [], status: "no_provider_found",
    });
    return res.json({ success: true, job });
  }

  const job = await JobRequest.create({
    client: clientId, category: categoryId, subType, description,
    clientLocation: { lat, lng },
    candidateProviders: ranked.map((r) => r.provider._id),
    currentCandidateIndex: 0,
    activeProvider: ranked[0].provider._id,
    activeProviderExpiresAt: new Date(Date.now() + RESPONSE_WINDOW_MS),
    status: "searching",
  });
  res.json({ success: true, job });
});

router.get("/:id", async (req, res) => {
  let job = await JobRequest.findById(req.params.id)
    .populate("activeProvider").populate("acceptedProvider").populate("category");
  if (!job) return res.status(404).json({ error: "Not found" });
  job = await checkExpiry(job);
  await job.populate("activeProvider");
  await job.populate("acceptedProvider");
  res.json({ job });
});

router.get("/provider/:providerId/incoming", async (req, res) => {
  const job = await JobRequest.findOne({ activeProvider: req.params.providerId, status: "searching" }).populate("category");
  if (!job) return res.json({ job: null });
  const checked = await checkExpiry(job);
  if (checked.status !== "searching" || String(checked.activeProvider) !== req.params.providerId) {
    return res.json({ job: null });
  }
  res.json({ job: checked });
});

router.post("/:id/respond", async (req, res) => {
  const { providerId, action } = req.body;
  const job = await JobRequest.findById(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  if (String(job.activeProvider) !== String(providerId)) {
    return res.status(409).json({ error: "This request is no longer assigned to you" });
  }
  if (action === "accept") {
    job.status = "accepted";
    job.acceptedProvider = providerId;
    await job.save();
    return res.json({ success: true, job });
  }
  if (action === "reject") {
    const updated = await advanceToNextCandidate(job);
    return res.json({ success: true, job: updated });
  }
  res.status(400).json({ error: "action must be accept or reject" });
});

router.post("/:id/complete", async (req, res) => {
  const { amountPaid, rating, ratingText } = req.body;
  const job = await JobRequest.findById(req.params.id);
  if (!job) return res.status(404).json({ error: "Not found" });
  if (job.status !== "accepted") {
    return res.status(400).json({ error: "Job is not in an accepted state" });
  }

  const commissionAmount = Math.round(amountPaid * 0.1);
  job.amountPaid = amountPaid;
  job.commissionAmount = commissionAmount;
  job.rating = rating;
  job.ratingText = ratingText || "";
  job.status = "completed";
  await job.save();

  const provider = await Provider.findById(job.acceptedProvider);
  const newRatingCount = provider.ratingCount + 1;
  const newAvgRating = (provider.rating * provider.ratingCount + rating) / newRatingCount;
  provider.totalEarnings += amountPaid;
  provider.commissionOwed += commissionAmount;
  provider.rating = Math.round(newAvgRating * 10) / 10;
  provider.ratingCount = newRatingCount;
  await provider.save();

  const day = todayStr();
  await CommissionLedger.findOneAndUpdate(
    { provider: job.acceptedProvider, date: day },
    { $inc: { amountEarned: amountPaid, commissionAmount: commissionAmount } },
    { upsert: true, new: true }
  );

  res.json({ success: true, job });
});

// Client's recent requests (any status), newest first. Purely additive —
// does not touch any existing matching/accept/complete logic above.
router.get("/client/:clientId/recent", async (req, res) => {
  const jobs = await JobRequest.find({ client: req.params.clientId })
    .populate("category")
    .populate("acceptedProvider")
    .sort({ createdAt: -1 })
    .limit(5);
  res.json({ jobs });
});
export default router;

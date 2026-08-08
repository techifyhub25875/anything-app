import express from "express";
import Category from "../models/Category.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const categories = await Category.find({ active: true });
  res.json(categories);
});

// One-time helper to seed Phase 1 categories. Call this once after connecting
// a fresh database (e.g. via Postman or curl), then never again.
router.post("/seed", async (req, res) => {
  const existing = await Category.countDocuments();
  if (existing > 0) {
    return res.json({ message: "Categories already seeded", count: existing });
  }
  const seedData = [
    {
      name: "Electrician",
      icon: "⚡",
      description: "Certified wiring, appliance repair, switchboards & power failures",
      subTypes: ["Fridge Repair", "Washing Machine", "AC Repair", "Wiring"],
    },
    {
      name: "Plumber",
      icon: "🔧",
      description: "Leak fixes, pipe fittings, geysers, faucets & drainage clogs",
      subTypes: ["Tap Leak", "Motor Fitting", "Drainage", "Pipe Fitting"],
    },
    {
      name: "Mechanic",
      icon: "🚗",
      description: "Car, bike & scooter breakdown and repair",
      subTypes: ["Car", "Bike", "Scooter"],
    },
  ];
  const created = await Category.insertMany(seedData);
  res.json({ message: "Seeded", categories: created });
});

export default router;

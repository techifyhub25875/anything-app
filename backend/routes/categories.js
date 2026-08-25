import express from "express";
import Category from "../models/Category.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const categories = await Category.find({ active: true });
  res.json(categories);
});

router.post("/seed", async (req, res) => {
  const seedData = [
    { name: "Electrician", group: "Home Repair", icon: "⚡", subTypes: ["Fridge Repair", "Washing Machine", "AC Repair", "Wiring"] },
    { name: "Plumber", group: "Home Repair", icon: "ߔ", subTypes: ["Tap Leak", "Motor Fitting", "Drainage", "Pipe Fitting"] },
    { name: "Carpenter", group: "Home Repair", icon: "ߪ", subTypes: ["Furniture Repair", "Door Fitting", "Cupboard"] },
    { name: "Painter", group: "Home Repair", icon: "ߎ", subTypes: ["Wall Painting", "Waterproofing"] },
    { name: "AC Technician", group: "Home Repair", icon: "❄️", subTypes: ["Installation", "Gas Filling", "Servicing"] },

    { name: "Salon at Home", group: "Personal Care", icon: "ߒ", subTypes: ["Haircut", "Facial", "Threading"] },
    { name: "Massage Therapist", group: "Personal Care", icon: "ߒ", subTypes: ["Body Massage", "Head Massage"] },
    { name: "Makeup Artist", group: "Personal Care", icon: "ߒ", subTypes: ["Party Makeup", "Bridal"] },

    { name: "Mechanic", group: "Automotive", icon: "ߔ", subTypes: ["Car", "Bike", "Scooter"] },
    { name: "Car Wash", group: "Automotive", icon: "ߚ", subTypes: ["Exterior Wash", "Full Detailing"] },
    { name: "Tyre Puncture", group: "Automotive", icon: "ߛ", subTypes: ["Puncture Repair", "Tyre Replacement"] },

    { name: "Pest Control", group: "Cleaning", icon: "ߐ", subTypes: ["Cockroach", "Termite", "Bed Bugs"] },
    { name: "Home Cleaning", group: "Cleaning", icon: "ߧ", subTypes: ["Deep Clean", "Bathroom Clean", "Kitchen Clean"] },
    { name: "Sofa Cleaning", group: "Cleaning", icon: "ߛ️", subTypes: ["Sofa", "Carpet", "Mattress"] },

    { name: "Event Decorator", group: "Events", icon: "ߎ", subTypes: ["Birthday", "Wedding", "Balloon Decor"] },
    { name: "Photographer", group: "Events", icon: "ߓ", subTypes: ["Event", "Portrait"] },
  ];

  const existing = await Category.find({}, "name");
  const existingNames = new Set(existing.map((c) => c.name));
  const toInsert = seedData.filter((c) => !existingNames.has(c.name));
  if (toInsert.length > 0) {
    await Category.insertMany(toInsert);
  }

  // Backfill the `group` field for categories that were created before this
  // field existed (e.g. the very first Electrician/Plumber/Mechanic seed).
  // Only touches `group` — nothing else about those documents changes.
  let backfilled = 0;
  for (const c of seedData) {
    const result = await Category.updateOne(
      { name: c.name, $or: [{ group: { $exists: false } }, { group: null }, { group: "" }, { group: "Other" }] },
      { $set: { group: c.group } }
    );
    if (result.modifiedCount) backfilled++;
  }

  res.json({ message: "Seeded", added: toInsert.length, backfilled });
});

export default router;

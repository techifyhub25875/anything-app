import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import providerRoutes from "./routes/providers.js";
import requestRoutes from "./routes/requests.js";
import commissionRoutes from "./routes/commission.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/commission", commissionRoutes);
app.get("/", (req, res) => res.json({ status: "Anything backend is running" }));
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.error("Check MONGODB_URI in your .env file");
  });

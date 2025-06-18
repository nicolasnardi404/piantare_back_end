import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import plantLocationRoutes from "./routes/plantLocationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import plantUpdateRoutes from "./routes/plantUpdateRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("uploads")); // Serve uploaded files statically

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/plant-locations", plantLocationRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plant-updates", plantUpdateRoutes);
app.use("/api/uploads", uploadRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Plantas Milena API" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

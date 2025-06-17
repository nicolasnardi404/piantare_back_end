import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import plantLocationRoutes from "./routes/plantLocationRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/plant-locations", plantLocationRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Plantas Milena API" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

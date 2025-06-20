import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import plantLocationRoutes from "./routes/plantLocationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import plantUpdateRoutes from "./routes/plantUpdateRoutes.js";
import plantRoutes from "./routes/plantRoutes.js";
// import geoGptRoutes from "./routes/geoGptRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// CORS configuration
const corsOptions = {
  origin: [
    // "http://localhost:3000",
    "https://piantare-front-end.vercel.app",
    // "https://piantare.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads")); // Serve uploaded files statically

// Add OPTIONS handling for preflight requests
app.options("*", cors(corsOptions));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/plant-locations", plantLocationRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/plant-updates", plantUpdateRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/plants", plantRoutes);
// app.use("/api/geogpt", geoGptRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Piantare API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      status: err.status || 500,
    },
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  server.close(() => process.exit(1));
});

export default app;

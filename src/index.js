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

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://plantas-milena.vercel.app",
    "https://piantare.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads")); // Serve uploaded files statically

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Piantare API", status: "healthy" });
});

// Routes with and without /api prefix to support both patterns
const apiRoutes = [
  { path: "/auth", router: authRoutes },
  { path: "/plant-locations", router: plantLocationRoutes },
  { path: "/companies", router: companyRoutes },
  { path: "/users", router: userRoutes },
  { path: "/plant-updates", router: plantUpdateRoutes },
  { path: "/uploads", router: uploadRoutes },
];

// Register routes both with and without /api prefix
apiRoutes.forEach(({ path, router }) => {
  app.use(`/api${path}`, router); // With /api prefix
  app.use(path, router); // Without /api prefix
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

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found",
      status: 404,
      path: req.path,
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
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;

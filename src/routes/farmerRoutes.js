import express from "express";
import farmerController from "../controllers/farmerController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Profile routes - require authentication
router.get("/profile", authenticateToken, farmerController.getFarmerProfile);
router.put("/profile", authenticateToken, farmerController.updateFarmerProfile);

// Admin routes - require authentication and ADMIN role
router.use(authenticateToken);
router.use(checkRole(["ADMIN"]));

// Get all farmers
router.get("/", farmerController.getAllFarmers);

// Get specific farmer
router.get("/:id", farmerController.getFarmerById);

// Create a new farmer profile
router.post("/", farmerController.createFarmer);

// Update a farmer
router.put("/:id", farmerController.updateFarmer);

// Delete a farmer
router.delete("/:id", farmerController.deleteFarmer);

export default router;

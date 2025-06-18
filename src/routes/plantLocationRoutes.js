import express from "express";
import plantLocationController from "../controllers/plantLocationController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get plant locations for map view (public)
router.get("/map", plantLocationController.getMapLocations);

// Get plant statistics
router.get("/stats", plantLocationController.getStats);

// Get all plant locations (filtered by user role)
router.get("/", plantLocationController.getAllLocations);

// Add a new plant location (only farmers can add)
router.post("/", checkRole(["FARMER"]), plantLocationController.addLocation);

// Get a specific plant location
router.get("/:id", plantLocationController.getLocation);

// Assign plant to company (only company admins and admins can do this)
router.put(
  "/:id/assign-company",
  checkRole(["COMPANY", "ADMIN"]),
  plantLocationController.assignToCompany
);

export default router;

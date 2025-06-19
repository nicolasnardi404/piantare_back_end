import express from "express";
import plantLocationController from "../controllers/plantLocationController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/map", plantLocationController.getMapLocations);
router.get("/stats", plantLocationController.getStats);

// All other routes require authentication
router.use(authenticateToken);

// Get all plant locations (filtered by user role)
router.get("/", plantLocationController.getAllLocations);

// Add a new plant location (only farmers can add)
router.post("/", checkRole(["FARMER"]), plantLocationController.addLocation);

// Get a specific plant location
router.get("/:id", plantLocationController.getLocation);

// Delete a plant location (only farmers can delete their own plants, admins can delete any)
router.delete(
  "/:id",
  checkRole(["FARMER", "ADMIN"]),
  plantLocationController.deleteLocation
);

// Assign plant to company (only company admins and admins can do this)
router.put(
  "/:id/assign-company",
  checkRole(["COMPANY", "ADMIN"]),
  plantLocationController.assignToCompany
);

export default router;

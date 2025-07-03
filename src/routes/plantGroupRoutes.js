import express from "express";
import plantGroupController from "../controllers/plantGroupController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// All plant group routes require authentication
router.use(authenticateToken);

// Create a new plant group (only farmers can create)
router.post("/", checkRole(["FARMER"]), plantGroupController.createPlantGroup);

// Get all plant groups in a project (if user has access)
router.get("/project/:projectId", plantGroupController.getProjectPlantGroups);

// Get details of a specific plant group (if user has access)
router.get("/:id", plantGroupController.getPlantGroupDetails);

// Update a plant group (farmers can only update their own groups)
router.put(
  "/:id",
  checkRole(["FARMER", "ADMIN"]),
  plantGroupController.updatePlantGroup
);

// Delete a plant group (farmers can only delete their own groups)
router.delete(
  "/:id",
  checkRole(["FARMER", "ADMIN"]),
  plantGroupController.deletePlantGroup
);

export default router;

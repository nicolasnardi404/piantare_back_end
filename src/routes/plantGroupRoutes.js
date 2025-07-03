import express from "express";
import plantGroupController from "../controllers/plantGroupController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new plant group in a project
router.post(
  "/projects/:projectId/groups",
  plantGroupController.createPlantGroup
);

// Add planted plants to a group
router.post("/groups/:groupId/plants", plantGroupController.addPlantedPlants);

// Get all plant groups for a project
router.get(
  "/projects/:projectId/groups",
  plantGroupController.getProjectPlantGroups
);

// Delete a plant group
router.delete("/groups/:groupId", plantGroupController.deletePlantGroup);

// Get details of a specific plant group (if user has access)
router.get("/:id", plantGroupController.getPlantGroupDetails);

// Update a plant group (farmers can only update their own groups)
router.put(
  "/:id",
  checkRole(["FARMER", "ADMIN"]),
  plantGroupController.updatePlantGroup
);

export default router;

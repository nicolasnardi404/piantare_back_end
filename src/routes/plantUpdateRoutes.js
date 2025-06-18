import express from "express";
import plantUpdateController from "../controllers/plantUpdateController.js";
import { authenticateToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new update for a plant
router.post(
  "/:plant_id/updates",
  upload.single("image"),
  plantUpdateController.createUpdate
);

// Get all updates for a plant
router.get("/:plant_id/updates", plantUpdateController.getUpdates);

// Get a specific update
router.get("/updates/:id", plantUpdateController.getUpdate);

// Delete an update
router.delete("/updates/:id", plantUpdateController.deleteUpdate);

export default router;

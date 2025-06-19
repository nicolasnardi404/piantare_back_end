import express from "express";
import plantUpdateController from "../controllers/plantUpdateController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(authenticateToken);

// Create a new update (only farmers can update their own plants)
router.post(
  "/",
  checkRole(["FARMER"]),
  upload.single("image"),
  plantUpdateController.createUpdate
);

// Get updates for a specific plant
router.get("/plant/:plantLocationId", plantUpdateController.getUpdatesByPlant);

// Delete an update (only farmers can delete their own updates)
router.delete(
  "/:id",
  checkRole(["FARMER"]),
  plantUpdateController.deleteUpdate
);

export default router;

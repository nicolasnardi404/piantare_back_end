import express from "express";
import plantUpdateController from "../controllers/plantUpdateController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// All plant update routes require authentication
router.use(authenticateToken);

// Create a new group update (only farmers can create)
router.post(
  "/group",
  checkRole(["FARMER"]),
  plantUpdateController.createGroupUpdate
);

// Get updates for a specific plant group (if user has access)
router.get("/group/:plantGroupId", plantUpdateController.getUpdatesByGroup);

// Delete a group update (farmers can only delete their own updates)
router.delete(
  "/group/:id",
  checkRole(["FARMER", "ADMIN"]),
  plantUpdateController.deleteGroupUpdate
);

export default router;

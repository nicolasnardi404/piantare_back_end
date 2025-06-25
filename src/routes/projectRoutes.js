import express from "express";
import projectController from "../controllers/projectController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// All project routes require authentication
router.use(authenticateToken);

// Get all projects (filtered by user role)
router.get("/", projectController.getProjects);

// Get specific project details (if user has access)
router.get("/:id", projectController.getProjectById);

// Create new project (only farmers can create projects)
router.post("/", checkRole(["FARMER"]), projectController.createProject);

// Update project (farmers can only update their own projects)
router.put(
  "/:id",
  checkRole(["FARMER", "ADMIN"]),
  projectController.updateProject
);

// Delete project (farmers can only delete their own projects)
router.delete(
  "/:id",
  checkRole(["FARMER", "ADMIN"]),
  projectController.deleteProject
);

export default router;

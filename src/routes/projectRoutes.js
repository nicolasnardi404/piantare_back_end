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

// Create new project
router.post("/", projectController.createProject);

// Update project
router.put("/:id", projectController.updateProject);

// Delete project
router.delete("/:id", projectController.deleteProject);

export default router;

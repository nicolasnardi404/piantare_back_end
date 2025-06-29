import express from "express";
import userController from "../controllers/userController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Profile routes - only require authentication
router.get("/profile", authenticateToken, userController.getProfile);
router.put("/profile", authenticateToken, userController.updateProfile);

// Admin routes - require authentication and ADMIN role
router.use(authenticateToken);
router.use(checkRole(["ADMIN"]));

// Get all users
router.get("/", userController.getAllUsers);

// Create a new user
router.post("/", userController.createUser);

// Update a user
router.put("/:id", userController.updateUser);

// Delete a user
router.delete("/:id", userController.deleteUser);

export default router;

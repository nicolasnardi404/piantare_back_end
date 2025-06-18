import express from "express";
import companyController from "../controllers/companyController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Profile routes - require authentication and COMPANY role
router.get(
  "/profile",
  authenticateToken,
  checkRole(["COMPANY"]),
  companyController.getProfile
);
router.put(
  "/profile",
  authenticateToken,
  checkRole(["COMPANY"]),
  companyController.updateProfile
);

// Admin routes - require authentication and ADMIN role
router.use(authenticateToken);
router.use(checkRole(["ADMIN"]));

// Get all companies
router.get("/", companyController.getAllCompanies);

// Create a new company
router.post("/", companyController.createCompany);

// Update a company
router.put("/:id", companyController.updateCompany);

// Delete a company
router.delete("/:id", companyController.deleteCompany);

export default router;

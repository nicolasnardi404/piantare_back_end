import express from "express";
import companyController from "../controllers/companyController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication and ADMIN role
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

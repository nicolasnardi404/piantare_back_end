import express from "express";
import plantedPlantController from "../controllers/plantedPlantController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

// Admin routes
router.get(
  "/admin/plants",
  authenticateToken,
  checkRole(["ADMIN"]),
  plantedPlantController.getAdminPlantsList
);

// Public routes (no authentication required)
router.get("/map-markers", plantedPlantController.getMapMarkers);

// Protected routes (authentication required)
router.use(authenticateToken);

// Farmer dashboard optimized routes
router.get(
  "/farmer/dashboard-complete",
  checkRole(["FARMER"]),
  plantedPlantController.getFarmerDashboardComplete
);

router.get(
  "/farmer/dashboard",
  checkRole(["FARMER"]),
  plantedPlantController.getFarmerDashboardData
);

router.get(
  "/farmer/projects",
  checkRole(["FARMER"]),
  plantedPlantController.getFarmerProjects
);

router.get(
  "/farmer/plants-table",
  checkRole(["FARMER"]),
  plantedPlantController.getFarmerPlantsTable
);

// Get farmer's plants (only for farmers)
router.get(
  "/farmer/plants",
  checkRole(["FARMER"]),
  plantedPlantController.getFarmerPlants
);

// Get company's plants (only for company users)
router.get(
  "/company/plants",
  checkRole(["COMPANY"]),
  plantedPlantController.getCompanyPlants
);

// Get detailed plant information
router.get("/details/:id", plantedPlantController.getPlantDetails);

// Add a new planted plant (only farmers can add)
router.post("/", checkRole(["FARMER"]), plantedPlantController.addPlant);

// Delete a planted plant (only farmers can delete their own plants, admins can delete any)
router.delete(
  "/:id",
  checkRole(["FARMER", "ADMIN"]),
  plantedPlantController.deletePlant
);

// Assign plant to company (only company admins and admins can do this)
router.put(
  "/:id/assign-company",
  checkRole(["ADMIN"]),
  plantedPlantController.assignToCompany
);

export default router;

import express from "express";
import plantLocationController from "../controllers/plantLocationController.js";

const router = express.Router();

// Get all plant locations
router.get("/", plantLocationController.getAllLocations);

// Add a new plant location
router.post("/", plantLocationController.addLocation);

// Get a specific plant location
router.get("/:id", plantLocationController.getLocation);

export default router;

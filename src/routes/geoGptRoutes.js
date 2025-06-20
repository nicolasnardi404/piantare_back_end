import express from "express";
import geoGptController from "../controllers/geoGptController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/analyze",
  authenticateToken,
  checkRole(["COMPANY"]),
  geoGptController.analyze
);

export default router;

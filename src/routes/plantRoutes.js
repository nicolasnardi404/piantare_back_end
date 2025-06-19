import express from "express";
import plantController from "../controllers/plantController.js";
import { authenticateToken, checkRole } from "../middleware/auth.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Define plant categories
const PLANT_CATEGORIES = [
  "ARVORES",
  "ARVORES_FRUTIFERAS",
  "CAPINS",
  "FOLHAGENS_ALTAS",
  "ARBUSTOS",
  "TREPADEIRAS",
  "AROMATICAS_E_COMESTIVEIS",
  "PLANTAS_DE_FORRACAO",
  "PLANTAS_AQUATICAS_OU_PALUSTRES",
];

// Public routes
router.get("/", plantController.getAllPlants);
router.get("/categories", async (req, res) => {
  try {
    res.json(PLANT_CATEGORIES);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar categorias", error: error.message });
  }
});
router.get("/:id", plantController.getPlant);

// Admin only routes
router.use(authenticateToken);
router.use(checkRole(["ADMIN"]));

router.post("/", plantController.addPlant);
router.put("/:id", plantController.updatePlant);
router.delete("/:id", plantController.deletePlant);

export default router;

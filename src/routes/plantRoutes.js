import express from "express";
import { authenticateToken, checkRole } from "../middleware/auth.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Define plant categories
const PLANT_CATEGORIES = ["ARVORES", "ARVORES_FRUTIFERAS"];

// Public routes
router.get("/", async (req, res) => {
  try {
    const { search, categoria, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { nomePopular: { contains: search, mode: "insensitive" } },
                { nomeCientifico: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        categoria ? { categoria } : {},
      ],
    };

    const [plants, total] = await Promise.all([
      prisma.plant.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { nomePopular: "asc" },
      }),
      prisma.plant.count({ where }),
    ]);

    res.json({
      plants,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar plantas", error: error.message });
  }
});

// Admin only routes
router.post("/", authenticateToken, checkRole(["ADMIN"]), async (req, res) => {
  try {
    const plant = await prisma.plant.create({
      data: req.body,
    });
    res.status(201).json(plant);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Erro ao criar planta", error: error.message });
  }
});

router.put(
  "/:id",
  authenticateToken,
  checkRole(["ADMIN"]),
  async (req, res) => {
    try {
      const plant = await prisma.plant.update({
        where: { id: parseInt(req.params.id) },
        data: req.body,
      });
      res.json(plant);
    } catch (error) {
      res
        .status(400)
        .json({ message: "Erro ao atualizar planta", error: error.message });
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  checkRole(["ADMIN"]),
  async (req, res) => {
    try {
      await prisma.plant.delete({
        where: { id: parseInt(req.params.id) },
      });
      res.json({ message: "Planta removida com sucesso" });
    } catch (error) {
      res
        .status(400)
        .json({ message: "Erro ao remover planta", error: error.message });
    }
  }
);

// Get categories for dropdown
router.get("/categories", async (req, res) => {
  try {
    res.json(PLANT_CATEGORIES);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar categorias", error: error.message });
  }
});

export default router;

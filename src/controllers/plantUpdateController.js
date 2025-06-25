import { PrismaClient } from "@prisma/client";
import { uploadFile } from "../services/uploadService.js";

const prisma = new PrismaClient();

const plantUpdateController = {
  async createUpdate(req, res) {
    try {
      const {
        plantedPlantId,
        healthStatus,
        notes,
        imageUrl,
        height,
        diameter,
      } = req.body;

      // Validate required fields
      if (!plantedPlantId || !healthStatus || !height || !diameter) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if planted plant exists and user has permission
      const plantedPlant = await prisma.plantedPlant.findUnique({
        where: { id: plantedPlantId },
        include: {
          project: {
            include: {
              farmer: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!plantedPlant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      // Only allow updates by the farmer who owns the project or an admin
      if (
        req.user.role !== "ADMIN" &&
        plantedPlant.project.farmer.user.id !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this plant" });
      }

      // Create the update
      const update = await prisma.plantUpdate.create({
        data: {
          healthStatus,
          notes,
          imageUrl,
          height: parseFloat(height),
          diameter: parseFloat(diameter),
          plantedPlantId: parseInt(plantedPlantId),
        },
        include: {
          plantedPlant: {
            include: {
              species: true,
            },
          },
        },
      });

      console.log("Created update:", update);
      res.status(201).json(update);
    } catch (error) {
      console.error("Error in createUpdate:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create update" });
    }
  },

  async getUpdatesByPlant(req, res) {
    try {
      const { plantedPlantId } = req.params;
      const { userId } = req.user;

      // Check if the planted plant exists and belongs to the user's project
      const plantedPlant = await prisma.plantedPlant.findUnique({
        where: { id: parseInt(plantedPlantId) },
        include: {
          project: {
            include: {
              farmer: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!plantedPlant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      // Get all updates for this plant
      const updates = await prisma.plantUpdate.findMany({
        where: { plantedPlantId: parseInt(plantedPlantId) },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(updates);
    } catch (error) {
      console.error("Error in getUpdatesByPlant:", error);
      res.status(500).json({ error: "Failed to fetch updates" });
    }
  },

  async deleteUpdate(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      // Check if the update exists and belongs to a plant in user's project
      const update = await prisma.plantUpdate.findUnique({
        where: { id: parseInt(id) },
        include: {
          plantedPlant: {
            include: {
              project: {
                include: {
                  farmer: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Verify that the user owns the project this plant belongs to
      if (update.plantedPlant.project.farmer.user.id !== userId) {
        return res.status(403).json({
          error: "You can only delete updates for plants in your projects",
        });
      }

      // Delete the update
      await prisma.plantUpdate.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Update deleted successfully" });
    } catch (error) {
      console.error("Error in deleteUpdate:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to delete update" });
    }
  },
};

export default plantUpdateController;

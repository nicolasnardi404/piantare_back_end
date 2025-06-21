import { PrismaClient } from "@prisma/client";
import { uploadFile } from "../services/uploadService.js";

const prisma = new PrismaClient();

const plantUpdateController = {
  async createUpdate(req, res) {
    try {
      const { plantLocationId, healthStatus, notes, imageUrl, height, width } =
        req.body;

      // Validate required fields
      if (!plantLocationId || !healthStatus || !height || !width) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if plant location exists and user has permission
      const plantLocation = await prisma.plantLocation.findUnique({
        where: { id: plantLocationId },
        include: { addedBy: true },
      });

      if (!plantLocation) {
        return res.status(404).json({ error: "Plant location not found" });
      }

      // Only allow updates by the farmer who added the plant or an admin
      if (
        req.user.role !== "ADMIN" &&
        plantLocation.addedBy.id !== req.user.userId
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
          width: parseFloat(width),
          plantId: parseInt(plantLocationId),
        },
        include: {
          plant: {
            include: {
              plant: true,
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
      const { plantLocationId } = req.params;
      const { userId } = req.user;

      // Check if the plant location exists and belongs to the user
      const plantLocation = await prisma.plantLocation.findUnique({
        where: { id: parseInt(plantLocationId) },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!plantLocation) {
        return res.status(404).json({ error: "Plant location not found" });
      }

      // Get all updates for this plant
      const updates = await prisma.plantUpdate.findMany({
        where: { plantLocationId: parseInt(plantLocationId) },
        orderBy: {
          updateDate: "desc",
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

      // Check if the update exists and belongs to a plant owned by the user
      const update = await prisma.plantUpdate.findUnique({
        where: { id: parseInt(id) },
        include: {
          plantLocation: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Verify that the user owns the plant this update belongs to
      if (update.plantLocation.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only delete updates for your own plants" });
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

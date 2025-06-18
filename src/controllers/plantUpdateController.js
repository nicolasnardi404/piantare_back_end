import { PrismaClient } from "@prisma/client";
import { uploadFile } from "../services/uploadService.js";

const prisma = new PrismaClient();

const plantUpdateController = {
  async createUpdate(req, res) {
    try {
      const { plant_id } = req.params;
      const { notes, health_status, measurements } = req.body;

      // Check if plant exists and user has permission
      const plant = await prisma.plantLocation.findUnique({
        where: { id: parseInt(plant_id) },
        include: { addedBy: true },
      });

      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      if (plant.addedBy.id !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this plant" });
      }

      let imageUrl = null;
      if (req.file) {
        try {
          const uploadResult = await uploadFile(req.file);
          imageUrl = uploadResult.url;
          console.log("File uploaded successfully:", uploadResult);
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          return res.status(500).json({ error: "Failed to upload image" });
        }
      }

      const parsedMeasurements =
        typeof measurements === "string"
          ? JSON.parse(measurements)
          : measurements;

      const update = await prisma.plantUpdate.create({
        data: {
          plantId: parseInt(plant_id),
          imageUrl,
          notes,
          healthStatus: health_status.toUpperCase(),
          measurements: parsedMeasurements || {},
          updateDate: new Date().toISOString(),
        },
      });

      res.status(201).json(update);
    } catch (error) {
      console.error("Error creating plant update:", error);
      res.status(500).json({ error: "Failed to create plant update" });
    }
  },

  async getUpdates(req, res) {
    try {
      const { plant_id } = req.params;

      const updates = await prisma.plantUpdate.findMany({
        where: { plantId: parseInt(plant_id) },
        orderBy: { updateDate: "desc" },
        select: {
          id: true,
          notes: true,
          imageUrl: true,
          healthStatus: true,
          measurements: true,
          updateDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Format dates as ISO strings
      const formattedUpdates = updates.map((update) => ({
        ...update,
        updateDate: update.updateDate.toISOString(),
        createdAt: update.createdAt.toISOString(),
        updatedAt: update.updatedAt.toISOString(),
      }));

      res.json(formattedUpdates);
    } catch (error) {
      console.error("Error fetching plant updates:", error);
      res.status(500).json({ error: "Failed to fetch plant updates" });
    }
  },

  async getUpdate(req, res) {
    try {
      const { id } = req.params;

      const update = await prisma.plantUpdate.findUnique({
        where: { id: parseInt(id) },
        include: { plant: { include: { addedBy: true } } },
      });

      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }

      res.json(update);
    } catch (error) {
      console.error("Error fetching plant update:", error);
      res.status(500).json({ error: "Failed to fetch plant update" });
    }
  },

  async deleteUpdate(req, res) {
    try {
      const { id } = req.params;

      const update = await prisma.plantUpdate.findUnique({
        where: { id: parseInt(id) },
        include: { plant: { include: { addedBy: true } } },
      });

      if (!update) {
        return res.status(404).json({ error: "Update not found" });
      }

      // Check if user has permission to delete
      if (update.plant.addedBy.id !== req.user.userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this update" });
      }

      await prisma.plantUpdate.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Update deleted successfully" });
    } catch (error) {
      console.error("Error deleting plant update:", error);
      res.status(500).json({ error: "Failed to delete plant update" });
    }
  },
};

export default plantUpdateController;

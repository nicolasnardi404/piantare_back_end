import { PrismaClient } from "@prisma/client";
import { uploadFile } from "../services/uploadService.js";

const prisma = new PrismaClient();

const plantUpdateController = {
  async createGroupUpdate(req, res) {
    try {
      const {
        plantGroupId,
        updates, // Array of updates for plants in the group
      } = req.body;

      // Validate required fields
      if (!plantGroupId || !updates || !Array.isArray(updates)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if plant group exists and user has permission
      const plantGroup = await prisma.plantGroup.findUnique({
        where: { id: parseInt(plantGroupId) },
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

      if (!plantGroup) {
        return res.status(404).json({ error: "Plant group not found" });
      }

      // Only allow updates by the farmer who owns the project or an admin
      if (
        req.user.role !== "ADMIN" &&
        plantGroup.project.farmer.user.id !== req.user.userId
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to update this plant group" });
      }

      // Create the group update and all individual plant updates in a transaction
      const groupUpdate = await prisma.$transaction(async (prisma) => {
        // First create the group update
        const newGroupUpdate = await prisma.plantGroupUpdate.create({
          data: {
            plantGroupId: parseInt(plantGroupId),
            plantUpdates: {
              create: updates.map((update) => ({
                height: parseFloat(update.height),
                diameter: parseFloat(update.diameter),
                healthStatus: update.healthStatus,
                imageUrl: update.imageUrl,
                notes: update.notes,
              })),
            },
          },
          include: {
            plantUpdates: true,
            plantGroup: {
              include: {
                species: true,
              },
            },
          },
        });

        return newGroupUpdate;
      });

      res.status(201).json(groupUpdate);
    } catch (error) {
      console.error("Error in createGroupUpdate:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create group update" });
    }
  },

  async getUpdatesByGroup(req, res) {
    try {
      const { plantGroupId } = req.params;

      // Check if the plant group exists and belongs to the user's project
      const plantGroup = await prisma.plantGroup.findUnique({
        where: { id: parseInt(plantGroupId) },
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
          groupUpdates: {
            include: {
              plantUpdates: true,
            },
            orderBy: {
              id: "desc",
            },
          },
        },
      });

      if (!plantGroup) {
        return res.status(404).json({ error: "Plant group not found" });
      }

      res.json(plantGroup.groupUpdates);
    } catch (error) {
      console.error("Error in getUpdatesByGroup:", error);
      res.status(500).json({ error: "Failed to fetch updates" });
    }
  },

  async deleteGroupUpdate(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      // Check if the group update exists and belongs to user's project
      const groupUpdate = await prisma.plantGroupUpdate.findUnique({
        where: { id: parseInt(id) },
        include: {
          plantGroup: {
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

      if (!groupUpdate) {
        return res.status(404).json({ error: "Group update not found" });
      }

      // Verify that the user owns the project this group belongs to
      if (groupUpdate.plantGroup.project.farmer.user.id !== userId) {
        return res.status(403).json({
          error: "You can only delete updates for plants in your projects",
        });
      }

      // Delete the group update (this will cascade delete all plant updates)
      await prisma.plantGroupUpdate.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Group update deleted successfully" });
    } catch (error) {
      console.error("Error in deleteGroupUpdate:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to delete group update" });
    }
  },
};

export default plantUpdateController;

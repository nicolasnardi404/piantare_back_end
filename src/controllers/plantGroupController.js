import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const plantGroupController = {
  // Create a new plant group in a project
  async createPlantGroup(req, res) {
    try {
      const { projectId, speciesId, successionStage } = req.body;
      const { userId } = req.user;

      // Validate required fields
      if (!projectId || !speciesId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify project exists and belongs to the farmer
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
        include: {
          farmer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.farmer.user.id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to modify this project" });
      }

      // Create the plant group
      const plantGroup = await prisma.plantGroup.create({
        data: {
          projectId: parseInt(projectId),
          speciesId: parseInt(speciesId),
          successionStage: successionStage || "PIONEER",
        },
        include: {
          species: true,
          project: {
            include: {
              farmer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      res.status(201).json(plantGroup);
    } catch (error) {
      console.error("Error in createPlantGroup:", error);
      res.status(500).json({ error: "Failed to create plant group" });
    }
  },

  // Get all plant groups in a project
  async getProjectPlantGroups(req, res) {
    try {
      const { projectId } = req.params;
      const { userId } = req.user;

      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId) },
        include: {
          farmer: {
            include: {
              user: true,
            },
          },
          plantGroups: {
            include: {
              species: true,
              plantedPlants: true,
              groupUpdates: {
                orderBy: {
                  id: "desc",
                },
                take: 1,
                include: {
                  plantUpdates: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Only allow access to the project owner or admin
      if (req.user.role !== "ADMIN" && project.farmer.user.id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this project" });
      }

      res.json(project.plantGroups);
    } catch (error) {
      console.error("Error in getProjectPlantGroups:", error);
      res.status(500).json({ error: "Failed to fetch plant groups" });
    }
  },

  // Get a specific plant group with details
  async getPlantGroupDetails(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const plantGroup = await prisma.plantGroup.findUnique({
        where: { id: parseInt(id) },
        include: {
          species: true,
          project: {
            include: {
              farmer: {
                include: {
                  user: true,
                },
              },
            },
          },
          plantedPlants: {
            include: {
              company: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          groupUpdates: {
            orderBy: {
              id: "desc",
            },
            include: {
              plantUpdates: true,
            },
          },
        },
      });

      if (!plantGroup) {
        return res.status(404).json({ error: "Plant group not found" });
      }

      // Only allow access to the project owner or admin
      if (
        req.user.role !== "ADMIN" &&
        plantGroup.project.farmer.user.id !== userId
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this plant group" });
      }

      res.json(plantGroup);
    } catch (error) {
      console.error("Error in getPlantGroupDetails:", error);
      res.status(500).json({ error: "Failed to fetch plant group details" });
    }
  },

  // Update a plant group
  async updatePlantGroup(req, res) {
    try {
      const { id } = req.params;
      const { successionStage } = req.body;
      const { userId } = req.user;

      // Check if plant group exists and user has permission
      const existingGroup = await prisma.plantGroup.findUnique({
        where: { id: parseInt(id) },
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

      if (!existingGroup) {
        return res.status(404).json({ error: "Plant group not found" });
      }

      if (existingGroup.project.farmer.user.id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to modify this plant group" });
      }

      // Update the plant group
      const updatedGroup = await prisma.plantGroup.update({
        where: { id: parseInt(id) },
        data: {
          successionStage,
        },
        include: {
          species: true,
          project: {
            include: {
              farmer: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      res.json(updatedGroup);
    } catch (error) {
      console.error("Error in updatePlantGroup:", error);
      res.status(500).json({ error: "Failed to update plant group" });
    }
  },

  // Delete a plant group
  async deletePlantGroup(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      // Check if plant group exists and user has permission
      const plantGroup = await prisma.plantGroup.findUnique({
        where: { id: parseInt(id) },
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

      if (plantGroup.project.farmer.user.id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this plant group" });
      }

      // Delete the plant group (this will cascade delete related records)
      await prisma.plantGroup.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Plant group deleted successfully" });
    } catch (error) {
      console.error("Error in deletePlantGroup:", error);
      res.status(500).json({ error: "Failed to delete plant group" });
    }
  },
};

export default plantGroupController;

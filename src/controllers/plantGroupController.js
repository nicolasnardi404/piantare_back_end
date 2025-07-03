import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const plantGroupController = {
  // Create a new plant group for a project
  async createPlantGroup(req, res) {
    try {
      const { projectId } = req.params;
      const { species, quantity, notes, plannedPlantingDate } = req.body;
      const { userId, role } = req.user;

      // Verify project access
      let project;
      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer) {
          return res.status(400).json({ error: "User is not a farmer" });
        }

        project = await prisma.project.findFirst({
          where: {
            id: parseInt(projectId),
            farmerId: farmer.id,
          },
        });
      }

      if (!project) {
        return res
          .status(404)
          .json({ error: "Project not found or access denied" });
      }

      // Find or create the plant species
      let plantSpecies;
      if (typeof species === "string") {
        // If species is a string (common name), try to find existing species
        plantSpecies = await prisma.plantSpecies.findFirst({
          where: {
            commonName: {
              equals: species,
              mode: "insensitive", // Case insensitive search
            },
          },
        });

        if (!plantSpecies) {
          return res.status(400).json({
            error: `Espécie "${species}" não encontrada no catálogo. Por favor, selecione uma espécie válida.`,
          });
        }
      } else if (species && species.id) {
        // If species is an object with id, use that
        plantSpecies = await prisma.plantSpecies.findUnique({
          where: { id: parseInt(species.id) },
        });

        if (!plantSpecies) {
          return res.status(400).json({ error: "Espécie não encontrada" });
        }
      } else {
        return res.status(400).json({ error: "Espécie é obrigatória" });
      }

      // Create the plant group
      const plantGroup = await prisma.plantGroup.create({
        data: {
          speciesId: plantSpecies.id, // Use the species ID instead of the species string
          projectId: parseInt(projectId),
          // Add any additional fields if needed
        },
        include: {
          species: true, // Include the species data in the response
          _count: {
            select: {
              plantedPlants: true,
            },
          },
        },
      });

      res.status(201).json(plantGroup);
    } catch (error) {
      console.error("Error creating plant group:", error);
      res.status(500).json({ error: "Failed to create plant group" });
    }
  },

  // Add planted plants to a group with their coordinates
  async addPlantedPlants(req, res) {
    try {
      const { groupId } = req.params;
      const { coordinates } = req.body;
      const { userId, role } = req.user;

      if (!Array.isArray(coordinates)) {
        return res.status(400).json({ error: "Coordinates must be an array" });
      }

      // Verify access to the group's project
      const plantGroup = await prisma.plantGroup.findUnique({
        where: { id: parseInt(groupId) },
        include: {
          project: {
            include: {
              farmer: true,
            },
          },
        },
      });

      if (!plantGroup) {
        return res.status(404).json({ error: "Plant group not found" });
      }

      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer || plantGroup.project.farmerId !== farmer.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Create all planted plants in a transaction
      const plantedPlants = await prisma.$transaction(
        coordinates.map((coord) =>
          prisma.plantedPlant.create({
            data: {
              coordinates: coord,
              plantGroup: {
                connect: { id: parseInt(groupId) },
              },
            },
          })
        )
      );

      // Return updated group with count
      const updatedGroup = await prisma.plantGroup.findUnique({
        where: { id: parseInt(groupId) },
        include: {
          _count: {
            select: {
              plantedPlants: true,
            },
          },
          plantedPlants: {
            select: {
              id: true,
              coordinates: true,
            },
          },
        },
      });

      res.json(updatedGroup);
    } catch (error) {
      console.error("Error adding planted plants:", error);
      res.status(500).json({ error: "Failed to add planted plants" });
    }
  },

  // Get all plant groups for a project
  async getProjectPlantGroups(req, res) {
    try {
      const { projectId } = req.params;
      const { userId, role } = req.user;

      // Verify project access
      let project;
      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer) {
          return res.status(400).json({ error: "User is not a farmer" });
        }

        project = await prisma.project.findFirst({
          where: {
            id: parseInt(projectId),
            farmerId: farmer.id,
          },
        });
      }

      if (!project) {
        return res
          .status(404)
          .json({ error: "Project not found or access denied" });
      }

      // Get all plant groups with their planted plants
      const plantGroups = await prisma.plantGroup.findMany({
        where: {
          projectId: parseInt(projectId),
        },
        include: {
          _count: {
            select: {
              plantedPlants: true,
            },
          },
          plantedPlants: {
            select: {
              id: true,
              coordinates: true,
            },
          },
        },
      });

      res.json(plantGroups);
    } catch (error) {
      console.error("Error fetching plant groups:", error);
      res.status(500).json({ error: "Failed to fetch plant groups" });
    }
  },

  // Delete a plant group
  async deletePlantGroup(req, res) {
    try {
      const { groupId } = req.params;
      const { userId, role } = req.user;

      // Verify access to the group's project
      const plantGroup = await prisma.plantGroup.findUnique({
        where: { id: parseInt(groupId) },
        include: {
          project: {
            include: {
              farmer: true,
            },
          },
        },
      });

      if (!plantGroup) {
        return res.status(404).json({ error: "Plant group not found" });
      }

      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer || plantGroup.project.farmerId !== farmer.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Delete the plant group (this will cascade delete all plantedPlants)
      await prisma.plantGroup.delete({
        where: { id: parseInt(groupId) },
      });

      res.json({ message: "Plant group deleted successfully" });
    } catch (error) {
      console.error("Error deleting plant group:", error);
      res.status(500).json({ error: "Failed to delete plant group" });
    }
  },

  // Get details of a specific plant group
  async getPlantGroupDetails(req, res) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      // Find the plant group with its project and planted plants
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
          _count: {
            select: {
              plantedPlants: true,
            },
          },
          plantedPlants: {
            select: {
              id: true,
              coordinates: true,
            },
          },
        },
      });

      if (!plantGroup) {
        return res.status(404).json({ error: "Plant group not found" });
      }

      // Check access permissions
      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer || plantGroup.project.farmer.id !== farmer.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      res.json(plantGroup);
    } catch (error) {
      console.error("Error fetching plant group details:", error);
      res.status(500).json({ error: "Failed to fetch plant group details" });
    }
  },

  // Update a plant group
  async updatePlantGroup(req, res) {
    try {
      const { id } = req.params;
      const { species } = req.body;
      const { userId } = req.user;

      // Find the plant group and check ownership
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

      // Verify that the user owns the project this group belongs to
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
      });

      if (!farmer || plantGroup.project.farmer.id !== farmer.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Update the plant group
      const updatedGroup = await prisma.plantGroup.update({
        where: { id: parseInt(id) },
        data: {
          species,
        },
        include: {
          _count: {
            select: {
              plantedPlants: true,
            },
          },
          plantedPlants: {
            select: {
              id: true,
              coordinates: true,
            },
          },
        },
      });

      res.json(updatedGroup);
    } catch (error) {
      console.error("Error updating plant group:", error);
      res.status(500).json({ error: "Failed to update plant group" });
    }
  },
};

export default plantGroupController;

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const plantLocationController = {
  // Get all plant locations (filtered by role)
  async getAllLocations(req, res) {
    try {
      const locations = await prisma.plantLocation.findMany({
        include: {
          plant: {
            select: {
              id: true,
              nomePopular: true,
              nomeCientifico: true,
              categoria: true,
              altura: true,
              origem: true,
              especificacao: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          addedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              bio: true,
              imageUrl: true,
            },
          },
          updates: {
            select: {
              id: true,
              healthStatus: true,
              notes: true,
              imageUrl: true,
              updateDate: true,
            },
            orderBy: {
              updateDate: "desc",
            },
          },
        },
      });

      res.json(locations);
    } catch (error) {
      console.error("Error in getAllLocations:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  },

  // Add a new plant location (only farmers can add)
  async addLocation(req, res) {
    try {
      const { latitude, longitude, plantId, description, imageUrl } = req.body;
      const { userId } = req.user;

      // Validate input
      if (!latitude || !longitude || !plantId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify that the plant exists
      const plant = await prisma.plant.findUnique({
        where: { id: parseInt(plantId) },
      });

      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      const location = await prisma.plantLocation.create({
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          plantId: parseInt(plantId),
          description,
          imageUrl,
          userId,
          // Initially, plants are not assigned to any company
          companyId: null,
        },
        include: {
          plant: true,
          addedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json(location);
    } catch (error) {
      console.error("Error in addLocation:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create plant location" });
    }
  },

  // Assign plant to company (only company admins and admins can do this)
  async assignToCompany(req, res) {
    try {
      const { id } = req.params;
      const { companyId } = req.body;
      const { role, userId } = req.user;

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }

      // If company admin, verify they belong to the company they're assigning to
      if (role === "COMPANY") {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { company: true },
        });

        if (!user.company || user.companyId !== parseInt(companyId)) {
          return res
            .status(403)
            .json({ error: "Not authorized to assign plants to this company" });
        }
      }

      const location = await prisma.plantLocation.update({
        where: { id: parseInt(id) },
        data: { companyId: parseInt(companyId) },
        include: {
          addedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json(location);
    } catch (error) {
      console.error("Error in assignToCompany:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to assign plant to company" });
    }
  },

  // Get a specific plant location
  async getLocation(req, res) {
    try {
      const { id } = req.params;
      const { role, userId } = req.user;

      const location = await prisma.plantLocation.findUnique({
        where: { id: parseInt(id) },
        include: {
          addedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!location) {
        return res.status(404).json({ error: "Plant location not found" });
      }

      // Check access permissions
      switch (role) {
        case "ADMIN":
          // Admin can see all plants
          break;
        case "COMPANY":
          // Company admin can only see plants assigned to their company
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true },
          });
          if (!user.company || location.companyId !== user.companyId) {
            return res.status(403).json({ error: "Access denied" });
          }
          break;
        case "FARMER":
          // Farmers can only see their own plants
          if (location.userId !== userId) {
            return res.status(403).json({ error: "Access denied" });
          }
          break;
        default:
          return res.status(403).json({ error: "Invalid role" });
      }

      res.json(location);
    } catch (error) {
      console.error("Error in getLocation:", error);
      res.status(500).json({ error: "Failed to fetch plant location" });
    }
  },

  // Get plant statistics
  async getStats(req, res) {
    try {
      const { role, userId } = req.user;
      let whereClause = {};

      // Filter plants based on user role
      switch (role) {
        case "ADMIN":
          // Admin can see all plants
          break;
        case "COMPANY":
          // Company users can only see their company's plants
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true },
          });
          if (!user.company) {
            return res
              .status(400)
              .json({ error: "User not associated with any company" });
          }
          whereClause.companyId = user.companyId;
          break;
        case "FARMER":
          // Farmers can only see their own plants
          whereClause.userId = userId;
          break;
        default:
          return res.status(403).json({ error: "Invalid role" });
      }

      // Get all plants with their latest updates
      const plants = await prisma.plantLocation.findMany({
        where: whereClause,
        include: {
          updates: {
            orderBy: {
              updateDate: "desc",
            },
            take: 1,
          },
        },
      });

      // Calculate statistics
      const stats = {
        totalPlants: plants.length,
        healthyPlants: 0,
        needsAttention: 0,
        sickPlants: 0,
        unmonitoredPlants: 0,
      };

      plants.forEach((plant) => {
        if (plant.updates.length === 0) {
          // Plants without updates are considered healthy by default
          stats.healthyPlants++;
        } else {
          const lastUpdate = plant.updates[0];
          switch (lastUpdate.healthStatus) {
            case "HEALTHY":
              stats.healthyPlants++;
              break;
            case "NEEDS_ATTENTION":
              stats.needsAttention++;
              break;
            case "SICK":
              stats.sickPlants++;
              break;
            default:
              // Unknown status plants are considered healthy
              stats.healthyPlants++;
          }
        }
      });

      res.json(stats);
    } catch (error) {
      console.error("Error in getStats:", error);
      res.status(500).json({ error: "Failed to fetch plant statistics" });
    }
  },

  // Get plant locations optimized for map view
  async getMapLocations(req, res) {
    try {
      const locations = await prisma.plantLocation.findMany({
        select: {
          id: true,
          latitude: true,
          longitude: true,
          description: true,
          imageUrl: true,
          createdAt: true,
          plant: {
            select: {
              id: true,
              nomePopular: true,
              nomeCientifico: true,
              categoria: true,
              altura: true,
              origem: true,
              especificacao: true,
            },
          },
          addedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          updates: {
            select: {
              id: true,
              healthStatus: true,
              notes: true,
              imageUrl: true,
              updateDate: true,
            },
            orderBy: {
              updateDate: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(locations);
    } catch (error) {
      console.error("Error in getMapLocations:", error);
      res.status(500).json({ error: "Failed to fetch map locations" });
    }
  },

  // Delete a plant location (farmers can only delete their own, admins can delete any)
  async deleteLocation(req, res) {
    try {
      const { id } = req.params;
      const { role, userId } = req.user;

      // First check if the plant exists
      const plant = await prisma.plantLocation.findUnique({
        where: { id: parseInt(id) },
        include: {
          addedBy: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!plant) {
        return res.status(404).json({ error: "Plant location not found" });
      }

      // Check authorization
      if (role === "FARMER" && plant.addedBy.id !== userId) {
        return res
          .status(403)
          .json({ error: "You can only delete your own plants" });
      }

      // Delete the plant location
      await prisma.plantLocation.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Plant location deleted successfully" });
    } catch (error) {
      console.error("Error in deleteLocation:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to delete plant location" });
    }
  },

  // Get plants assigned to a company
  async getCompanyPlants(req, res) {
    try {
      const { userId } = req.user;

      // Get the user's company
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true },
      });

      if (!user.company) {
        return res
          .status(400)
          .json({ error: "User not associated with any company" });
      }

      // Get all plants assigned to the company
      const locations = await prisma.plantLocation.findMany({
        where: {
          companyId: user.company.id,
        },
        include: {
          plant: {
            select: {
              id: true,
              nomePopular: true,
              nomeCientifico: true,
              categoria: true,
              altura: true,
              origem: true,
              especificacao: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          addedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              bio: true,
              imageUrl: true,
            },
          },
          updates: {
            select: {
              id: true,
              healthStatus: true,
              notes: true,
              imageUrl: true,
              updateDate: true,
            },
            orderBy: {
              updateDate: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(locations);
    } catch (error) {
      console.error("Error in getCompanyPlants:", error);
      res.status(500).json({ error: "Failed to fetch company plants" });
    }
  },
};

export default plantLocationController;

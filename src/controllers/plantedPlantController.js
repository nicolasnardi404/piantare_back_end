import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const plantedPlantController = {
  // Get all plant locations (filtered by role)
  async getAllLocations(req, res) {
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

      const locations = await prisma.plantLocation.findMany({
        where: whereClause,
        include: {
          plant: {
            select: {
              id: true,
              commonName: true,
              scientificName: true,
              category: true,
              height: true,
              origin: true,
              specification: true,
            },
          },
          company: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
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
              height: true,
              width: true,
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

  // Get minimal data for map markers
  async getMapMarkers(req, res) {
    try {
      const plants = await prisma.plantedPlant.findMany({
        select: {
          id: true,
          latitude: true,
          longitude: true,
          species: {
            select: {
              commonName: true,
              scientificName: true,
              category: true,
            },
          },
          project: {
            select: {
              farmer: {
                select: {
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
          updates: {
            select: {
              healthStatus: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      });

      res.json(plants);
    } catch (error) {
      console.error("Error in getMapMarkers:", error);
      res.status(500).json({ error: "Failed to fetch map markers" });
    }
  },

  // Get farmer's plants data
  async getFarmerPlants(req, res) {
    try {
      const { userId } = req.user;

      // First get the farmer's ID
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
      });

      if (!farmer) {
        return res.status(400).json({ error: "User is not a farmer" });
      }

      const plants = await prisma.plantedPlant.findMany({
        where: {
          project: {
            farmerId: farmer.id,
          },
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          description: true,
          plantedAt: true,
          species: {
            select: {
              commonName: true,
              scientificName: true,
              category: true,
            },
          },
          updates: {
            select: {
              healthStatus: true,
              height: true,
              diameter: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      res.json(plants);
    } catch (error) {
      console.error("Error in getFarmerPlants:", error);
      res.status(500).json({ error: "Failed to fetch farmer's plants" });
    }
  },

  // Get company's plants data
  async getCompanyPlants(req, res) {
    try {
      const { userId } = req.user;

      const company = await prisma.company.findUnique({
        where: { userId },
      });

      if (!company) {
        return res
          .status(400)
          .json({ error: "User not associated with any company" });
      }

      const plants = await prisma.plantedPlant.findMany({
        where: {
          companyId: company.id,
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          description: true,
          plantedAt: true,
          species: {
            select: {
              commonName: true,
              scientificName: true,
              category: true,
            },
          },
          project: {
            select: {
              farmer: {
                select: {
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
          updates: {
            select: {
              healthStatus: true,
              height: true,
              diameter: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      res.json(plants);
    } catch (error) {
      console.error("Error in getCompanyPlants:", error);
      res.status(500).json({ error: "Failed to fetch company's plants" });
    }
  },

  // Get detailed plant data
  async getPlantDetails(req, res) {
    try {
      const { id } = req.params;
      const { role, userId } = req.user;

      const plant = await prisma.plantedPlant.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          description: true,
          plantedAt: true,
          species: {
            select: {
              id: true,
              commonName: true,
              scientificName: true,
              category: true,
              height: true,
              origin: true,
              specification: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              farmer: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      bio: true,
                    },
                  },
                },
              },
            },
          },
          company: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          updates: {
            select: {
              id: true,
              healthStatus: true,
              notes: true,
              imageUrl: true,
              height: true,
              diameter: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      // Check access permissions for farmers
      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer || plant.project.farmer.user.id !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      res.json(plant);
    } catch (error) {
      console.error("Error in getPlantDetails:", error);
      res.status(500).json({ error: "Failed to fetch plant details" });
    }
  },

  // Add a new planted plant (only farmers can add)
  async addPlant(req, res) {
    try {
      const {
        latitude,
        longitude,
        speciesId,
        description,
        projectId,
        imageUrl,
        height,
        diameter,
      } = req.body;
      const { userId } = req.user;

      // Validate input
      if (
        !latitude ||
        !longitude ||
        !speciesId ||
        !projectId ||
        !imageUrl ||
        !height ||
        !diameter
      ) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      // Verify that the species exists
      const species = await prisma.plantSpecies.findUnique({
        where: { id: parseInt(speciesId) },
      });

      if (!species) {
        return res.status(404).json({ error: "Plant species not found" });
      }

      // Verify project exists and belongs to the farmer
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
        include: {
          projects: {
            where: { id: parseInt(projectId) },
          },
        },
      });

      if (!farmer || farmer.projects.length === 0) {
        return res
          .status(403)
          .json({ error: "Project not found or not authorized" });
      }

      // Use a transaction to create both the planted plant and initial update
      const plant = await prisma.$transaction(async (prisma) => {
        // Create the planted plant
        const newPlant = await prisma.plantedPlant.create({
          data: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            speciesId: parseInt(speciesId),
            description,
            projectId: parseInt(projectId),
          },
        });

        // Create the initial plant update
        await prisma.plantUpdate.create({
          data: {
            plantedPlantId: newPlant.id,
            imageUrl,
            height: parseFloat(height),
            diameter: parseFloat(diameter),
            notes: "Initial planting",
            healthStatus: "HEALTHY",
          },
        });

        // Return the plant with all related data
        return prisma.plantedPlant.findUnique({
          where: { id: newPlant.id },
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
            updates: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        });
      });

      res.status(201).json(plant);
    } catch (error) {
      console.error("Error in addPlant:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create planted plant" });
    }
  },

  // Delete a planted plant
  async deletePlant(req, res) {
    try {
      const { id } = req.params;
      const { role, userId } = req.user;

      // First check if the plant exists and get farmer info
      const plant = await prisma.plantedPlant.findUnique({
        where: { id: parseInt(id) },
        include: {
          project: {
            include: {
              farmer: true,
            },
          },
        },
      });

      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      // Check authorization
      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer || plant.project.farmerId !== farmer.id) {
          return res
            .status(403)
            .json({ error: "You can only delete your own plants" });
        }
      }

      // Delete the plant (updates will be cascade deleted)
      await prisma.plantedPlant.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Plant deleted successfully" });
    } catch (error) {
      console.error("Error in deletePlant:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to delete plant" });
    }
  },

  // Assign plant to company (only admins can do this)
  async assignToCompany(req, res) {
    try {
      const { id } = req.params;
      const { companyId } = req.body;

      if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
      }

      // Verify that the company exists
      const company = await prisma.company.findUnique({
        where: { id: parseInt(companyId) },
      });

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Update the planted plant with the company ID
      const plant = await prisma.plantedPlant.update({
        where: { id: parseInt(id) },
        data: { companyId: parseInt(companyId) },
        include: {
          species: {
            select: {
              commonName: true,
              scientificName: true,
            },
          },
          project: {
            select: {
              name: true,
              farmer: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          company: {
            select: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      res.json(plant);
    } catch (error) {
      console.error("Error in assignToCompany:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to assign plant to company" });
    }
  },

  // Get farmer's dashboard data (plants with stats)
  async getFarmerDashboardData(req, res) {
    try {
      const { userId } = req.user;

      // First get the farmer's ID
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
      });

      if (!farmer) {
        return res.status(400).json({ error: "User is not a farmer" });
      }

      // Get all plants for this farmer with minimal data needed for the dashboard
      const plants = await prisma.plantedPlant.findMany({
        where: {
          project: {
            farmerId: farmer.id,
          },
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          plantedAt: true,
          species: {
            select: {
              commonName: true,
              scientificName: true,
              category: true,
            },
          },
          updates: {
            select: {
              healthStatus: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
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
      };

      plants.forEach((plant) => {
        const lastUpdate = plant.updates[0];
        if (!lastUpdate) {
          stats.healthyPlants++;
        } else {
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
              stats.healthyPlants++;
          }
        }
      });

      res.json({
        stats,
        plants,
      });
    } catch (error) {
      console.error("Error in getFarmerDashboardData:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch farmer's dashboard data" });
    }
  },

  // Get farmer's projects with plant counts
  async getFarmerProjects(req, res) {
    try {
      const { userId } = req.user;

      // Get farmer's ID
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
      });

      if (!farmer) {
        return res.status(400).json({ error: "User is not a farmer" });
      }

      // Get all projects with plant counts
      const projects = await prisma.project.findMany({
        where: {
          farmerId: farmer.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          areaCoordinates: true,
          _count: {
            select: {
              plantedPlants: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(projects);
    } catch (error) {
      console.error("Error in getFarmerProjects:", error);
      res.status(500).json({ error: "Failed to fetch farmer's projects" });
    }
  },

  // Get farmer's plants table data
  async getFarmerPlantsTable(req, res) {
    try {
      const { userId } = req.user;

      // Get farmer's ID
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
      });

      if (!farmer) {
        return res.status(400).json({ error: "User is not a farmer" });
      }

      // Get plants with data needed for the table
      const plants = await prisma.plantedPlant.findMany({
        where: {
          project: {
            farmerId: farmer.id,
          },
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          species: {
            select: {
              commonName: true,
              scientificName: true,
            },
          },
          updates: {
            select: {
              healthStatus: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          plantedAt: "desc",
        },
      });

      res.json(plants);
    } catch (error) {
      console.error("Error in getFarmerPlantsTable:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch farmer's plants table data" });
    }
  },

  // Get complete dashboard data in a single query
  async getFarmerDashboardComplete(req, res) {
    try {
      const { userId } = req.user;

      // Get farmer with all related data
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
        include: {
          projects: {
            orderBy: {
              startDate: "desc",
            },
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              startDate: true,
              endDate: true,
              areaCoordinates: true,
              mapImageUrl: true,
              plantedPlants: {
                select: {
                  id: true,
                  latitude: true,
                  longitude: true,
                  projectId: true,
                  species: {
                    select: {
                      commonName: true,
                      scientificName: true,
                    },
                  },
                  updates: {
                    select: {
                      healthStatus: true,
                      createdAt: true,
                    },
                    orderBy: {
                      createdAt: "desc",
                    },
                    take: 1,
                  },
                },
              },
              _count: {
                select: {
                  plantedPlants: true,
                },
              },
            },
          },
        },
      });

      if (!farmer) {
        return res.status(400).json({ error: "User is not a farmer" });
      }

      // Calculate stats across all projects
      const stats = {
        totalPlants: 0,
        healthyPlants: 0,
        needsAttention: 0,
        sickPlants: 0,
      };

      farmer.projects.forEach((project) => {
        project.plantedPlants.forEach((plant) => {
          stats.totalPlants++;
          const lastUpdate = plant.updates[0];
          if (!lastUpdate) {
            stats.healthyPlants++;
          } else {
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
                stats.healthyPlants++;
            }
          }
        });
      });

      res.json({
        stats,
        projects: farmer.projects,
      });
    } catch (error) {
      console.error("Error in getFarmerDashboardComplete:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  },
};

export default plantedPlantController;

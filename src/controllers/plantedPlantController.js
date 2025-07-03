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
              name: true,
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

      // If no plants found, return empty array instead of null
      if (!plants || plants.length === 0) {
        return res.json([]);
      }

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
              name: true,
              status: true,
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
      console.error("Error in getCompanyPlants:", error);
      res.status(500).json({ error: "Failed to fetch company's plants" });
    }
  },

  // Get company's plants with detailed information
  async getCompanyPlantsDetailed(req, res) {
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
          createdAt: true,
          species: {
            select: {
              commonName: true,
              scientificName: true,
              category: true,
              origin: true,
              height: true,
              specification: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              areaCoordinates: true,
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

      res.json(plants);
    } catch (error) {
      console.error("Error in getCompanyPlantsDetailed:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch detailed company's plants" });
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
        plantGroupId,
        description,
        imageUrl,
        height,
        diameter,
      } = req.body;
      const { userId } = req.user;

      // Validate input
      if (
        !latitude ||
        !longitude ||
        !plantGroupId ||
        !imageUrl ||
        !height ||
        !diameter
      ) {
        return res.status(400).json({
          error: "Missing required fields",
        });
      }

      // Verify that the plant group exists and belongs to the farmer
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

      // Verify the farmer owns the project
      if (plantGroup.project.farmer.user.id !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to add plants to this group" });
      }

      // Use a transaction to create both the planted plant and initial update
      const plant = await prisma.$transaction(async (prisma) => {
        // Create the planted plant
        const newPlant = await prisma.plantedPlant.create({
          data: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            description,
            plantGroupId: parseInt(plantGroupId),
          },
        });

        // Create a new group update with the initial plant update
        await prisma.plantGroupUpdate.create({
          data: {
            plantGroupId: parseInt(plantGroupId),
            plantUpdates: {
              create: [
                {
                  height: parseFloat(height),
                  diameter: parseFloat(diameter),
                  healthStatus: "HEALTHY",
                  imageUrl,
                  notes: "Initial planting",
                },
              ],
            },
          },
        });

        // Return the plant with all related data
        return prisma.plantedPlant.findUnique({
          where: { id: newPlant.id },
          include: {
            plantGroup: {
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
              },
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
      const updatedPlant = await prisma.plantedPlant.update({
        where: { id: parseInt(id) },
        data: { companyId: parseInt(companyId) },
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
          project: {
            select: {
              name: true,
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
        },
      });

      res.json(updatedPlant);
    } catch (error) {
      console.error("Error in assignToCompany:", error);
      res.status(500).json({ error: "Failed to assign plant to company" });
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
              plantGroups: {
                select: {
                  id: true,
                  species: {
                    select: {
                      commonName: true,
                      scientificName: true,
                    },
                  },
                  plantedPlants: {
                    select: {
                      id: true,
                      latitude: true,
                      longitude: true,
                      plantedAt: true,
                    },
                  },
                  _count: {
                    select: {
                      plantedPlants: true,
                    },
                  },
                  groupUpdates: {
                    orderBy: {
                      id: "desc",
                    },
                    take: 1,
                    select: {
                      plantUpdates: {
                        select: {
                          healthStatus: true,
                          createdAt: true,
                        },
                      },
                    },
                  },
                },
              },
              _count: {
                select: {
                  plantGroups: true,
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

      // Process projects and calculate totals
      const projects = farmer.projects.map((project) => {
        let projectStats = {
          totalPlants: 0,
          healthyPlants: 0,
          needsAttention: 0,
          sickPlants: 0,
        };

        project.plantGroups.forEach((group) => {
          const plantCount =
            group._count?.plantedPlants ?? group.plantedPlants.length;
          projectStats.totalPlants += plantCount;
          stats.totalPlants += plantCount;

          // Get health status from the latest group update
          const latestUpdate = group.groupUpdates[0];
          if (!latestUpdate || !latestUpdate.plantUpdates.length) {
            // If no updates, consider plants healthy by default
            projectStats.healthyPlants += plantCount;
            stats.healthyPlants += plantCount;
          } else {
            // Count health statuses from the latest group update
            latestUpdate.plantUpdates.forEach((update) => {
              switch (update.healthStatus) {
                case "HEALTHY":
                  projectStats.healthyPlants++;
                  stats.healthyPlants++;
                  break;
                case "NEEDS_ATTENTION":
                  projectStats.needsAttention++;
                  stats.needsAttention++;
                  break;
                case "SICK":
                  projectStats.sickPlants++;
                  stats.sickPlants++;
                  break;
                default:
                  projectStats.healthyPlants++;
                  stats.healthyPlants++;
              }
            });
          }
        });

        return {
          ...project,
          stats: projectStats,
        };
      });

      res.json({
        stats,
        projects,
      });
    } catch (error) {
      console.error("Error in getFarmerDashboardComplete:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  },

  // Get plants list for admin panel
  async getAdminPlantsList(req, res) {
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
            },
          },
          project: {
            select: {
              name: true,
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
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(plants);
    } catch (error) {
      console.error("Error in getAdminPlantsList:", error);
      res.status(500).json({ error: "Failed to fetch plants list" });
    }
  },
};

export default plantedPlantController;

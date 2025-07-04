import { PrismaClient } from "@prisma/client";
import uploadService from "../services/uploadService.js";

const prisma = new PrismaClient();

const projectController = {
  // Get projects for logged in user (optimized query based on role)
  async getProjects(req, res) {
    try {
      const { userId, role } = req.user;

      // Different query based on user role
      let projects;
      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer) {
          return res.status(400).json({ error: "User is not a farmer" });
        }

        projects = await prisma.project.findMany({
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
            plantGroups: {
              select: {
                _count: {
                  select: {
                    plantedPlants: true,
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
          orderBy: {
            startDate: "desc",
          },
        });

        // Calculate total plants for each project
        projects = projects.map((project) => ({
          ...project,
          totalPlants: project.plantGroups.reduce(
            (sum, group) => sum + group._count.plantedPlants,
            0
          ),
        }));
      } else if (role === "COMPANY") {
        const company = await prisma.company.findUnique({
          where: { userId },
        });

        if (!company) {
          return res.status(400).json({ error: "User is not a company" });
        }

        projects = await prisma.project.findMany({
          where: {
            companyId: company.id,
          },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
            areaCoordinates: true,
            plantGroups: {
              select: {
                _count: {
                  select: {
                    plantedPlants: true,
                  },
                },
              },
            },
            _count: {
              select: {
                plantGroups: true,
              },
            },
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
          orderBy: {
            startDate: "desc",
          },
        });

        // Calculate total plants for each project
        projects = projects.map((project) => ({
          ...project,
          totalPlants: project.plantGroups.reduce(
            (sum, group) => sum + group._count.plantedPlants,
            0
          ),
        }));
      }

      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Get specific project details
  async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

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
            id: parseInt(id),
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
            mapImageUrl: true,
            plantGroups: {
              select: {
                id: true,
                species: true,
                _count: {
                  select: {
                    plantedPlants: true,
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
        });

        if (project) {
          project.totalPlants = project.plantGroups.reduce(
            (sum, group) => sum + group._count.plantedPlants,
            0
          );
        }
      } else if (role === "COMPANY") {
        const company = await prisma.company.findUnique({
          where: { userId },
        });

        if (!company) {
          return res.status(400).json({ error: "User is not a company" });
        }

        project = await prisma.project.findFirst({
          where: {
            id: parseInt(id),
            companyId: company.id,
          },
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            startDate: true,
            endDate: true,
            areaCoordinates: true,
            plantGroups: {
              select: {
                id: true,
                species: true,
                _count: {
                  select: {
                    plantedPlants: true,
                  },
                },
              },
            },
            _count: {
              select: {
                plantGroups: true,
              },
            },
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
        });

        if (project) {
          project.totalPlants = project.plantGroups.reduce(
            (sum, group) => sum + group._count.plantedPlants,
            0
          );
        }
      }

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Create a new project
  async createProject(req, res) {
    try {
      const { userId } = req.user;
      const {
        name,
        description,
        status,
        startDate,
        endDate,
        areaCoordinates,
        mapImageUrl,
      } = req.body;

      // First get the farmer's ID
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
      });

      if (!farmer) {
        return res.status(400).json({ error: "User is not a farmer" });
      }

      let finalMapImageUrl = mapImageUrl;

      // Create the project
      const project = await prisma.project.create({
        data: {
          name,
          description,
          status,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          areaCoordinates: areaCoordinates,
          mapImageUrl: finalMapImageUrl,
          farmerId: farmer.id,
        },
        include: {
          farmer: {
            select: {
              id: true,
              farmSize: true,
              location: true,
              user: {
                select: {
                  name: true,
                  email: true,
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
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Error in createProject:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create project" });
    }
  },

  // Update a project
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;
      const {
        name,
        description,
        status,
        startDate,
        endDate,
        areaCoordinates,
        mapImageUrl,
      } = req.body;

      // Verify ownership based on role
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
            id: parseInt(id),
            farmerId: farmer.id,
          },
        });
      } else if (role === "COMPANY") {
        const company = await prisma.company.findUnique({
          where: { userId },
        });

        if (!company) {
          return res.status(400).json({ error: "User is not a company" });
        }

        project = await prisma.project.findFirst({
          where: {
            id: parseInt(id),
            companyId: company.id,
          },
        });
      }

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Update the project
      const updatedProject = await prisma.project.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          status,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          areaCoordinates,
          mapImageUrl,
        },
        include: {
          farmer: {
            select: {
              id: true,
              farmSize: true,
              location: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              plantedPlants: true,
            },
          },
        },
      });

      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Delete a project
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      // Check if project exists and get farmer info
      const project = await prisma.project.findUnique({
        where: { id: parseInt(id) },
        include: {
          farmer: true,
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check authorization
      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer || project.farmerId !== farmer.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Delete the project (this will cascade delete all related plantedPlants)
      await prisma.project.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error in deleteProject:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to delete project" });
    }
  },
};

export default projectController;

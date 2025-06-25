import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const projectController = {
  // Get projects for logged in user (optimized query based on role)
  async getProjects(req, res) {
    try {
      const { userId, role } = req.user;

      let whereClause = {};

      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer) {
          return res.status(400).json({ error: "User is not a farmer" });
        }

        whereClause.farmerId = farmer.id;
      } else if (role === "COMPANY") {
        const company = await prisma.company.findUnique({
          where: { userId },
        });

        if (!company) {
          return res
            .status(400)
            .json({ error: "User is not associated with a company" });
        }

        whereClause.companyId = company.id;
      }
      // Admin can see all projects (no where clause needed)

      const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          farmer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          company: {
            include: {
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
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(projects);
    } catch (error) {
      console.error("Error in getProjects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  },

  // Get specific project details
  async getProjectById(req, res) {
    try {
      const { userId, role } = req.user;
      const projectId = parseInt(req.params.id);

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
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
          farmer: {
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
          locations: {
            include: {
              plant: true,
            },
          },
          _count: {
            select: { locations: true },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check if user has access to this project
      const hasAccess =
        project.createdBy.id === userId ||
        project.company?.user?.id === userId ||
        project.farmer?.user?.id === userId ||
        role === "ADMIN";

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error in getProjectById:", error);
      res.status(500).json({ error: "Failed to fetch project details" });
    }
  },

  // Create a new project
  async createProject(req, res) {
    try {
      const { userId } = req.user;
      const { name, description, status, startDate, endDate, areaCoordinates } =
        req.body;

      // First get the farmer's ID
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
      });

      if (!farmer) {
        return res.status(400).json({ error: "User is not a farmer" });
      }

      // Create the project
      const project = await prisma.project.create({
        data: {
          name,
          description,
          status,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          areaCoordinates: areaCoordinates,
          farmerId: farmer.id,
        },
        include: {
          farmer: {
            include: {
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
      const { name, description, status, startDate, endDate, areaCoordinates } =
        req.body;

      // Check if project exists and get farmer info
      const existingProject = await prisma.project.findUnique({
        where: { id: parseInt(id) },
        include: {
          farmer: true,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check authorization
      if (role === "FARMER") {
        const farmer = await prisma.farmer.findUnique({
          where: { userId },
        });

        if (!farmer || existingProject.farmerId !== farmer.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      // Update the project
      const project = await prisma.project.update({
        where: { id: parseInt(id) },
        data: {
          name,
          description,
          status,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          areaCoordinates: areaCoordinates,
        },
        include: {
          farmer: {
            include: {
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

      res.json(project);
    } catch (error) {
      console.error("Error in updateProject:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to update project" });
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

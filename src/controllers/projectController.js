import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const projectController = {
  // Get projects for logged in user (optimized query based on role)
  async getProjects(req, res) {
    try {
      const { userId, role } = req.user;
      let projects;

      if (role === "ADMIN") {
        // Admins can see all projects
        projects = await prisma.project.findMany({
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
            locations: true,
            _count: {
              select: { locations: true },
            },
          },
        });
      } else if (role === "COMPANY") {
        // Companies see their own projects
        projects = await prisma.project.findMany({
          where: {
            OR: [{ userId }, { company: { userId } }],
          },
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
            locations: true,
            _count: {
              select: { locations: true },
            },
          },
        });
      } else {
        // Farmers see their own projects
        projects = await prisma.project.findMany({
          where: {
            OR: [{ userId }, { farmer: { userId } }],
          },
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
            locations: true,
            _count: {
              select: { locations: true },
            },
          },
        });
      }

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
      const { userId, role } = req.user;
      const { name, description, status, startDate, endDate, areaCoordinates } =
        req.body;

      const projectData = {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        areaCoordinates,
        userId,
      };

      // Add company or farmer relationship based on user role
      if (role === "COMPANY") {
        const company = await prisma.company.findFirst({
          where: { userId },
        });
        if (company) {
          projectData.companyId = company.id;
        }
      } else if (role === "FARMER") {
        const farmer = await prisma.farmer.findFirst({
          where: { userId },
        });
        if (farmer) {
          projectData.farmerId = farmer.id;
        }
      }

      const project = await prisma.project.create({
        data: projectData,
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
          _count: {
            select: { locations: true },
          },
        },
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Error in createProject:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  },

  // Update a project
  async updateProject(req, res) {
    try {
      const { userId, role } = req.user;
      const projectId = parseInt(req.params.id);
      const { name, description, status, startDate, endDate, areaCoordinates } =
        req.body;

      // Check if project exists and user has access
      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          company: true,
          farmer: true,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check if user has access to update this project
      const hasAccess =
        existingProject.userId === userId ||
        existingProject.company?.userId === userId ||
        existingProject.farmer?.userId === userId ||
        role === "ADMIN";

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: {
          name,
          description,
          status,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          areaCoordinates,
        },
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
          _count: {
            select: { locations: true },
          },
        },
      });

      res.json(project);
    } catch (error) {
      console.error("Error in updateProject:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  },

  // Delete a project
  async deleteProject(req, res) {
    try {
      const { userId, role } = req.user;
      const projectId = parseInt(req.params.id);

      // Check if project exists and user has access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          company: true,
          farmer: true,
        },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check if user has access to delete this project
      const hasAccess =
        project.userId === userId ||
        project.company?.userId === userId ||
        project.farmer?.userId === userId ||
        role === "ADMIN";

      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      await prisma.project.delete({
        where: { id: projectId },
      });

      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error in deleteProject:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  },
};

export default projectController;

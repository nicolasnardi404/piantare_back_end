import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const plantLocationController = {
  // Get all plant locations (filtered by role)
  async getAllLocations(req, res) {
    try {
      const { role, userId } = req.user;
      let locations;

      switch (role) {
        case "ADMIN":
          // Admin can see all plants
          locations = await prisma.plantLocation.findMany({
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
          break;

        case "COMPANY":
          // Company admin can see plants assigned to their company
          const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true },
          });

          if (!user.company) {
            return res
              .status(400)
              .json({ error: "Company admin not associated with any company" });
          }

          locations = await prisma.plantLocation.findMany({
            where: { companyId: user.companyId },
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
          break;

        case "FARMER":
          // Farmers can see all plants they've added
          locations = await prisma.plantLocation.findMany({
            where: { userId },
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
          break;

        default:
          return res.status(403).json({ error: "Invalid role" });
      }

      res.json(locations);
    } catch (error) {
      console.error("Error in getAllLocations:", error);
      res.status(500).json({ error: "Failed to fetch plant locations" });
    }
  },

  // Add a new plant location (only farmers can add)
  async addLocation(req, res) {
    try {
      const { latitude, longitude, species, description } = req.body;
      const { userId } = req.user;

      // Validate input
      if (!latitude || !longitude || !species) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const location = await prisma.plantLocation.create({
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          species,
          description,
          userId,
          // Initially, plants are not assigned to any company
          companyId: null,
        },
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
};

export default plantLocationController;

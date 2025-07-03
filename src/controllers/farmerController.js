import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const farmerController = {
  // Get farmer profile for logged in user
  getFarmerProfile: async (req, res) => {
    try {
      const farmer = await prisma.farmer.findUnique({
        where: { userId: req.user.id },
        include: {
          projects: {
            orderBy: { startDate: "desc" },
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
                      plantGroupId: true,
                      updates: {
                        select: {
                          healthStatus: true,
                          createdAt: true,
                        },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                      },
                    },
                  },
                },
              },
              _count: { select: { plantedPlants: true } },
            },
          },
        },
      });

      if (!farmer) {
        return res.status(404).json({ message: "Farmer profile not found" });
      }

      res.json(farmer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update farmer profile for logged in user
  updateFarmerProfile: async (req, res) => {
    try {
      const { farmName, farmSize, location, expertise, certifications } =
        req.body;

      const updatedFarmer = await prisma.farmer.update({
        where: { userId: req.user.id },
        data: {
          farmName,
          farmSize,
          location,
          expertise,
          certifications,
        },
      });

      res.json(updatedFarmer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all farmers (admin only)
  getAllFarmers: async (req, res) => {
    try {
      const farmers = await prisma.farmer.findMany({
        include: { user: true },
      });
      res.json(farmers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get specific farmer by ID (admin only)
  getFarmerById: async (req, res) => {
    try {
      const farmer = await prisma.farmer.findUnique({
        where: { id: parseInt(req.params.id) },
        include: { user: true },
      });

      if (!farmer) {
        return res.status(404).json({ message: "Farmer not found" });
      }

      res.json(farmer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create new farmer profile (admin only)
  createFarmer: async (req, res) => {
    try {
      const {
        userId,
        farmName,
        farmSize,
        location,
        expertise,
        certifications,
      } = req.body;

      // Check if farmer profile already exists for this user
      const existingFarmer = await prisma.farmer.findUnique({
        where: { userId: parseInt(userId) },
      });

      if (existingFarmer) {
        return res
          .status(400)
          .json({ message: "Farmer profile already exists for this user" });
      }

      const farmer = await prisma.farmer.create({
        data: {
          user: { connect: { id: parseInt(userId) } },
          farmName,
          farmSize,
          location,
          expertise,
          certifications,
        },
      });

      res.status(201).json(farmer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update farmer (admin only)
  updateFarmer: async (req, res) => {
    try {
      const { farmName, farmSize, location, expertise, certifications } =
        req.body;

      const farmer = await prisma.farmer.update({
        where: { id: parseInt(req.params.id) },
        data: {
          farmName,
          farmSize,
          location,
          expertise,
          certifications,
        },
      });

      res.json(farmer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete farmer (admin only)
  deleteFarmer: async (req, res) => {
    try {
      await prisma.farmer.delete({
        where: { id: parseInt(req.params.id) },
      });

      res.json({ message: "Farmer profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

export default farmerController;

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plantController = {
  // Get lightweight list of all plants (no pagination)
  async getPlantsList(req, res) {
    try {
      const plants = await prisma.plantSpecies.findMany({
        select: {
          id: true,
          commonName: true,
          scientificName: true,
          category: true,
        },
        orderBy: {
          commonName: "asc",
        },
      });

      res.json(plants);
    } catch (error) {
      console.error("Error in getPlantsList:", error);
      res.status(500).json({ error: "Failed to fetch plants list" });
    }
  },

  // Get all plants in the catalog
  async getAllPlants(req, res) {
    try {
      const { page = 1, limit = 10, search = "", category = "" } = req.query;

      // Build the where clause for filtering
      const where = {};
      if (search) {
        where.OR = [
          { commonName: { contains: search, mode: "insensitive" } },
          { scientificName: { contains: search, mode: "insensitive" } },
        ];
      }
      if (category) {
        where.category = category;
      }

      // Get total count
      const total = await prisma.plantSpecies.count({ where });

      // Get paginated plants
      const plants = await prisma.plantSpecies.findMany({
        where,
        orderBy: {
          commonName: "asc",
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      });

      res.json({
        plants,
        total,
      });
    } catch (error) {
      console.error("Error in getAllPlants:", error);
      res.status(500).json({ error: "Failed to fetch plants" });
    }
  },

  // Get a specific plant
  async getPlant(req, res) {
    try {
      const { id } = req.params;
      const plant = await prisma.plantSpecies.findUnique({
        where: { id: parseInt(id) },
        include: {
          plantedPlants: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
              plantedAt: true,
              project: {
                select: {
                  id: true,
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
            },
          },
        },
      });

      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      res.json(plant);
    } catch (error) {
      console.error("Error in getPlant:", error);
      res.status(500).json({ error: "Failed to fetch plant" });
    }
  },

  // Add a new plant to the catalog (admin only)
  async addPlant(req, res) {
    try {
      const {
        commonName,
        scientificName,
        origin,
        height,
        specification,
        category,
      } = req.body;

      // Validate required fields
      if (!commonName || !scientificName || !category) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const plant = await prisma.plantSpecies.create({
        data: {
          commonName,
          scientificName,
          origin,
          height,
          specification,
          category,
        },
      });

      res.status(201).json(plant);
    } catch (error) {
      console.error("Error in addPlant:", error);
      res.status(500).json({ error: "Failed to create plant" });
    }
  },

  // Update a plant in the catalog (admin only)
  async updatePlant(req, res) {
    try {
      const { id } = req.params;
      const {
        commonName,
        scientificName,
        origin,
        height,
        specification,
        category,
      } = req.body;

      const plant = await prisma.plantSpecies.update({
        where: { id: parseInt(id) },
        data: {
          commonName,
          scientificName,
          origin,
          height,
          specification,
          category,
        },
      });

      res.json(plant);
    } catch (error) {
      console.error("Error in updatePlant:", error);
      res.status(500).json({ error: "Failed to update plant" });
    }
  },

  // Delete a plant from the catalog (admin only)
  async deletePlant(req, res) {
    try {
      const { id } = req.params;

      // Check if plant has any locations
      const plant = await prisma.plantSpecies.findUnique({
        where: { id: parseInt(id) },
        include: {
          plantedPlants: true,
        },
      });

      if (plant.plantedPlants.length > 0) {
        return res.status(400).json({
          error:
            "Cannot delete plant species that has planted plants. Remove all planted plants first.",
        });
      }

      await prisma.plantSpecies.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Plant species deleted successfully" });
    } catch (error) {
      console.error("Error in deletePlant:", error);
      res.status(500).json({ error: "Failed to delete plant" });
    }
  },
};

export default plantController;

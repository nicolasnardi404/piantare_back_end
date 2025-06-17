import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const plantLocationController = {
  // Get all plant locations
  async getAllLocations(req, res) {
    try {
      const locations = await prisma.plantLocation.findMany();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plant locations" });
    }
  },

  // Add a new plant location
  async addLocation(req, res) {
    try {
      const { latitude, longitude, species, description } = req.body;
      const location = await prisma.plantLocation.create({
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          species,
          description,
        },
      });
      res.status(201).json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to create plant location" });
    }
  },

  // Get a specific plant location
  async getLocation(req, res) {
    try {
      const { id } = req.params;
      const location = await prisma.plantLocation.findUnique({
        where: { id: parseInt(id) },
      });
      if (!location) {
        return res.status(404).json({ error: "Plant location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plant location" });
    }
  },
};

export default plantLocationController;

const Plant = require("../models/Plant");

// Get all plants
exports.getAllPlants = async (req, res) => {
  try {
    const plants = await Plant.find();
    res.status(200).json(plants);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar plantas", error: error.message });
  }
};

// Get plants by category
exports.getPlantsByCategory = async (req, res) => {
  try {
    const { categoria } = req.params;
    const plants = await Plant.find({ categoria });
    res.status(200).json(plants);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar plantas por categoria",
      error: error.message,
    });
  }
};

// Get a single plant by ID
exports.getPlantById = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({ message: "Planta não encontrada" });
    }
    res.status(200).json(plant);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar planta", error: error.message });
  }
};

// Create a new plant (admin only)
exports.createPlant = async (req, res) => {
  try {
    const plant = new Plant(req.body);
    await plant.save();
    res.status(201).json(plant);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Erro ao criar planta", error: error.message });
  }
};

// Update a plant (admin only)
exports.updatePlant = async (req, res) => {
  try {
    const plant = await Plant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plant) {
      return res.status(404).json({ message: "Planta não encontrada" });
    }
    res.status(200).json(plant);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Erro ao atualizar planta", error: error.message });
  }
};

// Delete a plant (admin only)
exports.deletePlant = async (req, res) => {
  try {
    const plant = await Plant.findByIdAndDelete(req.params.id);
    if (!plant) {
      return res.status(404).json({ message: "Planta não encontrada" });
    }
    res.status(200).json({ message: "Planta removida com sucesso" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao remover planta", error: error.message });
  }
};

// Import plants from CSV data (admin only)
exports.importPlants = async (req, res) => {
  try {
    const plants = req.body.plants;
    const importedPlants = await Plant.insertMany(plants);
    res.status(201).json({
      message: "Plantas importadas com sucesso",
      count: importedPlants.length,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Erro ao importar plantas", error: error.message });
  }
};

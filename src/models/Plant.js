const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
  nomePopular: {
    type: String,
    required: true,
    trim: true,
  },
  nomeCientifico: {
    type: String,
    required: true,
    trim: true,
  },
  origem: {
    type: String,
    trim: true,
  },
  altura: {
    type: String,
    trim: true,
  },
  especificacao: {
    type: String,
    trim: true,
  },
  categoria: {
    type: String,
    required: true,
    enum: [
      "ÁRVORES",
      "ÁRVORES FRUTÍFERAS",
      "CAPINS",
      "FOLHAGENS ALTAS",
      "ARBUSTOS",
      "TREPADEIRAS",
      "AROMÁTICAS E COMESTÍVEIS",
      "PLANTAS DE FORRAÇÃO",
      "PLANTAS AQUÁTICAS OU PALUSTRES",
    ],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
plantSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Plant", plantSchema);

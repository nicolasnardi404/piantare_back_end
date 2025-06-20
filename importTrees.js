import { PrismaClient, PlantCategory } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function importTrees() {
  try {
    const fileContent = fs.readFileSync(
      path.join(__dirname, "..", "vegetação  - VEGETAÇÃO.csv"),
      "utf-8"
    );
    const lines = fileContent.split("\n");

    let currentCategory = "";
    const trees = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const columns = line.split(",");

      // Skip empty lines and header
      if (
        !line ||
        line.startsWith("LISTA DE VEGETAÇÃO") ||
        line.startsWith("NOME POPULAR")
      ) {
        continue;
      }

      // Check for category headers
      if (line.includes("ÁRVORES FRUTÍFERAS")) {
        currentCategory = PlantCategory.ARVORES_FRUTIFERAS;
        continue;
      } else if (line.includes("ÁRVORES")) {
        currentCategory = PlantCategory.ARVORES;
        continue;
      }

      // Skip if we're not in a tree category
      if (!currentCategory || !columns[0]) {
        continue;
      }

      // Skip if we've reached another category
      if (
        line.includes("CAPINS") ||
        line.includes("FOLHAGENS") ||
        line.includes("ARBUSTOS") ||
        line.includes("TREPADEIRAS") ||
        line.includes("AROMÁTICAS") ||
        line.includes("PLANTAS DE FORRAÇÃO") ||
        line.includes("PLANTAS AQUÁTICAS")
      ) {
        break;
      }

      const [nomePopular, nomeCientifico, origem, altura, especificacao] =
        columns;

      // Only add if we have the required fields
      if (nomePopular && nomeCientifico) {
        trees.push({
          nomePopular: nomePopular.trim(),
          nomeCientifico: nomeCientifico.trim(),
          origem: origem?.trim() || null,
          altura: altura?.trim() || null,
          especificacao: especificacao?.trim() || null,
          categoria: currentCategory,
        });
      }
    }

    // First delete existing trees to avoid duplicates
    await prisma.plant.deleteMany({
      where: {
        OR: [
          { categoria: PlantCategory.ARVORES },
          { categoria: PlantCategory.ARVORES_FRUTIFERAS },
        ],
      },
    });

    // Import new trees
    const result = await prisma.plant.createMany({
      data: trees,
    });

    console.log(`Successfully imported ${result.count} trees`);
  } catch (error) {
    console.error("Error importing trees:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importTrees();

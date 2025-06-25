import { PrismaClient, PlantCategory } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

async function importTrees() {
  try {
    const fileContent = fs.readFileSync(
      path.join(__dirname, "..", "vegetação  - VEGETAÇÃO.csv"),
      "utf-8"
    );

    // Split by newlines but handle potential carriage returns
    const lines = fileContent.split(/\r?\n/);

    let currentCategory = "";
    const trees = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

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
        currentCategory = PlantCategory.FRUIT_TREES;
        continue;
      } else if (line.includes("ÁRVORES") && !line.includes("FRUTÍFERAS")) {
        currentCategory = PlantCategory.TREES;
        continue;
      }

      // Skip if we're not in a tree category
      if (!currentCategory) {
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

      const columns = parseCSVLine(line);

      if (!columns[0]) continue; // Skip if first column is empty

      const commonName = columns[0] || null;
      const scientificName = columns[1] || null;
      const origin = columns[2] || null;
      const height = columns[3] || null;
      const specification = columns[4] || null;

      // Only add if we have the required fields
      if (commonName && scientificName) {
        trees.push({
          commonName,
          scientificName,
          origin,
          height,
          specification,
          category: currentCategory,
        });
      }
    }

    // First delete existing trees to avoid duplicates
    await prisma.plantSpecies.deleteMany({
      where: {
        OR: [
          { category: PlantCategory.TREES },
          { category: PlantCategory.FRUIT_TREES },
        ],
      },
    });

    // Import new trees
    const result = await prisma.plantSpecies.createMany({
      data: trees,
    });

    console.log(`Successfully imported ${result.count} trees`);

    // Log some sample data to verify specifications are complete
    console.log("\nSample imported trees (to verify specifications):");
    const sampleTrees = await prisma.plantSpecies.findMany({
      take: 5,
      orderBy: { commonName: "asc" },
    });
    console.log(JSON.stringify(sampleTrees, null, 2));
  } catch (error) {
    console.error("Error importing trees:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importTrees();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updatePlantCategories() {
  try {
    // Get all plants ordered by id
    const plants = await prisma.plant.findMany({
      orderBy: {
        id: "asc",
      },
    });

    // Get plants from index 62 to 100
    const plantsToUpdate = plants.slice(61, 100);

    // Update each plant in the range
    for (const plant of plantsToUpdate) {
      await prisma.plant.update({
        where: {
          id: plant.id,
        },
        data: {
          categoria: "ARVORES_FRUTIFERAS",
        },
      });
      console.log(`Updated plant: ${plant.nomePopular}`);
    }

    console.log("Successfully updated plant categories");
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error updating plant categories:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updatePlantCategories();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function deletePlants() {
  try {
    // First delete all plant locations that reference plants
    await prisma.plantLocation.deleteMany({});

    // Then delete all plants
    await prisma.plant.deleteMany({});

    console.log("Successfully deleted all plants and their locations");
  } catch (error) {
    console.error("Error deleting plants:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deletePlants();

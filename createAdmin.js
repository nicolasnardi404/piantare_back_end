import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createInitialUsers() {
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash("ad123", 10);
    const companyPassword = await bcrypt.hash("com123", 10);
    const farmerPassword = await bcrypt.hash("far123", 10);

    // 1. Create Admin User (no company/farmer)
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@piantare.com" },
      update: { password: adminPassword },
      create: {
        email: "admin@piantare.com",
        password: adminPassword,
        name: "Piantare Admin",
        role: "ADMIN",
      },
    });

    // 2. Create Company User and Company
    const companyUser = await prisma.user.upsert({
      where: { email: "empresa@verde.com" },
      update: { password: companyPassword },
      create: {
        email: "empresa@verde.com",
        password: companyPassword,
        name: "Empresa Verde",
        role: "COMPANY",
        bio: "Projetos de plantio urbano",
        imageUrl: "",
      },
    });
    const company = await prisma.company.upsert({
      where: { userId: companyUser.id },
      update: {},
      create: {
        userId: companyUser.id,
        // add other fields if you add them to your schema
      },
    });

    // 3. Create Farmer User and Farmer
    const farmerUser = await prisma.user.upsert({
      where: { email: "piantare@piantare.com" },
      update: { password: farmerPassword },
      create: {
        email: "piantare@piantare.com",
        password: farmerPassword,
        name: "Piantare",
        role: "FARMER",
        bio: "Especialista em plantio e manutenção de árvores urbanas",
        imageUrl: "",
      },
    });
    const farmer = await prisma.farmer.upsert({
      where: { userId: farmerUser.id },
      update: {},
      create: {
        userId: farmerUser.id,
        // add other fields if you add them to your schema
      },
    });

    console.log("\nUsers created/updated successfully!");
    console.log("\nAdmin User:");
    console.log("Email: admin@piantare.com");
    console.log("Password: ad123");

    console.log("\nCompany User:");
    console.log("Email: empresa@verde.com");
    console.log("Password: com123");

    console.log("\nFarmer User:");
    console.log("Email: piantare@piantare.com");
    console.log("Password: far123");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialUsers();

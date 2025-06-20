import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createInitialUsers() {
  try {
    // Create admin company
    const adminCompany = await prisma.company.upsert({
      where: { email: "admin@piantare.com" },
      update: {},
      create: {
        name: "Piantare Admin",
        email: "admin@piantare.com",
        description: "Administrative Company",
      },
    });

    // Create a regular company
    const regularCompany = await prisma.company.upsert({
      where: { email: "empresa@verde.com" },
      update: {},
      create: {
        name: "Empresa Verde",
        email: "empresa@verde.com",
        description: "Empresa especializada em plantio urbano",
        logoUrl: "",
      },
    });

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const companyPassword = await bcrypt.hash("piantare123", 10);
    const farmerPassword = await bcrypt.hash("piantare123", 10);

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@piantare.com" },
      update: {
        password: adminPassword,
      },
      create: {
        email: "admin@piantare.com",
        password: adminPassword,
        name: "Piantare Admin",
        role: "ADMIN",
        companyId: adminCompany.id,
      },
    });

    // Create company user
    const companyUser = await prisma.user.upsert({
      where: { email: "empresa@verde.com" },
      update: {
        password: companyPassword,
      },
      create: {
        email: "empresa@verde.com",
        password: companyPassword,
        name: "Empresa Verde",
        role: "COMPANY",
        companyId: regularCompany.id,
        bio: "Projetos de plantio urbano",
        imageUrl: "",
      },
    });

    // Create farmer user
    const farmerUser = await prisma.user.upsert({
      where: { email: "piantare@piantare.com" },
      update: {
        password: farmerPassword,
      },
      create: {
        email: "piantare@piantare.com",
        password: farmerPassword,
        name: "Piantare",
        role: "FARMER",
        bio: "Especialista em plantio e manutenção de árvores urbanas",
        imageUrl: "",
      },
    });

    console.log("\nUsers created/updated successfully!");
    console.log("\nAdmin User:");
    console.log("Email: admin@piantare.com");
    console.log("Password: admin123");

    console.log("\nCompany User:");
    console.log("Email: empresa@verde.com");
    console.log("Password: piantare123");

    console.log("\nFarmer User:");
    console.log("Email: piantare@piantare.com");
    console.log("Password: piantare123");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialUsers();

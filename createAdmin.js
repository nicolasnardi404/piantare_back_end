import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Create or update company
    const company = await prisma.company.upsert({
      where: { email: "admin@company.com" },
      update: {},
      create: {
        name: "Admin Company",
        email: "admin@company.com",
        description: "Administrative Company",
      },
    });

    // Hash the password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create or update admin user
    const user = await prisma.user.upsert({
      where: { email: "admin@admin.com" },
      update: {
        password: hashedPassword,
      },
      create: {
        email: "admin@admin.com",
        password: hashedPassword,
        name: "System Admin",
        role: "COMPANY_ADMIN",
        companyId: company.id,
      },
    });

    console.log("Admin user created/updated successfully!");
    console.log("Email: admin@admin.com");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

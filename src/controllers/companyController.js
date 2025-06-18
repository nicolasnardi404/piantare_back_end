import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const companyController = {
  // Get all companies
  async getAllCompanies(req, res) {
    try {
      const companies = await prisma.company.findMany({
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          plantLocations: true,
        },
      });
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  },

  // Create a new company
  async createCompany(req, res) {
    try {
      const { name, email, description, password } = req.body;

      if (!password) {
        return res
          .status(400)
          .json({ error: "Password is required for company account" });
      }

      // Check if company with email already exists
      const existingCompany = await prisma.company.findUnique({
        where: { email },
      });

      if (existingCompany) {
        return res
          .status(400)
          .json({ error: "Company with this email already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create company and its admin user in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create the company first
        const company = await prisma.company.create({
          data: {
            name,
            email,
            description,
          },
        });

        // Create a user account for the company
        const user = await prisma.user.create({
          data: {
            name: `${name} Admin`,
            email,
            password: hashedPassword,
            role: "COMPANY",
            companyId: company.id,
          },
          include: {
            company: true,
          },
        });

        return { company, user };
      });

      // Return the result without the password
      const { company, user } = result;
      const { password: _, ...safeUser } = user;

      // Generate JWT token with companyId
      const tokenPayload = {
        userId: user.id,
        role: user.role,
        companyId: company.id,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        token,
        company,
        user: safeUser,
      });
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  },

  // Update a company
  async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const { name, email, description } = req.body;

      // Check if company exists
      const existingCompany = await prisma.company.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingCompany) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Check if new email is already taken by another company
      if (email !== existingCompany.email) {
        const emailTaken = await prisma.company.findUnique({
          where: { email },
        });
        if (emailTaken) {
          return res.status(400).json({ error: "Email already taken" });
        }
      }

      const company = await prisma.company.update({
        where: { id: parseInt(id) },
        data: {
          name,
          email,
          description,
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to update company" });
    }
  },

  // Delete a company
  async deleteCompany(req, res) {
    try {
      const { id } = req.params;

      // Check if company exists
      const existingCompany = await prisma.company.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingCompany) {
        return res.status(404).json({ error: "Company not found" });
      }

      // Delete the company
      await prisma.company.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete company" });
    }
  },

  getProfile: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      console.log("Fetching profile for company:", companyId);

      if (!companyId) {
        console.error("No company ID found in token:", req.user);
        return res.status(400).json({
          message:
            "No company ID associated with this user. Are you logged in as a company user?",
        });
      }

      const company = await prisma.company.findUnique({
        where: { id: parseInt(companyId) },
        select: {
          id: true,
          name: true,
          email: true,
          description: true,
          logoUrl: true,
        },
      });

      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      console.log("Found company profile:", company);
      res.json(company);
    } catch (error) {
      console.error("Error fetching company profile:", error);
      res.status(500).json({ message: "Error fetching company profile" });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const companyId = req.user.companyId;

      if (!companyId) {
        console.error("No company ID found in token:", req.user);
        return res.status(400).json({
          message:
            "No company ID associated with this user. Are you logged in as a company user?",
        });
      }

      const { name, email, description, logoUrl } = req.body;
      console.log("Updating company profile with data:", {
        name,
        email,
        description,
        logoUrl,
      });

      // Only update fields that are provided
      const updateData = {
        ...(name && { name }),
        ...(email && { email }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
      };

      const updatedCompany = await prisma.company.update({
        where: { id: parseInt(companyId) },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          description: true,
          logoUrl: true,
        },
      });

      console.log("Updated company profile:", updatedCompany);
      res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company profile:", error);
      res.status(500).json({ message: "Error updating company profile" });
    }
  },
};

export default companyController;

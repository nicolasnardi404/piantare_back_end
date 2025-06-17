import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const userController = {
  // Get all users
  async getAllUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },

  // Create a new user (for admin use)
  async createUser(req, res) {
    try {
      const { email, password, name, role, companyId } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          companyId: role === "COMPANY" ? companyId : null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  },

  // Update a user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, password, name, role, companyId } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if new email is already taken
      if (email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email },
        });
        if (emailTaken) {
          return res.status(400).json({ error: "Email already taken" });
        }
      }

      // Prepare update data
      const updateData = {
        email,
        name,
        role,
        companyId: role === "COMPANY" ? companyId : null,
      };

      // If password is provided, hash it
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  },

  // Delete a user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete the user
      await prisma.user.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
};

export default userController;

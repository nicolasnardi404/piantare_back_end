import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const userController = {
  // Get user's own profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.userId;

      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          bio: true,
          imageUrl: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error in getProfile:", error);
      console.error("User from token:", req.user);
      res.status(500).json({ message: "Error fetching profile" });
    }
  },

  // Update user's own profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { name, bio, imageUrl } = req.body;

      const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          name: name || undefined,
          bio: bio || undefined,
          imageUrl: imageUrl || undefined,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          bio: true,
          imageUrl: true,
        },
      });

      res.json(user);
    } catch (error) {
      console.error("Error in updateProfile:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  },

  // Get all users
  async getAllUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          bio: true,
          imageUrl: true,
          company: {
            select: {
              id: true,
            },
          },
          farmer: {
            select: {
              id: true,
              farmSize: true,
              location: true,
              expertise: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },

  // Create a new user (for admin use)
  async createUser(req, res) {
    try {
      const { email, password, name, role, farmSize, location, expertise } =
        req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user and related records in a transaction
      const result = await prisma.$transaction(async (prisma) => {
        // Create the user first
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role,
          },
        });

        // Create related records based on role
        if (role === "COMPANY") {
          await prisma.company.create({
            data: {
              userId: user.id,
            },
          });
        } else if (role === "FARMER") {
          await prisma.farmer.create({
            data: {
              userId: user.id,
              farmSize: farmSize ? parseFloat(farmSize) : null,
              location: location || null,
              expertise: expertise || [],
            },
          });
        }

        // Return user with relationships
        return await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            company: true,
            farmer: true,
          },
        });
      });

      // Return the result without password
      const { password: _, ...userWithoutPassword } = result;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
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

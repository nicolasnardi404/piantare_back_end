import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authController = {
  // Register a new user
  async register(req, res) {
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
      });

      // Generate JWT token with companyId if user is a company user
      const tokenPayload = {
        userId: user.id,
        role: user.role,
        ...(user.role === "COMPANY" && { companyId: user.companyId }),
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user with company information
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          company: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token with companyId if user is a company user
      const tokenPayload = {
        userId: user.id,
        role: user.role,
        ...(user.role === "COMPANY" && { companyId: user.companyId }),
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  },
};

export default authController;

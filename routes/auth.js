import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/database.js";
import { validateRequest, schemas } from "../middleware/validation.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Register
router.post(
  "/register",
  validateRequest(schemas.register),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { email, password, firstName, lastName, roleId } = req.body;

      // Check if user exists
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (existingUser.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "User already exists with this email." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Get default role if none specified
      let finalRoleId = roleId;
      if (!roleId) {
        const defaultRole = await client.query(
          "SELECT id FROM roles WHERE name = $1",
          ["user"]
        );
        finalRoleId = defaultRole.rows[0]?.id;
      }

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password, first_name, last_name, role_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name`,
        [email, hashedPassword, firstName, lastName, finalRoleId]
      );

      const user = result.rows[0];

      // Generate token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    } finally {
      client.release();
    }
  }
);

// Login
router.post("/login", validateRequest(schemas.login), async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password } = req.body;

    // Get user with role
    const result = await client.query(
      `SELECT u.*, r.name as role_name, r.permissions 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Update last login
    await client.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role_name,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  } finally {
    client.release();
  }
});

// Get current user
router.get("/me", authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.first_name,
      lastName: req.user.last_name,
      role: req.user.role_name,
      permissions: req.user.permissions,
    },
  });
});

export default router;

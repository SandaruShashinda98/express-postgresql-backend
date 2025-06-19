import jwt from "jsonwebtoken";
import pool from "../config/database.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user with role and permissions
    const userQuery = `
      SELECT u.*, r.name as role_name, r.permissions 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = $1 AND u.is_active = true
    `;

    const result = await pool.query(userQuery, [decoded.userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid token." });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

export const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const userPermissions = req.user.permissions || [];

    if (!userPermissions.includes(permission)) {
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

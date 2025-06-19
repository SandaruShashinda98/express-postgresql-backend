import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "../users/user.repository";
import { roleRepository } from "./role.repository";

export const authService = {
  register: async (userData) => {
    const { email, password, firstName, lastName, roleId } = userData;

    // Check if user exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists with this email.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get default role if none specified
    let finalRoleId = roleId;
    if (!roleId) {
      const defaultRole = await roleRepository.findByName("user");
      finalRoleId = defaultRole?.id;
    }

    // Create user
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: finalRoleId,
    });

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return {
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };
  },

  login: async (credentials) => {
    const { email, password } = credentials;

    // Get user with role
    const user = await userRepository.findByEmailWithRole(email);
    if (!user || !user.is_active) {
      throw new Error("Invalid credentials.");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials.");
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return {
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
    };
  },
};

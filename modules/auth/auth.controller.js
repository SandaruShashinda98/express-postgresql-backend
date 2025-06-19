import { authService } from "./auth.service";

export const authController = {
  register: async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Registration error:", error);
      if (error.message === "User already exists with this email.") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  },

  login: async (req, res) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);
      if (error.message === "Invalid credentials.") {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: "Login failed" });
    }
  },

  getCurrentUser: (req, res) => {
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
  },
};

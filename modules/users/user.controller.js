import { userService } from "./user.service";

export const userController = {
  getAllUsers: async (req, res) => {
    try {
      const result = await userService.getAllUsers(req.query);
      res.json(result);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  },

  updateUser: async (req, res) => {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update user error:", error);
      if (error.code === "23505") {
        res.status(400).json({ error: "Email already exists" });
      } else if (error.message === "No valid fields to update") {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  },

  deleteUser: async (req, res) => {
    try {
      // Prevent self-deletion
      if (parseInt(req.params.id) === req.user.id) {
        return res
          .status(400)
          .json({ error: "Cannot delete your own account" });
      }

      const deleted = await userService.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
};

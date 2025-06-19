import { userRepository } from "./user.repository.js";

export const userService = {
  getAllUsers: async (queryParams) => {
    const { page = 1, limit = 10, search = "" } = queryParams;
    const offset = (page - 1) * limit;

    const users = await userRepository.findAllWithPagination({
      limit: parseInt(limit),
      offset,
      search,
    });

    const total = await userRepository.countAll(search);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  getUserById: async (id) => {
    return await userRepository.findByIdWithRole(id);
  },

  updateUser: async (id, updateData) => {
    const { email, firstName, lastName, roleId, isActive } = updateData;

    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      return null;
    }

    // Build update object
    const updates = {};
    if (email) updates.email = email;
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (roleId) updates.roleId = roleId;
    if (typeof isActive === "boolean") updates.isActive = isActive;

    if (Object.keys(updates).length === 0) {
      throw new Error("No valid fields to update");
    }

    return await userRepository.update(id, updates);
  },

  deleteUser: async (id) => {
    return await userRepository.delete(id);
  },
};

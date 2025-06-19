import { roleRepository } from "./role.repository";

export const roleService = {
  getAllRoles: async () => {
    return await roleRepository.findAllWithUserCount();
  },

  getRoleById: async (id) => {
    return await roleRepository.findById(id);
  },

  createRole: async (roleData) => {
    const { name, description, permissions } = roleData;
    return await roleRepository.create({ name, description, permissions });
  },

  updateRole: async (id, roleData) => {
    const { name, description, permissions } = roleData;
    return await roleRepository.update(id, { name, description, permissions });
  },

  deleteRole: async (id) => {
    // Check if role has users
    const userCount = await roleRepository.getUserCount(id);
    if (userCount > 0) {
      throw new Error("Cannot delete role with assigned users");
    }

    return await roleRepository.delete(id);
  },
};

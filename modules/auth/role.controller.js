import { roleService } from "./role.service";

export const roleController = {
  getAllRoles: async (req, res) => {
    try {
      const roles = await roleService.getAllRoles();
      res.json({ roles });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  },

  getRoleById: async (req, res) => {
    try {
      const role = await roleService.getRoleById(req.params.id);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json({ role });
    } catch (error) {
      console.error('Get role error:', error);
      res.status(500).json({ error: 'Failed to fetch role' });
    }
  },

  createRole: async (req, res) => {
    try {
      const role = await roleService.createRole(req.body);
      res.status(201).json({
        message: 'Role created successfully',
        role
      });
    } catch (error) {
      console.error('Create role error:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Role name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create role' });
      }
    }
  },

  updateRole: async (req, res) => {
    try {
      const role = await roleService.updateRole(req.params.id, req.body);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json({
        message: 'Role updated successfully',
        role
      });
    } catch (error) {
      console.error('Update role error:', error);
      if (error.code === '23505') {
        res.status(400).json({ error: 'Role name already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update role' });
      }
    }
  },

  deleteRole: async (req, res) => {
    try {
      const deleted = await roleService.deleteRole(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Role not found' });
      }
      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Delete role error:', error);
      if (error.message === 'Cannot delete role with assigned users') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete role' });
      }
    }
  }
};
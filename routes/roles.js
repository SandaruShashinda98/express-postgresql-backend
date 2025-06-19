import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get all roles
router.get('/', authenticate, authorize('roles.read'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, COUNT(u.id) as user_count 
      FROM roles r 
      LEFT JOIN users u ON r.id = u.role_id 
      GROUP BY r.id 
      ORDER BY r.created_at DESC
    `);

    res.json({ roles: result.rows });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get role by ID
router.get('/:id', authenticate, authorize('roles.read'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ role: result.rows[0] });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// Create role
router.post('/', authenticate, authorize('roles.create'), validateRequest(schemas.role), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const result = await pool.query(
      `INSERT INTO roles (name, description, permissions) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, description, JSON.stringify(permissions)]
    );

    res.status(201).json({
      message: 'Role created successfully',
      role: result.rows[0]
    });
  } catch (error) {
    console.error('Create role error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Role name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create role' });
    }
  }
});

// Update role
router.put('/:id', authenticate, authorize('roles.update'), validateRequest(schemas.role), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const result = await pool.query(
      `UPDATE roles 
       SET name = $1, description = $2, permissions = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [name, description, JSON.stringify(permissions), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({
      message: 'Role updated successfully',
      role: result.rows[0]
    });
  } catch (error) {
    console.error('Update role error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Role name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update role' });
    }
  }
});

// Delete role
router.delete('/:id', authenticate, authorize('roles.delete'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Check if role has users
    const userCount = await client.query('SELECT COUNT(*) FROM users WHERE role_id = $1', [id]);
    if (parseInt(userCount.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete role with assigned users' });
    }

    const result = await client.query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  } finally {
    client.release();
  }
});

export default router;
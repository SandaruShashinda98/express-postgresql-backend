import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get all users
router.get('/', authenticate, authorize('users.read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, 
             u.last_login, u.created_at, r.name as role_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
    `;
    let params = [];
    let paramCount = 0;

    if (search) {
      query += ` WHERE (u.first_name ILIKE $${++paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users u';
    let countParams = [];
    if (search) {
      countQuery += ' WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)';
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticate, authorize('users.read'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, 
              u.last_login, u.created_at, r.name as role_name, r.id as role_id
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authenticate, authorize('users.update'), validateRequest(schemas.user), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { email, firstName, lastName, roleId, isActive } = req.body;

    // Check if user exists
    const existingUser = await client.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (email) {
      updates.push(`email = $${++paramCount}`);
      values.push(email);
    }
    if (firstName) {
      updates.push(`first_name = $${++paramCount}`);
      values.push(firstName);
    }
    if (lastName) {
      updates.push(`last_name = $${++paramCount}`);
      values.push(lastName);
    }
    if (roleId) {
      updates.push(`role_id = $${++paramCount}`);
      values.push(roleId);
    }
    if (typeof isActive === 'boolean') {
      updates.push(`is_active = $${++paramCount}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users SET ${updates.join(', ')} 
      WHERE id = $${++paramCount} 
      RETURNING id, email, first_name, last_name, is_active
    `;

    const result = await client.query(query, values);

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update user' });
    }
  } finally {
    client.release();
  }
});

// Delete user
router.delete('/:id', authenticate, authorize('users.delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
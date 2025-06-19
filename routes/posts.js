import express from 'express';
import pool from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';

const router = express.Router();

// Get all posts
router.get('/', authenticate, authorize('posts.read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', author = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.first_name, u.last_name, u.email as author_email
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id
    `;
    let params = [];
    let conditions = [];
    let paramCount = 0;

    if (status) {
      conditions.push(`p.status = $${++paramCount}`);
      params.push(status);
    }

    if (author) {
      conditions.push(`(u.first_name ILIKE $${++paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      params.push(`%${author}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM posts p LEFT JOIN users u ON p.author_id = u.id';
    let countParams = [];
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
      countParams = params.slice(0, -2); // Remove limit and offset
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get post by ID
router.get('/:id', authenticate, authorize('posts.read'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, u.first_name, u.last_name, u.email as author_email
       FROM posts p 
       LEFT JOIN users u ON p.author_id = u.id 
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
router.post('/', authenticate, authorize('posts.create'), validateRequest(schemas.post), async (req, res) => {
  try {
    const { title, content, status = 'draft' } = req.body;
    const authorId = req.user.id;

    const result = await pool.query(
      `INSERT INTO posts (title, content, author_id, status, published_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, content, authorId, status, status === 'published' ? new Date() : null]
    );

    res.status(201).json({
      message: 'Post created successfully',
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', authenticate, authorize('posts.update'), validateRequest(schemas.post), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;

    // Check if post exists and user owns it or has permission
    const postQuery = await client.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (postQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postQuery.rows[0];
    const userPermissions = req.user.permissions || [];

    // Check ownership or admin permissions
    if (post.author_id !== req.user.id && !userPermissions.includes('posts.update')) {
      return res.status(403).json({ error: 'Access denied. You can only update your own posts.' });
    }

    const publishedAt = status === 'published' && post.status !== 'published' 
      ? new Date() 
      : (status === 'published' ? post.published_at : null);

    const result = await client.query(
      `UPDATE posts 
       SET title = $1, content = $2, status = $3, published_at = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
      [title, content, status, publishedAt, id]
    );

    res.json({
      message: 'Post updated successfully',
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  } finally {
    client.release();
  }
});

// Publish/Unpublish post
router.patch('/:id/publish', authenticate, authorize('posts.publish'), async (req, res) => {
  try {
    const { id } = req.params;
    const { publish } = req.body; // true to publish, false to unpublish

    const status = publish ? 'published' : 'draft';
    const publishedAt = publish ? new Date() : null;

    const result = await pool.query(
      `UPDATE posts 
       SET status = $1, published_at = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, publishedAt, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: `Post ${publish ? 'published' : 'unpublished'} successfully`,
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Publish post error:', error);
    res.status(500).json({ error: 'Failed to update post status' });
  }
});

// Delete post
router.delete('/:id', authenticate, authorize('posts.delete'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Check if post exists and user owns it or has permission
    const postQuery = await client.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (postQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postQuery.rows[0];
    const userPermissions = req.user.permissions || [];

    // Check ownership or admin permissions
    if (post.author_id !== req.user.id && !userPermissions.includes('posts.delete')) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
    }

    await client.query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  } finally {
    client.release();
  }
});

// Get posts by current user
router.get('/my/posts', authenticate, authorize('posts.read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.first_name, u.last_name, u.email as author_email
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
    `;
    let params = [req.user.id];
    let paramCount = 1;

    if (status) {
      query += ` AND p.status = ${++paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ${++paramCount} OFFSET ${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM posts WHERE author_id = $1';
    let countParams = [req.user.id];
    if (status) {
      countQuery += ' AND status = $2';
      countParams.push(status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

export default router;
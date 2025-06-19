import pool from "../../config/database";

export const postRepository = {
  findAll: async () => {
    const query = `
      SELECT p.*, u.first_name, u.last_name, u.email as author_email
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  findAllWithPagination: async ({ limit, offset, status, author }) => {
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.email as author_email
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id
    `;
    let params = [];
    let conditions = [];
    let paramCount = 0;

    if (status) {
      conditions.push(`p.status = ${++paramCount}`);
      params.push(status);
    }

    if (author) {
      conditions.push(
        `(u.first_name ILIKE ${++paramCount} OR u.last_name ILIKE ${paramCount} OR u.email ILIKE ${paramCount})`
      );
      params.push(`%${author}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT ${++paramCount} OFFSET ${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
    return result.rows[0];
  },

  findByIdWithAuthor: async (id) => {
    const query = `
      SELECT p.*, u.first_name, u.last_name, u.email as author_email
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  findByAuthor: async (authorId) => {
    const query = `
      SELECT p.*, u.first_name, u.last_name, u.email as author_email
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [authorId]);
    return result.rows;
  },

  findByAuthorWithPagination: async (authorId, { limit, offset, status }) => {
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.email as author_email
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.author_id = $1
    `;
    let params = [authorId];
    let paramCount = 1;

    if (status) {
      query += ` AND p.status = ${++paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ${++paramCount} OFFSET ${++paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  countAll: async (status, author) => {
    let query =
      "SELECT COUNT(*) FROM posts p LEFT JOIN users u ON p.author_id = u.id";
    let params = [];
    let conditions = [];
    let paramCount = 0;

    if (status) {
      conditions.push(`p.status = ${++paramCount}`);
      params.push(status);
    }

    if (author) {
      conditions.push(
        `(u.first_name ILIKE ${++paramCount} OR u.last_name ILIKE ${paramCount} OR u.email ILIKE ${paramCount})`
      );
      params.push(`%${author}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  countByAuthor: async (authorId, status) => {
    let query = "SELECT COUNT(*) FROM posts WHERE author_id = $1";
    let params = [authorId];

    if (status) {
      query += " AND status = $2";
      params.push(status);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  create: async (postData) => {
    const { title, content, authorId, status, publishedAt } = postData;
    const query = `
      INSERT INTO posts (title, content, author_id, status, published_at) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
    `;
    const result = await pool.query(query, [
      title,
      content,
      authorId,
      status,
      publishedAt,
    ]);
    return result.rows[0];
  },

  update: async (id, updateData) => {
    const { title, content, status, publishedAt } = updateData;
    const query = `
      UPDATE posts 
      SET title = $1, content = $2, status = $3, published_at = $4, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $5 
      RETURNING *
    `;
    const result = await pool.query(query, [
      title,
      content,
      status,
      publishedAt,
      id,
    ]);
    return result.rows[0];
  },

  updateStatus: async (id, statusData) => {
    const { status, publishedAt } = statusData;
    const query = `
      UPDATE posts 
      SET status = $1, published_at = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING *
    `;
    const result = await pool.query(query, [status, publishedAt, id]);
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rows.length > 0;
  },
};

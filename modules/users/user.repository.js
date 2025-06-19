import pool from "../../config/database";

export const userRepository = {
  findByEmail: async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  },

  findByEmailWithRole: async (email) => {
    const query = `
      SELECT u.*, r.name as role_name, r.permissions 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.email = $1 AND u.is_active = true
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  },

  findByIdWithRole: async (id) => {
    const query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, 
             u.last_login, u.created_at, r.name as role_name, r.id as role_id
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  findAllWithPagination: async ({ limit, offset, search }) => {
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
    return result.rows;
  },

  countAll: async (search) => {
    let query = "SELECT COUNT(*) FROM users u";
    let params = [];

    if (search) {
      query +=
        " WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)";
      params.push(`%${search}%`);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  create: async (userData) => {
    const { email, password, firstName, lastName, roleId } = userData;
    const query = `
      INSERT INTO users (email, password, first_name, last_name, role_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, email, first_name, last_name
    `;
    const result = await pool.query(query, [
      email,
      password,
      firstName,
      lastName,
      roleId,
    ]);
    return result.rows[0];
  },

  update: async (id, updateData) => {
    const { email, firstName, lastName, roleId, isActive } = updateData;

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
    if (typeof isActive === "boolean") {
      updates.push(`is_active = $${++paramCount}`);
      values.push(isActive);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users SET ${updates.join(", ")} 
      WHERE id = $${++paramCount} 
      RETURNING id, email, first_name, last_name, is_active
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  updateLastLogin: async (id) => {
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
  },

  delete: async (id) => {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rows.length > 0;
  },
};

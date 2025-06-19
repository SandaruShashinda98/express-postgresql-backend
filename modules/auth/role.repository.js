import pool from "../../config/database";

export const roleRepository = {
  findAll: async () => {
    const result = await pool.query(
      "SELECT * FROM roles ORDER BY created_at DESC"
    );
    return result.rows;
  },

  findAllWithUserCount: async () => {
    const query = `
      SELECT r.*, COUNT(u.id) as user_count 
      FROM roles r 
      LEFT JOIN users u ON r.id = u.role_id 
      GROUP BY r.id 
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);
    return result.rows[0];
  },

  findByName: async (name) => {
    const result = await pool.query("SELECT * FROM roles WHERE name = $1", [
      name,
    ]);
    return result.rows[0];
  },

  create: async (roleData) => {
    const { name, description, permissions } = roleData;
    const query = `
      INSERT INTO roles (name, description, permissions) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `;
    const result = await pool.query(query, [
      name,
      description,
      JSON.stringify(permissions),
    ]);
    return result.rows[0];
  },

  update: async (id, roleData) => {
    const { name, description, permissions } = roleData;
    const query = `
      UPDATE roles 
      SET name = $1, description = $2, permissions = $3, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $4 
      RETURNING *
    `;
    const result = await pool.query(query, [
      name,
      description,
      JSON.stringify(permissions),
      id,
    ]);
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      "DELETE FROM roles WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rows.length > 0;
  },

  getUserCount: async (id) => {
    const result = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role_id = $1",
      [id]
    );
    return parseInt(result.rows[0].count);
  },
};

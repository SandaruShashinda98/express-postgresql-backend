import pool from "../config/database.js";
import bcrypt from "bcryptjs";

const setupDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Create roles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role_id INTEGER REFERENCES roles(id),
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'draft',
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)"
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)"
    );

    // Insert default roles
    const adminPermissions = [
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
      "roles.create",
      "roles.read",
      "roles.update",
      "roles.delete",
      "posts.create",
      "posts.read",
      "posts.update",
      "posts.delete",
      "posts.publish",
      "posts.unpublish",
    ];

    const editorPermissions = [
      "users.read",
      "posts.create",
      "posts.read",
      "posts.update",
      "posts.delete",
      "posts.publish",
      "posts.unpublish",
    ];

    const authorPermissions = ["posts.create", "posts.read", "posts.update"];

    const userPermissions = ["posts.read"];

    await client.query(
      `
      INSERT INTO roles (name, description, permissions) VALUES 
      ('admin', 'Administrator with full access', $1),
      ('editor', 'Editor with content management access', $2),
      ('author', 'Author with limited content access', $3),
      ('user', 'Regular user with read access', $4)
      ON CONFLICT (name) DO NOTHING
    `,
      [
        JSON.stringify(adminPermissions),
        JSON.stringify(editorPermissions),
        JSON.stringify(authorPermissions),
        JSON.stringify(userPermissions),
      ]
    );

    // Create default admin user
    const adminRole = await client.query(
      "SELECT id FROM roles WHERE name = $1",
      ["admin"]
    );
    const hashedPassword = await bcrypt.hash("admin123", 12);

    await client.query(
      `
      INSERT INTO users (email, password, first_name, last_name, role_id) VALUES 
      ('admin@example.com', $1, 'Admin', 'User', $2)
      ON CONFLICT (email) DO NOTHING
    `,
      [hashedPassword, adminRole.rows[0].id]
    );

    await client.query("COMMIT");
    console.log("Database setup completed successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error setting up database:", error);
  } finally {
    client.release();
    pool.end();
  }
};

setupDatabase();

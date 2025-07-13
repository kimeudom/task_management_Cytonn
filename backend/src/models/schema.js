/**
 * Database Schema Initialization
 * Creates all necessary tables for the task management system
 */

import pool from '../config/database.js';

// SQL for creating users table
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

// SQL for creating tasks table
const createTasksTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

// SQL for creating token blacklist table
const createTokenBlacklistTable = `
  CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(255) UNIQUE NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(user_id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason VARCHAR(50) DEFAULT 'logout' CHECK (reason IN ('logout', 'forced_logout', 'security_breach'))
  );
`;

// SQL for creating refresh tokens table
const createRefreshTokensTable = `
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    jti VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    device_info JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT FALSE
  );
`;

// SQL for creating indexes for better performance
const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
  CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
  CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
  CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(jti);
  CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(jti);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
`;

// SQL for creating triggers to automatically update updated_at timestamps
const createTriggers = `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
  CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

// initialise database schema
export async function initialiseDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database initialization...');
    
    // Create tables
    console.log('Creating users table...');
    await client.query(createUsersTable);

    console.log('Creating tasks table...');
    await client.query(createTasksTable);

    console.log('Creating token blacklist table...');
    await client.query(createTokenBlacklistTable);

    console.log('Creating refresh tokens table...');
    await client.query(createRefreshTokensTable);
    
    // Create indexes
    console.log('Creating indexes...');
    await client.query(createIndexes);
    
    // Create triggers
    console.log('Creating triggers...');
    await client.query(createTriggers);
    
    console.log('Database initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Drop all tables (for testing/reset purposes)
export async function dropAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('Dropping all tables...');
    
    await client.query('DROP TABLE IF EXISTS tasks CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');
    await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');
    
    console.log('All tables dropped successfully!');
    return true;
  } catch (error) {
    console.error('Failed to drop tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Check if database is properly initialised
export async function checkDatabaseStatus() {
  const client = await pool.connect();
  
  try {
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'tasks')
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    const existingTables = result.rows.map(row => row.table_name);
    
    const requiredTables = ['tasks', 'users'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    return {
      isinitialised: missingTables.length === 0,
      existingTables,
      missingTables
    };
  } catch (error) {
    console.error('Failed to check database status:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Seed database with sample data for testing
export async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Seeding database with sample data...');
    
    // Create sample users
    const usersQuery = `
      INSERT INTO users (email, password, first_name, last_name, role) VALUES
      ('admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Admin', 'User', 'admin'),
      ('manager@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Manager', 'User', 'manager'),
      ('user@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Regular', 'User', 'user')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role;
    `;
    
    const userResult = await client.query(usersQuery);
    console.log('Sample users created:', userResult.rows);
    
    // Get user IDs for task creation
    const getUsersQuery = 'SELECT id, role FROM users ORDER BY id LIMIT 3';
    const users = await client.query(getUsersQuery);
    
    if (users.rows.length >= 3) {
      const [admin, manager, user] = users.rows;
      
      // Create sample tasks
      const tasksQuery = `
        INSERT INTO tasks (title, description, status, priority, created_by, assigned_to, due_date) VALUES
        ('Setup Project Environment', 'initialise the development environment and configure all necessary tools', 'completed', 'high', $1, $2, NOW() + INTERVAL '7 days'),
        ('Design Database Schema', 'Create comprehensive database schema for the task management system', 'in_progress', 'high', $2, $2, NOW() + INTERVAL '5 days'),
        ('Implement User Authentication', 'Build secure user authentication system with JWT tokens', 'pending', 'medium', $2, $3, NOW() + INTERVAL '10 days'),
        ('Create API Documentation', 'Document all API endpoints with examples and response formats', 'pending', 'low', $1, $2, NOW() + INTERVAL '14 days')
        ON CONFLICT DO NOTHING
        RETURNING id, title, status;
      `;
      
      const taskResult = await client.query(tasksQuery, [admin.id, manager.id, user.id]);
      console.log('Sample tasks created:', taskResult.rows);
    }
    
    console.log('Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default {
  initialiseDatabase,
  dropAllTables,
  checkDatabaseStatus,
  seedDatabase
};

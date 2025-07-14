/**
 * Database Schema Initialization
 * Creates all necessary tables for the task management system
 */

import pool from '../config/database.js';

// SQL for creating roles table
const createRolesTable = `
  CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
  );
`;

// SQL for adding is_verified column to existing users table
const addEmailVerificationColumn = `
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'is_verified'
    ) THEN
      ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
  END $$;
`;

// SQL for creating users table (for new installations)
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_and_other_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL DEFAULT 2,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

// SQL for creating tasks table
const createTasksTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    task_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(user_id),
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'inprogress', 'completed', 'archived')),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

// SQL for creating task assigned users table
const createTaskAssignedUsersTable = `
  CREATE TABLE IF NOT EXISTS task_assigned_users (
    task_id INTEGER REFERENCES tasks(task_id),
    user_id INTEGER REFERENCES users(user_id),
    PRIMARY KEY (task_id, user_id)
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

// SQL for creating email verification tokens table
const createEmailVerificationTokensTable = `
  CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE NULL
  );
`;

// SQL for creating indexes for better performance
const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
  CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
  CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
  CREATE INDEX IF NOT EXISTS idx_task_assigned_users_task ON task_assigned_users(task_id);
  CREATE INDEX IF NOT EXISTS idx_task_assigned_users_user ON task_assigned_users(user_id);
  CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(jti);
  CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(jti);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
  CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
  CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);
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

    // Create tables in correct order (respecting foreign key dependencies)
    console.log('Creating roles table...');
    await client.query(createRolesTable);

    // Insert default roles
    console.log('Inserting default roles...');
    await client.query(`
      INSERT INTO roles (role_id, role_name, description) VALUES
      (1, 'Admin', 'Full system access'),
      (2, 'Manager', 'Can manage tasks and users'),
      (3, 'User', 'Can view and update assigned tasks')
      ON CONFLICT (role_id) DO NOTHING;
    `);

    console.log('Creating users table...');
    await client.query(createUsersTable);

    // Add email verification column to existing users table
    console.log('Adding email verification column to users table...');
    await client.query(addEmailVerificationColumn);

    console.log('Creating tasks table...');
    await client.query(createTasksTable);

    console.log('Creating task assigned users table...');
    await client.query(createTaskAssignedUsersTable);

    console.log('Creating token blacklist table...');
    await client.query(createTokenBlacklistTable);

    console.log('Creating refresh tokens table...');
    await client.query(createRefreshTokensTable);

    console.log('Creating email verification tokens table...');
    await client.query(createEmailVerificationTokensTable);

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
      AND table_name IN ('roles', 'users', 'tasks', 'task_assigned_users', 'token_blacklist', 'refresh_tokens', 'email_verification_tokens')
      ORDER BY table_name;
    `;

    const result = await client.query(tablesQuery);
    const existingTables = result.rows.map(row => row.table_name);

    const requiredTables = ['roles', 'users', 'tasks', 'task_assigned_users', 'token_blacklist', 'refresh_tokens', 'email_verification_tokens'];
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
      INSERT INTO users (username, email, password_hash, first_name, middle_and_other_name, last_name, role_id, is_verified) VALUES
      ('admin', 'admin@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Admin', '', 'User', 1, true),
      ('manager', 'manager@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Manager', '', 'User', 2, true),
      ('user', 'user@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Regular', '', 'User', 3, true),
      ('kimeudom', 'kimeudom02@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Dominic', 'Kiio', 'Kimeu', 1, true),
      ('mary_njeri', 'marynjeri@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Mary', 'Wambui', 'Njeri', 2, true),
      ('james_mwangi', 'jamesmwangi@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'James', 'Mwangi', 'Njoroge', 3, true),
      ('peter_muthomi', 'peterwambui@gmail.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'Peter', 'Muthumi', 'Muthomi', 2, true)
      ON CONFLICT (email) DO NOTHING
      RETURNING user_id, email, role_id;
    `;
    
    const userResult = await client.query(usersQuery);
    console.log('Sample users created:', userResult.rows);
    
    // Get user IDs for task creation
    const getUsersQuery = 'SELECT user_id, role_id FROM users ORDER BY user_id LIMIT 3';
    const users = await client.query(getUsersQuery);

    if (users.rows.length >= 3) {
      const [admin, manager, user] = users.rows;

      // Get all created users for task assignment
      const allUsersQuery = 'SELECT user_id FROM users ORDER BY user_id';
      const allUsers = await client.query(allUsersQuery);
      const userIds = allUsers.rows.map(row => row.user_id);

      // Create sample tasks
      const tasksQuery = `
        INSERT INTO tasks (title, description, status, priority, created_by, deadline) VALUES
        ('Setup Project Environment', 'initialise the development environment and configure all necessary tools', 'completed', 3, $1, NOW() + INTERVAL '7 days'),
        ('Design Database Schema', 'Create comprehensive database schema for the task management system', 'inprogress', 3, $2, NOW() + INTERVAL '5 days'),
        ('Implement User Authentication', 'Build secure user authentication system with JWT tokens', 'pending', 2, $2, NOW() + INTERVAL '10 days'),
        ('Create API Documentation', 'Document all API endpoints with examples and response formats', 'pending', 1, $1, NOW() + INTERVAL '14 days'),
        ('Polish Top Client Account', 'Perform a financial audit for the roles', 'pending', 1, $3, '2025-07-12 12:00:00'),
        ('Consulting Review', 'Review and approve the final consultation report', 'inprogress', 2, $4, '2025-07-12 14:30:00'),
        ('Bug fixing', 'Fix the bugs reported by QA team', 'pending', 3, $5, '2025-07-12 10:00:00'),
        ('Organise Team Building Exercise', 'Determine a destination to go to and a list of activities', 'completed', 1, $3, '2025-07-12 09:00:00')
        RETURNING task_id, title, status;
      `;

      const taskResult = await client.query(tasksQuery, [
        admin.user_id,
        manager.user_id,
        userIds[3] || admin.user_id, // kimeudom
        userIds[4] || manager.user_id, // mary_njeri
        userIds[5] || user.user_id // james_mwangi
      ]);
      console.log('Sample tasks created:', taskResult.rows);

      // Assign users to tasks
      if (taskResult.rows.length > 0) {
        // First assign the original tasks
        const assignQuery1 = `
          INSERT INTO task_assigned_users (task_id, user_id) VALUES
          ($1, $2), ($3, $2), ($4, $5), ($6, $2)
          ON CONFLICT DO NOTHING;
        `;
        await client.query(assignQuery1, [
          taskResult.rows[0].task_id, manager.user_id,
          taskResult.rows[1].task_id,
          taskResult.rows[2].task_id, user.user_id,
          taskResult.rows[3].task_id
        ]);

        // Then assign the additional tasks using actual user IDs
        if (taskResult.rows.length >= 8 && userIds.length >= 6) {
          const assignQuery2 = `
            INSERT INTO task_assigned_users (task_id, user_id) VALUES
            ($1, $2), ($3, $4), ($5, $6), ($7, $2)
            ON CONFLICT DO NOTHING;
          `;
          await client.query(assignQuery2, [
            taskResult.rows[4].task_id, userIds[3], // Task 5 -> kimeudom (user 4)
            taskResult.rows[5].task_id, userIds[4], // Task 6 -> mary_njeri (user 5)
            taskResult.rows[6].task_id, userIds[5], // Task 7 -> james_mwangi (user 6)
            taskResult.rows[7].task_id // Task 8 -> kimeudom (user 4)
          ]);
        }

        console.log('Task assignments created');
      }
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

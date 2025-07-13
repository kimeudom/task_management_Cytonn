/**
 * Database configuration for the backend application.
 * PostgreSQL connection 
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait when connecting a client
  statement_timeout: 30000, // How long to wait for a query to complete
  query_timeout: 30000,
  application_name: 'task_management_api'
};

const pool = new Pool(dbConfig);

// Connection event handlers

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
  console.error('Client info:', {
    database: client?.database,
    host: client?.host,
    port: client?.port
  });
});

pool.on('acquire', () => {
});

pool.on('release', (err) => {
  if (err) {
    console.error('Error releasing client:', err);
  }
});

// Test database connection
export async function testConnection() {
  let client;
  try {
    client = await pool.connect();

    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    const { current_time, postgres_version } = result.rows[0];
    if (current_time !== null && postgres_version!== null) {

    return {
      success: true,
      serverTime: current_time,
      version: postgres_version
    };
    }
    return {
      success:false
    }

  } catch (error) {
    console.error('Database connection failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Get connection pool status
export function getPoolStatus() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

// Graceful shutdown
export async function closePool() {
  try {
    await pool.end();
  } catch (error) {
    console.error('Error closing database pool gracefully:', error);
    throw error;
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

export default pool;

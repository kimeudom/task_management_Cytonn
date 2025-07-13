#!/usr/bin/env node

/**
 * Database Initialisation Script
 * Run this script to set up the database schema and optionally seed with sample data
 * 
 * Usage:
 *   node scripts/init-db.js                    # initialise database
 *   node scripts/init-db.js --seed             # initialise and seed with sample data
 *   node scripts/init-db.js --reset            # Drop all tables and reinitialise
 *   node scripts/init-db.js --reset --seed     # Reset, initialise, and seed
 *   node scripts/init-db.js --status           # Check database status
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

import { testConnection } from '../src/config/database.js';
import { 
  initialiseDatabase, 
  dropAllTables, 
  checkDatabaseStatus, 
  seedDatabase 
} from '../src/models/schema.js';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldSeed = args.includes('--seed');
const shouldReset = args.includes('--reset');
const shouldCheckStatus = args.includes('--status');
const shouldHelp = args.includes('--help') || args.includes('-h');

function printHelp() {
  console.log(`
🗄️  Database Initialisation Script

Usage:
  node scripts/init-db.js [options]

Options:
  --status          Check database connection and initialisation status
  --seed            Seed database with sample data after initialisation
  --reset           Drop all existing tables before initialisation
  --help, -h        Show this help message

Examples:
  node scripts/init-db.js                    # Initialise database
  node scripts/init-db.js --seed             # Initialise and seed with sample data
  node scripts/init-db.js --reset            # Drop all tables and reinitialise
  node scripts/init-db.js --reset --seed     # Reset, initialise, and seed
  node scripts/init-db.js --status           # Check database status

Environment Variables Required:
  DB_HOST           Database host (default: localhost)
  DB_PORT           Database port (default: 5432)
  DB_NAME           Database name
  DB_USER           Database username
  DB_PASSWORD       Database password
`);
}

async function checkStatus() {
  
  try {
    // Test connection
    const connectionResult = await testConnection();
    
    if (connectionResult.success) {
      console.log('Database connection: OK');
      console.log(`Server time: ${connectionResult.serverTime}`);
      console.log(`PostgreSQL version: ${connectionResult.version.split(' ')[0]} ${connectionResult.version.split(' ')[1]}\n`);
    } else {
      console.log('Database connection: FAILED');
      console.log(`Error: ${connectionResult.error}\n`);
      return false;
    }

    // Check schema status
    const schemaStatus = await checkDatabaseStatus();
    
    if (schemaStatus.isInitialised) {
      console.log('Database schema: INITIALISED');
      console.log(`Existing tables: ${schemaStatus.existingTables.join(', ')}`);
    } else {
      console.log('Database schema: NOT INITIALISED');
      if (schemaStatus.existingTables.length > 0) {
        console.log(`Existing tables: ${schemaStatus.existingTables.join(', ')}`);
      }
      if (schemaStatus.missingTables.length > 0) {
        console.log(`Missing tables: ${schemaStatus.missingTables.join(', ')}`);
      }
    }
    
    return schemaStatus.isInitialised;
  } catch (error) {
    console.error('Status check failed:', error.message);
    return false;
  }
}

async function initDatabase() {
  console.log('Starting database initialisation...\n');
  
  try {
    // Test connection first
    console.log('Testing database connection...');
    const connectionResult = await testConnection();
    
    if (!connectionResult.success) {
      console.error('Database connection failed:', connectionResult.error);
      console.error('Please check your database configuration in .env file');
      process.exit(1);
    }
    
    console.log('Database connection successful\n');

    if (shouldReset) {
      console.log('Dropping existing tables...');
      await dropAllTables();
      console.log('Tables dropped successfully\n');
    }

    console.log('🏗Initializing database schema...');
    await initialiseDatabase();
    console.log('Database schema initialised successfully\n');

    if (shouldSeed) {
      console.log('Seeding database with sample data...');
      await seedDatabase();
      console.log('Database seeded successfully\n');
    }

    const finalStatus = await checkDatabaseStatus();
    
    if (finalStatus.isinitialised) {
      console.log('Database initialization completed successfully!');
      console.log(`Tables created: ${finalStatus.existingTables.join(', ')}`);
      
      if (shouldSeed) {
        console.log('\nSample data has been added to the database');
        console.log('Default users created:');
        console.log('   - admin@example.com (password: password123) - Admin role');
        console.log('   - manager@example.com (password: password123) - Manager role');
        console.log('   - user@example.com (password: password123) - User role');
      }
      
      console.log('\n🚀 Your database is ready! You can now start the server with:');
      console.log('   npm run dev');
    } else {
      console.error('Database initialization verification failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🗄️  Task Management Database Initialization\n');

  if (shouldHelp) {
    printHelp();
    return;
  }

  if (shouldCheckStatus) {
    const isinitialised = await checkStatus();
    process.exit(isinitialised ? 0 : 1);
  } else {
    await initDatabase();
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\nProcess interrupted. Exiting...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nProcess terminated. Exiting...');
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

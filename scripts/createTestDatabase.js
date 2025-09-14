import fs from 'fs';
import path from 'path';
import pool, { query } from '../src/config/database.js';

async function createTestDatabase() {
  try {
    console.log('🗃️ Creating test database from database.sql...');
    
    // Read database.sql file
    const sqlFilePath = path.join(process.cwd(), 'database.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Clean up existing tables in test environment
    console.log('🧹 Cleaning up existing test tables...');
    await query('DROP SCHEMA public CASCADE;');
    await query('CREATE SCHEMA public;');
    await query('GRANT ALL ON SCHEMA public TO postgres;');
    await query('GRANT ALL ON SCHEMA public TO public;');
    
    // Execute the full SQL script
    console.log('📋 Executing database.sql...');
    await query(sqlScript);
    
    console.log('✅ Test database created successfully from database.sql!');
  } catch (error) {
    console.error('❌ Error creating test database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestDatabase();

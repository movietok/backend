import pool, { query } from '../src/config/database.js';

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check interactions table structure
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'interactions'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Interactions table columns:', result.rows);
    
    // Check if we need to drop and recreate the table
    if (result.rows.length > 0) {
      const hasTargetId = result.rows.some(row => row.column_name === 'target_id');
      if (!hasTargetId) {
        console.log('⚠️  Dropping old interactions table...');
        await query('DROP TABLE IF EXISTS interactions CASCADE;');
        console.log('✅ Old interactions table dropped');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();

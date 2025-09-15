import pg from 'pg';
import config from './config.js';

const { Pool } = pg;

// Get database configuration based on environment
const dbConfig = config.getDatabaseConfig();
const loggingConfig = config.getLoggingConfig();

// Create connection pool
const pool = new Pool(dbConfig);
// memo:  ToDO: Siiretään kaikki logitukset Developer moden alle. Antaa nyt olla. 
// Log connection info (without sensitive data)
console.log(`🗃️  Connecting to ${config.environment} database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log SQL queries only in development
    if (loggingConfig.sql) {
      console.log('📊 SQL Query:', { 
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
        duration: `${duration}ms`, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Database query error:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  }
};

// Helper function to test database connection
export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful');
    
    if (loggingConfig.level === 'debug') {
      console.log('📋 Database info:', {
        time: result.rows[0].current_time,
        version: result.rows[0].postgres_version.split(' ')[0] + ' ' + result.rows[0].postgres_version.split(' ')[1]
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Provide helpful error messages based on error type
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Suggestion: Make sure PostgreSQL is running and accessible');
    } else if (error.code === '3D000') {
      console.error('💡 Suggestion: Database does not exist. Please create it first');
    } else if (error.code === '28P01') {
      console.error('💡 Suggestion: Check database credentials in your .env file');
    }
    
    return false;
  }
};

// Helper function to close database connection
export const closeConnection = async () => {
  try {
    await pool.end();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

// Helper function to check if database exists
export const checkDatabaseExists = async () => {
  try {
    // Connect to postgres database to check if our target database exists
    const checkPool = new Pool({
      ...dbConfig,
      database: 'postgres' // Connect to default postgres database
    });

    const result = await checkPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );

    await checkPool.end();
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking database existence:', error.message);
    return false;
  }
};

// Helper function to create database if it doesn't exist
export const createDatabaseIfNotExists = async () => {
  try {
    const exists = await checkDatabaseExists();
    
    if (!exists) {
      console.log(`🏗️  Creating database: ${dbConfig.database}`);
      
      const createPool = new Pool({
        ...dbConfig,
        database: 'postgres'
      });

      await createPool.query(`CREATE DATABASE "${dbConfig.database}"`);
      await createPool.end();
      
      console.log(`✅ Database created: ${dbConfig.database}`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  }
};

// Pool event listeners for monitoring
pool.on('connect', (client) => {
  if (loggingConfig.level === 'debug') {
    console.log('🔗 New database client connected');
  }
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle database client:', err.message);
});

pool.on('remove', (client) => {
  if (loggingConfig.level === 'debug') {
    console.log('🔌 Database client removed');
  }
});

export default pool;

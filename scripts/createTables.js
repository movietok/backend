import fs from 'fs';
import path from 'path';
import pool, { query } from '../src/config/database.js';

async function createTables() {
  try {
    console.log('🗃️ Creating database tables...');
    
    // Create users table first
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        real_name VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    
    // Create movies table first (missing from SQL)
    await query(`
      CREATE TABLE IF NOT EXISTS movies (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        original_title TEXT,
        description TEXT,
        release_date DATE,
        runtime_minutes INTEGER,
        imdb_rating NUMERIC(3,1),
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    
    // Create reviews table with correct schema
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        movie_id VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        content TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        UNIQUE (movie_id, user_id)
      );
    `);
    
    // Create interactions table with correct schema
    await query(`
      CREATE TABLE IF NOT EXISTS interactions (
        id SERIAL PRIMARY KEY,
        target_id INTEGER NOT NULL,
        target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('review')),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'dislike')),
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        UNIQUE(target_id, user_id, target_type)
      );
    `);
    
    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_interactions_target ON interactions(target_id, target_type);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);`);
    
    // Create update trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger
    await query(`
      DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
      CREATE TRIGGER update_reviews_updated_at 
          BEFORE UPDATE ON reviews 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('✅ Database tables created/updated successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTables();

-- Migration: Add f_id column to movies table
-- Date: 2025-10-04
-- Description: Add Finnkino ID column to movies table for matching with Finnkino API

-- Add f_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'movies' 
        AND column_name = 'f_id'
    ) THEN
        ALTER TABLE movies ADD COLUMN f_id INTEGER UNIQUE;
        
        -- Add comment to explain the column
        COMMENT ON COLUMN movies.f_id IS 'Finnkino API ID for matching movie showtimes';
        
        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_movies_f_id ON movies(f_id);
        
        RAISE NOTICE 'Column f_id added to movies table successfully';
    ELSE
        RAISE NOTICE 'Column f_id already exists in movies table';
    END IF;
END $$;

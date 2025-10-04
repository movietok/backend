-- Migration: Add f_id column to movies table
-- Date: 2025-10-04
-- Description: Add Finnkino ID column to movies table for matching with Finnkino API

-- Add f_id column if it doesn't exist
DO $$ 
BEGIN
    -- Add f_id column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'movies' 
        AND column_name = 'f_id'
    ) THEN
        ALTER TABLE movies ADD COLUMN f_id INTEGER;
        RAISE NOTICE 'Column f_id added to movies table';
    ELSE
        RAISE NOTICE 'Column f_id already exists in movies table';
    END IF;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'movies_f_id_key'
    ) THEN
        ALTER TABLE movies ADD CONSTRAINT movies_f_id_key UNIQUE (f_id);
        RAISE NOTICE 'Unique constraint added to f_id column';
    ELSE
        RAISE NOTICE 'Unique constraint already exists on f_id column';
    END IF;
    
    -- Add comment to explain the column
    COMMENT ON COLUMN movies.f_id IS 'Finnkino API ID for matching movie showtimes';
    
    -- Create index for faster lookups (if not exists)
    CREATE INDEX IF NOT EXISTS idx_movies_f_id ON movies(f_id);
    RAISE NOTICE 'Index idx_movies_f_id created or already exists';
    
    RAISE NOTICE '✅ Migration completed successfully';
END $$;

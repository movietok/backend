-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  movie_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(movie_id, user_id) -- Prevent duplicate reviews for the same movie by the same user
);

-- Create interactions table for likes/dislikes
CREATE TABLE IF NOT EXISTS interactions (
  id SERIAL PRIMARY KEY,
  target_id INTEGER NOT NULL,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('review')),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'dislike')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(target_id, user_id, target_type) -- Prevent duplicate interactions
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_target ON interactions(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);

-- Update trigger for reviews table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

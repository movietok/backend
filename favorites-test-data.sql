-- Favorites Test Data Setup
-- ========================

-- Create test users if they don't exist
INSERT INTO users (username, email, password_hash, real_name) 
VALUES 
  ('testuser1', 'test1@example.com', '$2b$10$test_hash_1', 'Test User 1'),
  ('testuser2', 'test2@example.com', '$2b$10$test_hash_2', 'Test User 2'),
  ('admin_user', 'admin@example.com', '$2b$10$admin_hash', 'Admin User')
ON CONFLICT (username) DO NOTHING;

-- Create admin role for test admin
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM users 
WHERE username = 'admin_user'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create test movies
INSERT INTO movies (id, original_title, tmdb_id, release_year)
VALUES 
  ('movie_001', 'Test Movie 1', 12345, 2024),
  ('movie_002', 'Test Movie 2', 12346, 2024),
  ('movie_003', 'Test Movie 3', 12347, 2024)
ON CONFLICT (id) DO NOTHING;

-- Create test group
INSERT INTO groups (name, owner_id, description, visibility)
SELECT 'Test Group', u.id, 'A test group for favorites', 'public'
FROM users u 
WHERE u.username = 'testuser1'
ON CONFLICT DO NOTHING;

-- Add testuser2 as member to the group
INSERT INTO group_members (group_id, user_id, role)
SELECT g.id, u.id, 'member'::group_member_role
FROM groups g, users u
WHERE g.name = 'Test Group' AND u.username = 'testuser2'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Sample favorites data
-- User 1 watchlist
INSERT INTO favorites (user_id, movie_id, type)
SELECT u.id, 'movie_001', 1
FROM users u WHERE u.username = 'testuser1'
ON CONFLICT (user_id, movie_id) DO UPDATE SET type = 1;

-- User 1 personal favorites  
INSERT INTO favorites (user_id, movie_id, type)
SELECT u.id, 'movie_002', 2
FROM users u WHERE u.username = 'testuser1'
ON CONFLICT (user_id, movie_id) DO UPDATE SET type = 2;

-- Group favorites (stored under group owner's user_id)
INSERT INTO favorites (user_id, movie_id, type)
SELECT u.id, 'movie_003', 3
FROM users u WHERE u.username = 'testuser1'
ON CONFLICT (user_id, movie_id) DO UPDATE SET type = 3;

-- Verification queries
SELECT 'Users created:' as info;
SELECT id, username, email FROM users WHERE username LIKE 'test%' OR username = 'admin_user';

SELECT 'Movies created:' as info;
SELECT * FROM movies WHERE id LIKE 'movie_%';

SELECT 'Groups created:' as info; 
SELECT g.id, g.name, g.owner_id, g.visibility, u.username as owner_name
FROM groups g
JOIN users u ON u.id = g.owner_id
WHERE g.name = 'Test Group';

SELECT 'Group members:' as info;
SELECT gm.group_id, gm.user_id, gm.role, u.username, g.name as group_name
FROM group_members gm
JOIN users u ON u.id = gm.user_id  
JOIN groups g ON g.id = gm.group_id
WHERE g.name = 'Test Group';

SELECT 'Favorites created:' as info;
SELECT f.user_id, f.movie_id, f.type, 
       CASE f.type 
         WHEN 1 THEN 'Watchlist'
         WHEN 2 THEN 'Favorites' 
         WHEN 3 THEN 'Group Favorites'
       END as type_name,
       u.username, m.original_title
FROM favorites f
JOIN users u ON u.id = f.user_id
JOIN movies m ON m.id = f.movie_id
ORDER BY f.user_id, f.type;
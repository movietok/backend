-- Extensions for case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext;

-- ==========================================
-- ENUM TYPES
-- ==========================================
CREATE TYPE account_role AS ENUM ('user', 'moderator', 'admin', 'banned');
CREATE TYPE group_member_role AS ENUM ('member', 'moderator', 'owner');
CREATE TYPE report_target AS ENUM ('user', 'movie', 'review', 'comment', 'group');
CREATE TYPE interaction_type AS ENUM ('like', 'dislike');
CREATE TYPE interaction_target AS ENUM ('review', 'movie', 'comment');

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id 					SERIAL PRIMARY KEY,
    username CITEXT 	UNIQUE NOT NULL,
    email CITEXT 		UNIQUE NOT NULL,
    password_hash 		TEXT NOT NULL,
    account_type_id 	INT,  -- optional, can reference external account type table if needed
    real_name 			VARCHAR(50),
    last_activity_at 	TIMESTAMP,
    created_at 			TIMESTAMP NOT NULL DEFAULT now(),
    date_of_birth 		DATE
);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id 			INT REFERENCES users(id) ON DELETE CASCADE,
    role account_role 	NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- ==========================================
-- GROUPS TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS group_themes (
    id 		SERIAL PRIMARY KEY,
    name 	TEXT NOT NULL,
    theme 	TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS groups (
    id 				SERIAL PRIMARY KEY,
    name 			TEXT NOT NULL,
    owner_id 		INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    description 	TEXT,
    theme_id 		INT REFERENCES group_themes(id) ON DELETE SET NULL,
    visibility 		TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','closed')),
    created_at 		TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id 				INT REFERENCES groups(id) ON DELETE CASCADE,
    user_id 				INT REFERENCES users(id) ON DELETE CASCADE,
    role group_member_role 	NOT NULL DEFAULT 'member',
    joined_at 				TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- ==========================================
-- MOVIES + REVIEWS
-- ==========================================
CREATE TABLE IF NOT EXISTS movies (
    id 					INT PRIMARY KEY,
    title 				TEXT NOT NULL,
    original_title 		TEXT,
    description 		TEXT,
    release_date 		DATE,
    runtime_minutes 	INTEGER,
    imdb_rating 		NUMERIC(3,1),
    age_cert age_rating,
    created_at 			TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
    id         SERIAL PRIMARY KEY,
    movie_id   INT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stars      INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    text       TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (movie_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id         SERIAL PRIMARY KEY,
    review_id  INT default 0 REFERENCES reviews(id) ON DELETE CASCADE,
	movie_id   INT default 0 REFERENCES movies(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id   	INT REFERENCES users(id) ON DELETE CASCADE,
    movie_id  	INT REFERENCES movies(id) ON DELETE CASCADE,
    created_at 	TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, movie_id)
);

-- ==========================================
-- MODERATION TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS bans (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason     TEXT,
    until      TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS reports (
    id           SERIAL PRIMARY KEY,
    reporter_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type  report_target NOT NULL,
    target_id    INT NOT NULL,
    reason       TEXT NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    handled_at   TIMESTAMP,
    handler_id   INT REFERENCES users(id) ON DELETE SET NULL,
);

-- ==========================================
-- GLOBAL INTERACTIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS interactions (
	id          	 	SERIAL PRIMARY KEY,
	interaction_type 	VARCHAR(50) NOT NULL,
	interaction_target 	VARCHAR(50) NOT NULL,
	user_id				INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	created_at			TIMESTAMP NOT NULL DEFAULT now()
); //1  
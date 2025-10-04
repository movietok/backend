import { query } from '../config/database.js';

class Review {
  constructor(data) {
    this.id = data.id;
    this.movie_id = data.movie_id;
    this.user_id = data.user_id;
    this.username = data.username;
    this.content = data.content;
    this.rating = data.rating;
    this.likes = data.likes || 0;
    this.dislikes = data.dislikes || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // CREATE - Create a new review
  static async create(reviewData) {
    try {
      const { movie_id, user_id, content, rating } = reviewData;
      console.log('Creating review with data:', { movie_id, user_id, content, rating });
      const result = await query(
        `INSERT INTO reviews (movie_id, user_id, content, rating) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [movie_id, user_id, content, rating]
      );
      console.log('Created review result:', result.rows[0]);
      return new Review(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating review: ${error.message}`);
    }
  }

  // READ - Get a single review by ID
  static async findById(id) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         WHERE r.id = $1
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, r.deleted_at, u.username`,
        [id]
      );
      return result.rows[0] ? new Review(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding review: ${error.message}`);
    }
  }

  // READ - Check if user has already reviewed a movie
  static async findByUserAndMovie(userId, movieId) {
    try {
      const result = await query(
        'SELECT * FROM reviews WHERE user_id = $1 AND movie_id = $2',
        [userId, movieId]
      );
      return result.rows[0] ? new Review(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user review: ${error.message}`);
    }
  }

  // READ - Get all reviews for a movie
  static async findByMovieId(movieId) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         WHERE r.movie_id = $1
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, r.deleted_at, u.username
         ORDER BY r.created_at DESC`,
        [movieId]
      );
      return result.rows.map(row => new Review(row));
    } catch (error) {
      throw new Error(`Error finding reviews for movie: ${error.message}`);
    }
  }

  // READ - Get all reviews by a user
  static async findByUserId(userId) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         WHERE r.user_id = $1
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, r.deleted_at, u.username
         ORDER BY r.created_at DESC`,
        [userId]
      );
      return result.rows.map(row => new Review(row));
    } catch (error) {
      throw new Error(`Error finding reviews by user: ${error.message}`);
    }
  }

  // READ - Get recent reviews (top 20 most recent)
  static async findRecent(limit = 20) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, r.deleted_at, u.username
         ORDER BY r.created_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows.map(row => new Review(row));
    } catch (error) {
      throw new Error(`Error finding recent reviews: ${error.message}`);
    }
  }

  // UPDATE - Update a review
  static async update(id, updateData) {
    try {
      const { content, rating } = updateData;
      const result = await query(
        `UPDATE reviews 
         SET content = $1, rating = $2, updated_at = NOW() 
         WHERE id = $3 RETURNING *`,
        [content, rating, id]
      );
      return result.rows[0] ? new Review(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error updating review: ${error.message}`);
    }
  }

  // DELETE - Delete a review
  static async delete(id) {
    try {
      const result = await query(
        'DELETE FROM reviews WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] ? true : false;
    } catch (error) {
      throw new Error(`Error deleting review: ${error.message}`);
    }
  }

  // Add an interaction (like/dislike) to a review
  static async addInteraction(reviewId, userId, type) {
    try {
      // First remove any existing interaction from this user on this review
      await query(
        `DELETE FROM interactions 
         WHERE target_id = $1 AND user_id = $2 AND target_type = 'review'`,
        [reviewId, userId]
      );

      // Then add the new interaction
      if (type) {
        await query(
          `INSERT INTO interactions (target_id, user_id, type, target_type) 
           VALUES ($1, $2, $3, 'review')`,
          [reviewId, userId, type]
        );
      }

      // Return updated review with new interaction counts
      return await Review.findById(reviewId);
    } catch (error) {
      throw new Error(`Error adding interaction to review: ${error.message}`);
    }
  }

  // Get reviews by group members for group favorite movies
  static async findByGroupFavorites(groupId) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         WHERE r.movie_id IN (
           -- Get movies that are in group favorites
           SELECT f.tmdb_id 
           FROM favorites f 
           JOIN groups g ON g.owner_id = f.user_id 
           WHERE g.id = $1 AND f.type = 3
         )
         AND r.user_id IN (
           -- Get group members (including owner)
           SELECT gm.user_id 
           FROM group_members gm 
           WHERE gm.group_id = $1
           UNION
           SELECT g.owner_id 
           FROM groups g 
           WHERE g.id = $1
         )
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, r.deleted_at, u.username
         ORDER BY r.created_at DESC`,
        [groupId]
      );
      return result.rows.map(row => new Review(row));
    } catch (error) {
      throw new Error(`Error finding group reviews: ${error.message}`);
    }
  }
}

export default Review;
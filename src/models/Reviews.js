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
    // Movie information (when available from joins)
    this.movie_name = data.movie_name || null;
    this.release_year = data.release_year || null;
    this.poster_url = data.poster_url || null;
  }

  // CREATE - Create a new review
  static async create(reviewData) {
    try {
      const { movie_id, user_id, content, rating } = reviewData;
      const result = await query(
        `INSERT INTO reviews (movie_id, user_id, content, rating) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [movie_id, user_id, content, rating]
      );
      
      // Return the complete review with username and interaction stats
      return await Review.findById(result.rows[0].id);
    } catch (error) {
      throw new Error(`Error creating review: ${error.message}`);
    }
  }

  // READ - Get a single review by ID with interactions
  static async findById(id) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         m.original_title as movie_name,
         m.release_year,
         m.poster_url,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN movies m ON m.tmdb_id = r.movie_id::integer
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         WHERE r.id = $1
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, u.username, m.original_title, m.release_year, m.poster_url`,
        [id]
      );

      if (!result.rows[0]) return null;

      const review = new Review(result.rows[0]);
      
      // Get interactions for this review
      review.interactions = await Review.getReviewInteractions(id);
      
      return review;
    } catch (error) {
      throw new Error(`Error finding review: ${error.message}`);
    }
  }

  // Get interactions for a specific review
  static async getReviewInteractions(reviewId) {
    try {
      const result = await query(
        `SELECT i.user_id, i.type, u.username
         FROM interactions i
         JOIN users u ON u.id = i.user_id
         WHERE i.target_id = $1 AND i.target_type = 'review'
         ORDER BY i.created_at DESC`,
        [reviewId]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting review interactions: ${error.message}`);
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
  // Helper method to add interactions to reviews
  static async addInteractionsToReviews(reviews) {
    if (!reviews || reviews.length === 0) return reviews;
    
    const reviewIds = reviews.map(review => review.id);
    
    try {
      const result = await query(
        `SELECT i.target_id as review_id, i.user_id, i.type, u.username
         FROM interactions i
         JOIN users u ON u.id = i.user_id
         WHERE i.target_id = ANY($1) AND i.target_type = 'review'
         ORDER BY i.created_at DESC`,
        [reviewIds]
      );
      
      // Group interactions by review_id
      const interactionsByReview = {};
      result.rows.forEach(interaction => {
        if (!interactionsByReview[interaction.review_id]) {
          interactionsByReview[interaction.review_id] = [];
        }
        interactionsByReview[interaction.review_id].push({
          user_id: interaction.user_id,
          username: interaction.username,
          type: interaction.type
        });
      });
      
      // Add interactions to each review
      return reviews.map(review => {
        review.interactions = interactionsByReview[review.id] || [];
        return review;
      });
    } catch (error) {
      console.error('Error adding interactions to reviews:', error);
      // Return reviews without interactions if there's an error
      return reviews.map(review => {
        review.interactions = [];
        return review;
      });
    }
  }

  // READ - Get reviews by movie ID with interactions
  static async findByMovieId(movieId) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         m.original_title as movie_name,
         m.release_year,
         m.poster_url,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN movies m ON m.tmdb_id = r.movie_id::integer
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         WHERE r.movie_id = $1
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, u.username, m.original_title, m.release_year, m.poster_url
         ORDER BY r.created_at DESC`,
        [movieId]
      );
      
      const reviews = result.rows.map(row => new Review(row));
      return await Review.addInteractionsToReviews(reviews);
    } catch (error) {
      throw new Error(`Error finding reviews for movie: ${error.message}`);
    }
  }

  // READ - Get all reviews by a user with interactions
  static async findByUserId(userId) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         m.original_title as movie_name,
         m.release_year,
         m.poster_url,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN movies m ON m.tmdb_id = r.movie_id::integer
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         WHERE r.user_id = $1
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, u.username, m.original_title, m.release_year, m.poster_url
         ORDER BY r.created_at DESC`,
        [userId]
      );
      
      const reviews = result.rows.map(row => new Review(row));
      return await Review.addInteractionsToReviews(reviews);
    } catch (error) {
      throw new Error(`Error finding reviews by user: ${error.message}`);
    }
  }

  // READ - Get recent reviews (top 20 most recent) with interactions
  static async findRecent(limit = 20) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         m.original_title as movie_name,
         m.release_year,
         m.poster_url,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN movies m ON m.tmdb_id = r.movie_id::integer
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, u.username, m.original_title, m.release_year, m.poster_url
         ORDER BY r.created_at DESC
         LIMIT $1`,
        [limit]
      );
      
      const reviews = result.rows.map(row => new Review(row));
      return await Review.addInteractionsToReviews(reviews);
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
      
      if (!result.rows[0]) {
        return null;
      }
      
      // Return the complete review with username and interaction stats
      return await Review.findById(id);
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

  // Get reviews by group members for group favorite movies with interactions
  static async findByGroupFavorites(groupId) {
    try {
      const result = await query(
        `SELECT r.*, 
         u.username,
         m.original_title as movie_name,
         m.release_year,
         m.poster_url,
         COUNT(CASE WHEN i.type = 'like' THEN 1 END) as likes,
         COUNT(CASE WHEN i.type = 'dislike' THEN 1 END) as dislikes
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN movies m ON m.tmdb_id = r.movie_id::integer
         LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
         WHERE EXISTS (
           -- Check that the movie is in this group's favorites
           SELECT 1 
           FROM favorites f 
           WHERE f.tmdb_id::text = r.movie_id::text 
           AND f.group_id = $1 
           AND f.type = 3
         )
         AND EXISTS (
           -- Check that the reviewer is a group member or owner
           SELECT 1 
           FROM group_members gm 
           WHERE gm.group_id = $1 AND gm.user_id = r.user_id
           UNION
           SELECT 1 
           FROM groups g 
           WHERE g.id = $1 AND g.owner_id = r.user_id
         )
         GROUP BY r.id, r.movie_id, r.user_id, r.content, r.rating, r.created_at, r.updated_at, u.username, m.original_title, m.release_year, m.poster_url
         ORDER BY r.created_at DESC`,
        [groupId]
      );
      
      const reviews = result.rows.map(row => new Review(row));
      return await Review.addInteractionsToReviews(reviews);
    } catch (error) {
      throw new Error(`Error finding group reviews: ${error.message}`);
    }
  }

  // READ - Get top reviewers by review count
  static async findTopReviewers(limit = 20) {
    try {
      const result = await query(
        `SELECT 
          u.id,
          u.username,
          u.email,
          u.real_name,
          u.user_bio,
          u.created_at as user_created_at,
          COUNT(r.id) as review_count,
          ROUND(AVG(r.rating), 2) as average_rating
        FROM users u
        LEFT JOIN reviews r ON u.id = r.user_id
        GROUP BY u.id, u.username, u.email, u.real_name, u.user_bio, u.created_at
        HAVING COUNT(r.id) > 0
        ORDER BY review_count DESC, u.username ASC
        LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding top reviewers: ${error.message}`);
    }
  }

  // READ - Get users by aura (net likes on their reviews)
  static async findUsersByAura(limit = 20) {
    try {
      const result = await query(
        `SELECT 
          u.id,
          u.username,
          u.email,
          u.real_name,
          u.user_bio,
          u.created_at as user_created_at,
          COUNT(r.id) as review_count,
          ROUND(AVG(r.rating), 2) as average_rating,
          COALESCE(SUM(CASE WHEN i.type = 'like' THEN 1 ELSE 0 END), 0) as total_likes,
          COALESCE(SUM(CASE WHEN i.type = 'dislike' THEN 1 ELSE 0 END), 0) as total_dislikes,
          COALESCE(SUM(CASE WHEN i.type = 'like' THEN 1 WHEN i.type = 'dislike' THEN -1 ELSE 0 END), 0) as aura
        FROM users u
        LEFT JOIN reviews r ON u.id = r.user_id
        LEFT JOIN interactions i ON i.target_id = r.id AND i.target_type = 'review'
        GROUP BY u.id, u.username, u.email, u.real_name, u.user_bio, u.created_at
        HAVING COUNT(r.id) > 0
        ORDER BY aura DESC, total_likes DESC, review_count DESC, u.username ASC
        LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding users by aura: ${error.message}`);
    }
  }
}

export default Review;
import Review from '../models/Reviews.js';

export class ReviewService {
  
  // Create a new review
  static async createReview(reviewData) {
    try {
      // Check if user has already reviewed this movie
      const existingReview = await Review.findByUserAndMovie(reviewData.userId, reviewData.movieId);
      if (existingReview) {
        throw new Error('User has already reviewed this movie');
      }

      return await Review.create({
        movie_id: reviewData.movieId,
        user_id: reviewData.userId,
        rating: reviewData.rating,
        content: reviewData.content
      });
    } catch (error) {
      throw error;
    }
  }

  // Get review by ID
  static async getReviewById(reviewId) {
    try {
      return await Review.findById(reviewId);
    } catch (error) {
      throw error;
    }
  }

  // Get recent reviews (top 20 most recent)
  static async getRecentReviews(limit = 20) {
    try {
      const reviews = await Review.findRecent(limit);
      return {
        reviews: reviews,
        total: reviews.length
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all reviews for a movie with pagination and stats, Maybe we will refactor this later and change calculation from 0 to 5. 
  static async getMovieReviews(movieId, options = {}) {
    try {
      const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = options;
      
      const reviews = await Review.findByMovieId(movieId);
      
      // Calculate statistics
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;
      
      const ratingDistribution = {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length
      };

      // Apply pagination
      const paginatedReviews = reviews.slice(offset, offset + limit);

      return {
        reviews: paginatedReviews,
        total: totalReviews,
        stats: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
          ratingDistribution
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all reviews by a user
  static async getUserReviews(userId, options = {}) {
    try {
      const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = options;
      
      const reviews = await Review.findByUserId(userId);
      const totalReviews = reviews.length;
      
      // Apply pagination
      const paginatedReviews = reviews.slice(offset, offset + limit);

      return {
        reviews: paginatedReviews,
        total: totalReviews
      };
    } catch (error) {
      throw error;
    }
  }

  // Update a review
  static async updateReview(reviewId, updateData) {
    try {
      const updateFields = {};
      if (updateData.rating !== undefined) updateFields.rating = updateData.rating;
      if (updateData.content !== undefined) updateFields.content = updateData.content;
      
      return await Review.update(reviewId, updateFields);
    } catch (error) {
      throw error;
    }
  }

  // Delete a review
  static async deleteReview(reviewId) {
    try {
      return await Review.delete(reviewId);
    } catch (error) {
      throw error;
    }
  }

  // Add interaction (like/dislike) to a review
  static async addReviewInteraction(reviewId, userId, type) {
    try {
      return await Review.addInteraction(reviewId, userId, type);
    } catch (error) {
      throw error;
    }
  }

  // Get reviews by group members for group favorite movies
  static async getGroupReviews(groupId) {
    try {
      return await Review.findByGroupFavorites(groupId);
    } catch (error) {
      throw error;
    }
  }

  // Get top reviewers by review count
  static async getTopReviewers(limit = 20) {
    try {
      return await Review.findTopReviewers(limit);
    } catch (error) {
      throw error;
    }
  }
}

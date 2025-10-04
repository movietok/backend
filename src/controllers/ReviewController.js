import { ReviewService } from '../services/ReviewService.js';

export const createReview = async (req, res) => {
  try {
    const { movieId, rating, content } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!movieId || !rating) {
      return res.status(400).json({
        status: 'error',
        message: 'Movie ID and rating are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
    }

    const review = await ReviewService.createReview({
      userId,
      movieId,
      rating,
      content
    });

    res.status(201).json({
      status: 'success',
      data: { review }
    });

  } catch (error) {
    if (error.message === 'User has already reviewed this movie') {
      return res.status(409).json({
        status: 'error',
        message: error.message
      });
    }

    console.error('Error creating review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await ReviewService.getReviewById(id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    res.json({
      status: 'success',
      data: { review }
    });

  } catch (error) {
    console.error('Error getting review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getMovieReviews = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = req.query;

    const result = await ReviewService.getMovieReviews(movieId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      order
    });

    res.json({
      status: 'success',
      data: {
        reviews: result.reviews,
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < result.total
        },
        stats: result.stats
      }
    });

  } catch (error) {
    console.error('Error getting movie reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = req.query;

    const result = await ReviewService.getUserReviews(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      order
    });

    res.json({
      status: 'success',
      data: {
        reviews: result.reviews,
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < result.total
        }
      }
    });

  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getRecentReviews = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Validate limit parameter
    const reviewLimit = parseInt(limit);
    if (isNaN(reviewLimit) || reviewLimit < 1 || reviewLimit > 50) {
      return res.status(400).json({
        status: 'error',
        message: 'Limit must be a number between 1 and 50'
      });
    }

    const result = await ReviewService.getRecentReviews(reviewLimit);

    res.json({
      status: 'success',
      data: {
        reviews: result.reviews,
        total: result.total,
        limit: reviewLimit
      }
    });

  } catch (error) {
    console.error('Error getting recent reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const existingReview = await ReviewService.getReviewById(id);
    
    if (!existingReview) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    if (existingReview.user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this review'
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
    }

    const updatedReview = await ReviewService.updateReview(id, {
      rating,
      content
    });

    res.json({
      status: 'success',
      data: { review: updatedReview }
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if review exists and belongs to user
    const existingReview = await ReviewService.getReviewById(id);
    
    if (!existingReview) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    if (existingReview.user_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this review'
      });
    }

    await ReviewService.deleteReview(id);

    res.status(204).send();

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const addReviewInteraction = async (req, res) => {
  try {
    const { id: reviewId } = req.params;
    const { type } = req.body; // 'like' or 'dislike'
    const userId = req.user.id;

    console.log('🔍 Interaction request:', { reviewId, type, userId });

    // Validate interaction type
    if (!['like', 'dislike'].includes(type)) {
      console.log('❌ Invalid interaction type:', type);
      return res.status(400).json({
        status: 'error',
        message: 'Interaction type must be "like" or "dislike"'
      });
    }

    // Check if review exists
    const review = await ReviewService.getReviewById(reviewId);
    if (!review) {
      console.log('❌ Review not found:', reviewId);
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    console.log('📝 Review found:', { reviewId: review.id, userId: review.user_id, currentUser: userId });

    // Users cannot interact with their own reviews
    if (review.user_id === userId) {
      console.log('❌ User trying to interact with own review:', { reviewUserId: review.user_id, currentUserId: userId });
      return res.status(400).json({
        status: 'error',
        message: 'Cannot interact with your own review'
      });
    }

    const interaction = await ReviewService.addReviewInteraction(reviewId, userId, type);

    res.json({
      status: 'success',
      data: { interaction }
    });

  } catch (error) {
    console.error('Error adding review interaction:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getGroupReviews = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        status: 'error',
        message: 'Group ID is required'
      });
    }

    const reviews = await ReviewService.getGroupReviews(groupId);

    res.json({
      status: 'success',
      data: { reviews }
    });

  } catch (error) {
    console.error('Error getting group reviews:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};
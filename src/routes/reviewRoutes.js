import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createReview,
  getReview,
  getMovieReviews,
  getUserReviews,
  getRecentReviews,
  getGroupReviews,
  updateReview,
  deleteReview,
  addReviewInteraction
} from '../controllers/ReviewController.js';

const router = express.Router();

// Create a new review (requires authentication)
router.post('/', authenticateToken, createReview);

// Get recent reviews (top 20 most recent) - MUST come before /:id
router.get('/recent', getRecentReviews);

// Get a specific review by ID
router.get('/:id', getReview);

// Get all reviews for a movie
router.get('/movie/:movieId', getMovieReviews);

// Get all reviews by a user
router.get('/user/:userId', getUserReviews);

// Get all reviews by group members for group favorite movies
router.get('/group/:groupId', getGroupReviews);

// Update a review (requires authentication)
router.put('/:id', authenticateToken, updateReview);

// Delete a review (requires authentication)
router.delete('/:id', authenticateToken, deleteReview);

// Add/remove like or dislike to a review (requires authentication)
router.post('/:id/interaction', authenticateToken, addReviewInteraction);

export default router;
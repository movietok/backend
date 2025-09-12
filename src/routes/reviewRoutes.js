import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createReview,
  getReview,
  getMovieReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  addReviewInteraction
} from '../controllers/ReviewController.js';

const router = express.Router();

// Create a new review (requires authentication)
router.post('/', authenticateToken, createReview);

// Get a specific review by ID
router.get('/:id', getReview);

// Get all reviews for a movie
router.get('/movie/:movieId', getMovieReviews);

// Get all reviews by a user
router.get('/user/:userId', getUserReviews);

// Update a review (requires authentication)
router.put('/:id', authenticateToken, updateReview);

// Delete a review (requires authentication)
router.delete('/:id', authenticateToken, deleteReview);

// Add/remove like or dislike to a review (requires authentication)
router.post('/:id/interaction', authenticateToken, addReviewInteraction);

export default router;
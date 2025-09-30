import express from 'express';
import { 
  addToFavorites, 
  removeFromFavorites, 
  getUserFavorites, 
  getGroupFavorites,
  checkFavoriteStatus 
} from '../controllers/FavoritesController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/v1/favorites
 * @desc Add movie to favorites (watchlist, favorites, or group favorites)
 * @access Private
 * @body {
 *   movie_id: string,
 *   type: number (1=watchlist, 2=favorites, 3=group_favorites),
 *   group_id?: number (required for group_favorites)
 * }
 */
router.post('/', authenticateToken, addToFavorites);

/**
 * @route DELETE /api/v1/favorites/:movie_id/:type
 * @desc Remove movie from personal favorites
 * @access Private
 * @params movie_id: string, type: number
 */
router.delete('/:movie_id/:type', authenticateToken, removeFromFavorites);

/**
 * @route DELETE /api/v1/favorites/:movie_id/:type/group/:group_id
 * @desc Remove movie from group favorites
 * @access Private
 * @params movie_id: string, type: number, group_id: number
 */
router.delete('/:movie_id/:type/group/:group_id', authenticateToken, removeFromFavorites);

/**
 * @route DELETE /api/v1/favorites/:movie_id/:type/user/:user_id
 * @desc Remove movie from another user's favorites (admin only)
 * @access Private (Admin)
 * @params movie_id: string, type: number, user_id: number
 */
router.delete('/:movie_id/:type/user/:user_id', authenticateToken, removeFromFavorites);

/**
 * @route GET /api/v1/favorites/user/:user_id/:type
 * @desc Get user's personal favorites (watchlist or favorites)
 * @access Public for favorites (type=2), Private for watchlist (type=1)
 * @params user_id: number, type: number (1=watchlist, 2=favorites)
 */
router.get('/user/:user_id/:type', optionalAuth, getUserFavorites);

/**
 * @route GET /api/v1/favorites/group/:group_id
 * @desc Get group favorites
 * @access Public for public groups, Private for closed/private groups
 * @params group_id: number
 */
router.get('/group/:group_id', optionalAuth, getGroupFavorites);

/**
 * @route GET /api/v1/favorites/status/:movie_id
 * @desc Check if movie is in user's favorites (all types)
 * @access Public (returns limited info for non-authenticated users)
 * @params movie_id: string
 */
router.get('/status/:movie_id', optionalAuth, checkFavoriteStatus);

export default router;
import express from 'express';
import { searchMovies, getMovieDetails } from '../controllers/TMDBController.js';

const router = express.Router();

// Search movies from TMDB
router.get('/search', searchMovies);

// Get detailed movie information from TMDB (includes trailer)
router.get('/:id', getMovieDetails);

export default router;
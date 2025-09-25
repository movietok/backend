import express from 'express';
import { 
  searchMovies, 
  getMovieDetails, 
  getMoviesByTitleAndYear,
  discoverMovies,
  getLocalGenres
} from '../controllers/TMDBController.js';

const router = express.Router();

// Search movies from TMDB
router.get('/search', searchMovies);

// Get Genres from local database
router.get('/genres', getLocalGenres);

// Get movies by title & year
router.get('/title-year', getMoviesByTitleAndYear);

// Discover movies (supports both GET and POST)
router.route('/discover')
  .get(discoverMovies)
  .post(discoverMovies);

// Get detailed movie information from TMDB (includes trailer)
router.get('/:id', getMovieDetails);

export default router;
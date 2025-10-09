import express from 'express';
import { 
  searchMovies, 
  getMovieDetails, 
  getMoviesByTitleAndYear,
  discoverMovies,
  getMoviesInTheaters
} from '../controllers/TMDBController.js';

import { getLocalGenres } from '../controllers/GenresController.js';

const router = express.Router();

// Search movies from TMDB
router.get('/search', searchMovies);

// Get Genres from local database
router.get('/genres', getLocalGenres);

// Get movies currently in theaters (with Finnkino ID)
router.get('/in-theaters', getMoviesInTheaters);

// Get movies by title & year
router.get('/title-year', getMoviesByTitleAndYear);

// Discover movies (supports both GET and POST)
router.route('/discover')
  .get(discoverMovies)
  .post(discoverMovies);

// Get detailed movie information from TMDB (includes trailer)
router.get('/:id', getMovieDetails);

export default router;
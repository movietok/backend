import express from 'express';
import { 
  searchMovies, 
  getMovieDetails, 
  getGenres, 
  getTopPopularMovies,
  getTopRatedMovies
} from '../controllers/TMDBController.js';

const router = express.Router();

// Search movies from TMDB
router.get('/search', searchMovies);


// Get Genres list from TMDB
router.get('/genres', getGenres);

// Get top 10 popular movies from TMDB
router.get('/top-popular', getTopPopularMovies);

// Get top rated movies from TMDB
router.get('/top-rated', getTopRatedMovies);

// Get detailed movie information from TMDB (includes trailer)
router.get('/:id', getMovieDetails);

export default router;
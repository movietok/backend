import TMDBService from '../services/TMDBService.js';
import Movie from '../models/Movie.js';

export const searchMovies = async (req, res) => {
  try {
    const { query, page } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await TMDBService.searchMovies(query, page);
    res.json(results);
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getMovieDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Movie ID is required' });
    }

    const movie = await TMDBService.getMovieById(id);

    // Save basic movie details to our database
    try {
      await Movie.createFromTmdb(movie);
    } catch (dbError) {
      console.error('Error saving movie to database:', dbError);
      // Don't fail the request if database save fails
    }

    res.json(movie);
  } catch (error) {
    console.error('Error getting movie details:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getGenres = async (req, res) => {
  try {
    const { language } = req.query;
    const genres = await TMDBService.getGenres(language || 'en');
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTopPopularMovies = async (req, res) => {
  try {
    const { count, language } = req.query;
    const movies = await TMDBService.getTopPopularMovies(Number(count) || 10, language || 'en');
    res.json(movies);
  } catch (error) {
    console.error('Error fetching top popular movies:', error);
    res.status(500).json({ error: error.message }); 
  }
};

export const getTopRatedMovies = async (req, res) => {
  try {
    const { count, language } = req.query;
    const movies = await TMDBService.getTopRatedMovies(Number(count) || 10, language || 'en');
    res.json(movies);
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getMoviesByTitleAndYear = async (req, res) => {
  try {
    const { originalTitle, year } = req.query;

    // Validate required parameters
    if (!originalTitle || !year) {
      return res.status(400).json({
        success: false,
        error: 'Both originalTitle and year are required as query parameters'
      });
    }

    // Validate year format
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year format. Year must be between 1900 and current year'
      });
    }

    const results = await TMDBService.searchByOriginalTitleAndYear(originalTitle, yearNum);
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error searching movies by original title and year:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};



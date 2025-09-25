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


export const discoverMovies = async (req, res) => {
  try {
    // Handle both GET and POST methods
    const method = req.method;
    const options = {
      sortBy: req.query.sort_by || 'popularity.desc',
      page: parseInt(req.query.page) || 1,
      language: req.query.language || 'en-US'
    };

    // If it's a POST request and has genre data, add it to the options
    if (method === 'POST' && req.body.genres && Array.isArray(req.body.genres)) {
      options.withGenres = req.body.genres;
    }

    const results = await TMDBService.discoverMovies(options);
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error discovering movies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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



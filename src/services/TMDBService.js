import pool from '../config/database.js';
import Movie from '../models/Movie.js';

class TMDBService {
  constructor() {
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.apiKey = process.env.TMDB_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('TMDB_API_KEY is not defined in environment variables');
    }
  }

  /**
   * Make a request to TMDB API
   * @private
   */
  async fetchTMDBData(endpoint, searchParams = {}) {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Add default and custom search parameters
      const defaultParams = {
        include_adult: false,
        language: 'en-US',
      };

      Object.entries({ ...defaultParams, ...searchParams }).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const options = {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      };

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('TMDB API error:', error);
      throw new Error(`Failed to fetch data from TMDB: ${error.message}`);
    }
  }

  /**
   * Search for movies by name
   * @param {string} query - Search term
   * @param {number} page - Page number (optional)
   */
  async searchMovies(query, page = 1) {
    try {
      const data = await this.fetchTMDBData('/search/movie', {
        query,
        page: page.toString()
      });

      return {
        results: this.formatMovieList(data.results),
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results
      };
    } catch (error) {
      throw new Error(`Failed to search movies: ${error.message}`);
    }
  }

  /**
   * Get detailed movie information by ID
   * @param {number} movieId - TMDB movie ID
   */
  async getMovieById(movieId) {
    try {
      const data = await this.fetchTMDBData(`/movie/${movieId}`, {
        append_to_response: 'credits,videos,similar'
      });

      return this.formatMovieDetails(data);
    } catch (error) {
      throw new Error(`Failed to get movie details: ${error.message}`);
    }
  }

  /**
   * Search movies by original title and year
   * @param {string} originalTitle - The original title to search for
   * @param {number} year - The release year to filter by
   * @returns {Promise<Object>} - Search results
   */
  async searchByOriginalTitleAndYear(originalTitle, year, finnkinoId = null) {
    try {
      // If Finnkino ID is provided, check database first
      if (finnkinoId) {
        const dbMovie = await this.getMovieByFinnkinoId(finnkinoId);
        if (dbMovie) {
          console.log(`Found movie in database with f_id: ${finnkinoId}`);
          return {
            results: [dbMovie],
            totalResults: 1,
            source: 'database'
          };
        }
      }

      // Search TMDB if not found in database
      const data = await this.fetchTMDBData('/search/movie', {
        query: originalTitle,
        primary_release_year: year.toString(),
        sort_by: 'popularity.desc'
      });

      // Filter results to only include exact title matches (checking against TMDB title field)
      const exactMatches = data.results.filter(movie => 
        movie.title.toLowerCase() === originalTitle.toLowerCase()
      );

      // Save to database with Finnkino ID if provided (using raw TMDB data)
      if (finnkinoId && exactMatches.length > 0) {
        // Use raw TMDB data for saving
        const movieToSave = {
          id: exactMatches[0].id,
          title: exactMatches[0].title,
          release_year: exactMatches[0].release_date ? 
            parseInt(exactMatches[0].release_date.split('-')[0]) : null,
          poster_path: exactMatches[0].poster_path
        };
        await this.saveMovieWithFinnkinoId(movieToSave, finnkinoId);
      }

      const formattedResults = this.formatMovieList(exactMatches);

      return {
        results: formattedResults,
        totalResults: exactMatches.length,
        source: 'tmdb'
      };
    } catch (error) {
      throw new Error(`Failed to search by original title and year: ${error.message}`);
    }
  }

  /**
   * Get movie from database by Finnkino ID
   * @private
   */
  async getMovieByFinnkinoId(finnkinoId) {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          original_title,
          release_year,
          tmdb_id,
          poster_url,
          f_id
        FROM movies 
        WHERE f_id = $1
      `, [finnkinoId]);

      if (result.rows.length === 0) {
        return null;
      }

      const movie = result.rows[0];
      
      // Format to match formatMovieList output (camelCase)
      return {
        id: movie.tmdb_id || parseInt(movie.id.replace('tmdb_', '')),
        title: movie.original_title, // Using original_title as title
        originalTitle: movie.original_title,
        releaseDate: movie.release_year ? `${movie.release_year}-01-01` : null,
        overview: null, // Not stored in database
        posterPath: movie.poster_url, // Already contains full URL from database
        voteAverage: null, // Not stored in database
        f_id: movie.f_id,
        fromDatabase: true
      };
    } catch (error) {
      console.error('Error fetching movie by Finnkino ID:', error);
      return null;
    }
  }

  /**
   * Save movie to database with Finnkino ID
   * @private
   */
  async saveMovieWithFinnkinoId(movie, finnkinoId) {
    try {
      // Validate required fields
      if (!movie || !movie.id || !movie.title) {
        console.error('Cannot save movie: missing required fields', { 
          id: movie?.id, 
          title: movie?.title
        });
        return;
      }

      // Use Finnkino ID as primary key if available, otherwise use TMDB ID with prefix
      // This prioritizes Finnkino ID since it's the main integration point
      const movieId = finnkinoId ? finnkinoId.toString() : `${movie.id}`;
      
      // Ensure we have valid data
      const originalTitle = movie.title || 'Unknown';
      const releaseYear = movie.release_year || null;
      // Store full poster URL, not just the path
      const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
        : null;

      console.log('Attempting to save movie with data:', {
        movieId,
        originalTitle,
        releaseYear,
        tmdb_id: movie.id,
        posterUrl,
        finnkinoId
      });

      // First, try to update existing movie by tmdb_id
      const updateResult = await pool.query(`
        UPDATE movies 
        SET f_id = $1, 
            original_title = COALESCE($2, original_title),
            release_year = COALESCE($3, release_year),
            poster_url = COALESCE($4, poster_url)
        WHERE tmdb_id = $5
        RETURNING id
      `, [finnkinoId, originalTitle, releaseYear, posterUrl, movie.id]);

      if (updateResult.rowCount === 0) {
        // No existing movie found by tmdb_id, so insert new one
        await pool.query(`
          INSERT INTO movies (id, original_title, release_year, tmdb_id, poster_url, f_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) 
          DO UPDATE SET 
            f_id = EXCLUDED.f_id,
            original_title = EXCLUDED.original_title,
            release_year = EXCLUDED.release_year,
            tmdb_id = EXCLUDED.tmdb_id,
            poster_url = EXCLUDED.poster_url
        `, [
          movieId,
          originalTitle,
          releaseYear,
          movie.id,
          posterUrl,
          finnkinoId
        ]);
      }

      console.log(`Saved movie to database: ${originalTitle} (f_id: ${finnkinoId}, tmdb_id: ${movie.id})`);
    } catch (error) {
      // If there's a unique constraint violation on f_id, just log it
      if (error.code === '23505') {
        console.log(`Movie with f_id ${finnkinoId} or tmdb_id ${movie?.id} already exists in database`);
      } else {
        console.error('Error saving movie with Finnkino ID:', error);
      }
    }
  }

  /**
   * Get all movies from database that have Finnkino ID
   * @param {Object} options - Query options
   * @param {number} [options.limit=10] - Maximum number of movies to return
   * @param {number} [options.offset=0] - Number of movies to skip
   * @returns {Promise<Object>} - Movies with Finnkino ID
   */
  async getMoviesWithFinnkinoId({ limit = 10, offset = 0 } = {}) {
    try {
      // Use Movie model to fetch movies with Finnkino ID
      const result = await Movie.findWithFinnkinoId({ limit, offset });

      // Format movies to match TMDB API response format
      const movies = result.movies.map(movie => ({
        id: movie.tmdb_id || parseInt(movie.id.replace('tmdb_', '')),
        originalTitle: movie.original_title,
        releaseYear: movie.release_year,
        posterPath: movie.poster_url,
        f_id: movie.f_id,
      }));

      return {
        results: movies,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('Error fetching movies with Finnkino ID:', error);
      throw new Error(`Failed to fetch movies with Finnkino ID: ${error.message}`);
    }
  }

  /**
   * Discover movies with various filters and sorting options
   * @param {Object} options - Discovery options
   * @param {string} options.sortBy - Sort method (default: 'popularity.desc')
   * @param {number[]} [options.withGenres] - Array of genre IDs to filter by
   * @param {number} [options.page=1] - Page number
   * @param {string} [options.language='en-US'] - Language code
   * @returns {Promise<Object>} - Discovered movies
   */
  async discoverMovies({
    sortBy = 'popularity.desc',
    withGenres = [],
    page = 1,
    language = 'en-US'
  } = {}) {
    try {
      // Validate sort_by parameter
      const validSortOptions = [
        'original_title.asc', 'original_title.desc',
        'popularity.asc', 'popularity.desc',
        'revenue.asc', 'revenue.desc',
        'primary_release_date.asc', 'primary_release_date.desc',
        'title.asc', 'title.desc',
        'vote_average.asc', 'vote_average.desc',
        'vote_count.asc', 'vote_count.desc'
      ];

      if (!validSortOptions.includes(sortBy)) {
        throw new Error('Invalid sort_by parameter');
      }

      const params = {
        language,
        page: page.toString(),
        sort_by: sortBy
      };

      // Add genre filter if genres are provided
      if (withGenres && withGenres.length > 0) {
        params.with_genres = withGenres.join(',');
      }

      const data = await this.fetchTMDBData('/discover/movie', params);

      return {
        results: this.formatMovieList(data.results),
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results
      };
    } catch (error) {
      throw new Error(`Failed to discover movies: ${error.message}`);
    }
  }

  /**
   * Get videos (trailers, teasers, etc.) for a specific movie
   * @param {number} movieId - TMDB movie ID
   * @param {string} language - Language for videos (default: 'en-US')
   */

  /**
   * Format basic movie data for list views
   * @private
   */
  formatMovieList(movies) {
    return movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.title,
      releaseDate: movie.release_date,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      voteAverage: movie.vote_average
    }));
  }

  /**
   * Format detailed movie data
   * @private
   */
  formatMovieDetails(movie) {
    // Find the most recent official trailer
    const trailer = movie.videos?.results
      ?.filter(video => 
        video.site === 'YouTube' && 
        video.type === 'Trailer' && 
        video.official
      )
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0];

    // Get crew members by department
    const crew = movie.credits?.crew || [];
    const directors = crew
      .filter(person => person.job === 'Director')
      .map(person => ({
        id: person.id,
        name: person.name,
        job: person.job,
        profilePath: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null
      }));

    const keyCrewRoles = ['Producer', 'Executive Producer', 'Screenplay', 'Writer', 'Director of Photography', 'Original Music Composer'];
    const keyCrew = crew
      .filter(person => keyCrewRoles.includes(person.job))
      .map(person => ({
        id: person.id,
        name: person.name,
        job: person.job,
        profilePath: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null
      }));

    return {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.title,
      tagline: movie.tagline,
      overview: movie.overview,
      releaseDate: movie.release_date,
      runtime: movie.runtime,
      genres: movie.genres?.map(genre => genre.name) || [],
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdropPath: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
      budget: movie.budget,
      revenue: movie.revenue,
      popularity: movie.popularity,
      voteAverage: movie.vote_average,
      // Cast and crew information
      cast: movie.credits?.cast?.slice(0, 10).map(actor => ({
        id: actor.id,
        name: actor.name,
        job: "Actor",
        character: actor.character,
        profilePath: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : null
      })) || [],
      directors: directors,
      keyCrew: keyCrew,
      // Trailer information
      trailer: trailer ? {
        name: trailer.name,
        url: `https://www.youtube.com/watch?v=${trailer.key}`
      } : null
    };
  }
}

export default new TMDBService();
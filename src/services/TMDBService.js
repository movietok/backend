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
  async searchByOriginalTitleAndYear(originalTitle, year) {
    try {
      // First search with the title
      const data = await this.fetchTMDBData('/search/movie', {
        query: originalTitle,
        primary_release_year: year.toString(),
        sort_by: 'popularity.desc'
      });

      // Filter results to only include exact original_title matches
      const exactMatches = data.results.filter(movie => 
        movie.original_title.toLowerCase() === originalTitle.toLowerCase()
      );

      return {
        results: this.formatMovieList(exactMatches),
        totalResults: exactMatches.length
      };
    } catch (error) {
      throw new Error(`Failed to search by original title and year: ${error.message}`);
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
   * Get list of movie genres from TMDB
   * @param {string} language - Language code (default: 'en')
   */
  async getGenres(language = 'en') {
    try {
      const data = await this.fetchTMDBData('/genre/movie/list', {
        language: language
      });
      return data.genres;
    } catch (error) {
      throw new Error(`Failed to fetch genres: ${error.message}`);
    }
  }


  /**
   * Format basic movie data for list views
   * @private
   */
  formatMovieList(movies) {
    return movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
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
      originalTitle: movie.original_title,
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
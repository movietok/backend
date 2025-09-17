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
      originalTitle: movie.original_title,
      releaseDate: movie.release_date,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
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
import { query } from '../config/database.js';

class Movie {
  constructor(data) {
    this.id = data.id;
    this.original_title = data.original_title;
    this.release_year = data.release_year;
    this.imdb_rating = data.imdb_rating;
    this.tmdb_id = data.tmdb_id;
    this.poster_url = data.poster_url;
  }

  // CREATE - Create a new movie manually (rarely used as movies typically come from TMDB)
  static async create(movieData) {
    try {
      const { original_title, release_year, imdb_rating, tmdb_id } = movieData;
      const result = await query(
        `INSERT INTO movies (original_title, release_year, imdb_rating, tmdb_id) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [original_title, release_year, imdb_rating, tmdb_id]
      );
      return new Movie(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating movie: ${error.message}`);
    }
  }

  // READ - Hae elokuva ID:n perusteella
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM movies WHERE id = $1', [id]);
      return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding movie by ID: ${error.message}`);
    }
  }

  // READ - Get all movies with optional filtering
  static async findAll(filters = {}, limit = 50, offset = 0) {
    try {
      let queryText = 'SELECT * FROM movies';
      let queryParams = [];
      let paramCount = 1;
      let conditions = [];

      // Add filters that match our current schema
      if (filters.release_year) {
        conditions.push(`release_year = $${paramCount}`);
        queryParams.push(filters.release_year);
        paramCount++;
      }

      if (filters.original_title) {
        conditions.push(`original_title ILIKE $${paramCount}`);
        queryParams.push(`%${filters.original_title}%`);
        paramCount++;
      }

      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }

      queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limit, offset);

      const result = await query(queryText, queryParams);
      return result.rows.map(row => new Movie(row));
    } catch (error) {
      throw new Error(`Error finding movies: ${error.message}`);
    }
  }

  // READ - Search movies by original title
  static async search(searchTerm, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT * FROM movies 
         WHERE original_title ILIKE $1
         LIMIT $2 OFFSET $3`,
        [`%${searchTerm}%`, limit, offset]
      );
      return result.rows.map(row => new Movie(row));
    } catch (error) {
      throw new Error(`Error searching movies: ${error.message}`);
    }
  }

  // UPDATE - Update movie details (mainly for updating IMDb rating)
  static async updateById(id, updateData) {
    try {
      const allowedFields = ['original_title', 'release_year', 'imdb_rating'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          updates.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
          paramCount++;
        }
      });

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);
      const result = await query(
        `UPDATE movies SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );

      return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error updating movie: ${error.message}`);
    }
  }

  // DELETE - Delete a movie by ID
  static async deleteById(id) {
    try {
      const result = await query('DELETE FROM movies WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error deleting movie: ${error.message}`);
    }
  }

  // Helper - Count movies with optional filters
  static async count(filters = {}) {
    try {
      let queryText = 'SELECT COUNT(*) FROM movies';
      let queryParams = [];
      let paramCount = 1;
      let conditions = [];

      if (filters.release_year) {
        conditions.push(`release_year = $${paramCount}`);
        queryParams.push(filters.release_year);
        paramCount++;
      }

      if (filters.original_title) {
        conditions.push(`original_title ILIKE $${paramCount}`);
        queryParams.push(`%${filters.original_title}%`);
        paramCount++;
      }

      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }

      const result = await query(queryText, queryParams);
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new Error(`Error counting movies: ${error.message}`);
    }
  }

  // Instance method - Return public object
  toPublicObject() {
    return {
      id: this.id,
      original_title: this.original_title,
      release_year: this.release_year,
      imdb_rating: this.imdb_rating,
      tmdb_id: this.tmdb_id
    };
  }

  // Instance method - Update this movie
  async update(updateData) {
    const updated = await Movie.updateById(this.id, updateData);
    if (updated) {
      Object.assign(this, updated);
    }
    return updated;
  }

  // Instance method - Poista tämä elokuva
  async delete() {
    return await Movie.deleteById(this.id);
  }

  // Find movie by TMDB ID
  static async findByTmdbId(tmdbId) {
    try {
      const result = await query('SELECT * FROM movies WHERE tmdb_id = $1', [tmdbId]);
      return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding movie by TMDB ID: ${error.message}`);
    }
  }

  // Create or update movie from TMDB data
  static async createFromTmdb(tmdbData) {
    try {
      // First check if movie already exists by TMDB ID
      const existingMovie = await Movie.findByTmdbId(tmdbData.id);
      if (existingMovie) {
        return existingMovie; // Movie already exists, return it
      }

      // Get the highest current ID and increment it
      const maxResult = await query('SELECT MAX(id::numeric) as max_id FROM movies');
      const nextId = maxResult.rows[0].max_id ? (parseInt(maxResult.rows[0].max_id) + 1).toString() : '1';

      // Extract year from release date (YYYY-MM-DD format)
      const releaseYear = tmdbData.releaseDate ? parseInt(tmdbData.releaseDate.split('-')[0]) : null;

      // Log the data that will be saved
      console.log('TMDB Data to be saved:', {
        id: nextId,
        tmdb_id: tmdbData.id,
        original_title: tmdbData.originalTitle,
        release_year: releaseYear,
        poster_url: tmdbData.posterPath,
        full_tmdb_data: tmdbData // This shows all available TMDB data
      });

      // Create new movie with TMDB data
      const result = await query(
        `INSERT INTO movies (
          id,
          original_title, 
          tmdb_id, 
          release_year,
          poster_url
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          nextId,
          tmdbData.originalTitle,
          tmdbData.id,
          releaseYear,
          tmdbData.posterPath
        ]
      );

      return new Movie(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating movie from TMDB data: ${error.message}`);
    }
  }

  // Process multiple movies from discover/search results
  static async processMultipleMovies(moviesArray) {
    try {
      const processedMovies = [];
      const errors = [];

      for (const movieData of moviesArray) {
        try {
          // Check if movie already exists by TMDB ID
          const existingMovie = await Movie.findByTmdbId(movieData.id);
          if (existingMovie) {
            processedMovies.push({ 
              ...existingMovie, 
              status: 'existing' 
            });
            continue;
          }

          // Extract year from release date (YYYY-MM-DD format)
          const releaseYear = movieData.releaseDate ? parseInt(movieData.releaseDate.split('-')[0]) : null;

          // Get the highest current ID and increment it
          const maxResult = await query('SELECT MAX(id::numeric) as max_id FROM movies');
          const nextId = maxResult.rows[0].max_id ? (parseInt(maxResult.rows[0].max_id) + 1).toString() : '1';

          // Create new movie with TMDB data
          const result = await query(
            `INSERT INTO movies (
              id,
              original_title, 
              tmdb_id, 
              release_year,
              poster_url
            ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [
              nextId,
              movieData.originalTitle,
              movieData.id,
              releaseYear,
              movieData.posterPath
            ]
          );

          const newMovie = new Movie(result.rows[0]);
          processedMovies.push({ 
            ...newMovie, 
            status: 'created' 
          });

        } catch (error) {
          errors.push({
            movieId: movieData.id,
            title: movieData.originalTitle,
            error: error.message
          });
          console.error(`Error processing movie ${movieData.id} (${movieData.originalTitle}):`, error);
        }
      }

      return {
        processed: processedMovies,
        errors: errors,
        stats: {
          total: moviesArray.length,
          created: processedMovies.filter(m => m.status === 'created').length,
          existing: processedMovies.filter(m => m.status === 'existing').length,
          failed: errors.length
        }
      };
    } catch (error) {
      throw new Error(`Error processing multiple movies: ${error.message}`);
    }
  }
}

export default Movie;

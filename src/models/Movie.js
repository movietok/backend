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

  // Find movie by Finnkino ID
  static async findByFinnkinoId(finnkinoId) {
    try {
      const result = await query(
        `SELECT * FROM movies WHERE f_id = $1`,
        [finnkinoId]
      );
      return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding movie by Finnkino ID: ${error.message}`);
    }
  }

  // Find movie by original title and release year
  static async findByTitleAndYear(originalTitle, releaseYear) {
    try {
      const result = await query(
        `SELECT * FROM movies 
         WHERE LOWER(original_title) = LOWER($1) 
         AND release_year = $2
         LIMIT 1`,
        [originalTitle, releaseYear]
      );
      return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding movie by title and year: ${error.message}`);
    }
  }

  // Update or create movie with Finnkino ID
  static async upsertWithFinnkinoId(movieData, finnkinoId) {
    try {
      const { title, releaseYear, tmdbId, posterUrl } = movieData;

      console.log('Upserting movie with Finnkino ID:', {
        title,
        releaseYear,
        tmdbId,
        finnkinoId
      });

      // First, try to find existing movie by original_title and release_year
      const existingMovie = await Movie.findByTitleAndYear(title, releaseYear);

      if (existingMovie) {
        // Movie exists, update it with f_id
        console.log(`Found existing movie (id: ${existingMovie.id}), adding f_id: ${finnkinoId}`);
        
        const result = await query(
          `UPDATE movies 
           SET f_id = $1,
               tmdb_id = COALESCE($2, tmdb_id),
               poster_url = COALESCE($3, poster_url)
           WHERE id = $4
           RETURNING *`,
          [finnkinoId, tmdbId, posterUrl, existingMovie.id]
        );

        return new Movie(result.rows[0]);
      } else {
        // Movie doesn't exist, create new one with f_id as primary key
        console.log(`Movie not found in database, creating new with f_id: ${finnkinoId}`);
        
        const result = await query(
          `INSERT INTO movies (id, original_title, release_year, tmdb_id, poster_url, f_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             f_id = EXCLUDED.f_id,
             original_title = EXCLUDED.original_title,
             release_year = EXCLUDED.release_year,
             tmdb_id = EXCLUDED.tmdb_id,
             poster_url = EXCLUDED.poster_url
           RETURNING *`,
          [finnkinoId.toString(), title, releaseYear, tmdbId, posterUrl, finnkinoId]
        );

        return new Movie(result.rows[0]);
      }
    } catch (error) {
      // Handle unique constraint violations gracefully
      if (error.code === '23505') {
        console.log(`Movie with f_id ${finnkinoId} already exists`);
        return null;
      }
      throw new Error(`Error upserting movie with Finnkino ID: ${error.message}`);
    }
  }

  // Find all movies with Finnkino ID (movies currently in theaters)
  static async findWithFinnkinoId({ limit = 100, offset = 0 } = {}) {
    try {
      // Get movies with f_id
      const result = await query(
        `SELECT 
          id,
          original_title,
          release_year,
          tmdb_id,
          poster_url,
          f_id
        FROM movies 
        WHERE f_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total
        FROM movies 
        WHERE f_id IS NOT NULL`
      );

      const total = parseInt(countResult.rows[0].total);

      return {
        movies: result.rows,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error) {
      throw new Error(`Error finding movies with Finnkino ID: ${error.message}`);
    }
  }

  // Create or update movie from TMDB data
  static async createFromTmdb(tmdbData) {
    try {
      // Validate required fields - skip if null/undefined
      if (!tmdbData.originalTitle || !tmdbData.id) {
        console.log('Skipping movie save - missing required fields:', {
          originalTitle: tmdbData.originalTitle,
          tmdb_id: tmdbData.id
        });
        return null;
      }

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
      const skipped = [];

      for (const movieData of moviesArray) {
        try {
          // Validate required fields - skip if null/undefined
          if (!movieData.originalTitle || !movieData.id) {
            skipped.push({
              movieId: movieData.id,
              title: movieData.originalTitle,
              reason: 'Missing required fields (original_title or tmdb_id)'
            });
            console.log('Skipping movie - missing required fields:', {
              originalTitle: movieData.originalTitle,
              tmdb_id: movieData.id
            });
            continue;
          }

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
        skipped: skipped,
        stats: {
          total: moviesArray.length,
          created: processedMovies.filter(m => m.status === 'created').length,
          existing: processedMovies.filter(m => m.status === 'existing').length,
          failed: errors.length,
          skipped: skipped.length
        }
      };
    } catch (error) {
      throw new Error(`Error processing multiple movies: ${error.message}`);
    }
  }
}

export default Movie;

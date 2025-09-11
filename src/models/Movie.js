import { query } from '../config/database.js';

class Movie {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.genre = data.genre;
    this.release_year = data.release_year;
    this.rating = data.rating;
    this.director = data.director;
    this.poster_url = data.poster_url;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // CREATE - Luo uusi elokuva
  static async create(movieData) {
    try {
      const { title, description, genre, release_year, rating, director, poster_url, created_by } = movieData;
      const result = await query(
        `INSERT INTO movies (title, description, genre, release_year, rating, director, poster_url, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [title, description, genre, release_year, rating, director, poster_url, created_by]
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

  // READ - Hae kaikki elokuvat
  static async findAll(filters = {}, limit = 50, offset = 0) {
    try {
      let queryText = 'SELECT * FROM movies';
      let queryParams = [];
      let paramCount = 1;
      let conditions = [];

      // Lisää suodattimet
      if (filters.genre) {
        conditions.push(`genre ILIKE $${paramCount}`);
        queryParams.push(`%${filters.genre}%`);
        paramCount++;
      }

      if (filters.release_year) {
        conditions.push(`release_year = $${paramCount}`);
        queryParams.push(filters.release_year);
        paramCount++;
      }

      if (filters.director) {
        conditions.push(`director ILIKE $${paramCount}`);
        queryParams.push(`%${filters.director}%`);
        paramCount++;
      }

      if (filters.title) {
        conditions.push(`title ILIKE $${paramCount}`);
        queryParams.push(`%${filters.title}%`);
        paramCount++;
      }

      if (filters.min_rating) {
        conditions.push(`rating >= $${paramCount}`);
        queryParams.push(filters.min_rating);
        paramCount++;
      }

      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }

      queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limit, offset);

      const result = await query(queryText, queryParams);
      return result.rows.map(row => new Movie(row));
    } catch (error) {
      throw new Error(`Error finding movies: ${error.message}`);
    }
  }

  // READ - Hae elokuvat genren perusteella
  static async findByGenre(genre, limit = 50, offset = 0) {
    try {
      const result = await query(
        'SELECT * FROM movies WHERE genre ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [`%${genre}%`, limit, offset]
      );
      return result.rows.map(row => new Movie(row));
    } catch (error) {
      throw new Error(`Error finding movies by genre: ${error.message}`);
    }
  }

  // READ - Hae käyttäjän luomat elokuvat
  static async findByUser(userId, limit = 50, offset = 0) {
    try {
      const result = await query(
        'SELECT * FROM movies WHERE created_by = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );
      return result.rows.map(row => new Movie(row));
    } catch (error) {
      throw new Error(`Error finding movies by user: ${error.message}`);
    }
  }

  // READ - Etsi elokuvia tekstihakulla
  static async search(searchTerm, limit = 50, offset = 0) {
    try {
      const result = await query(
        `SELECT * FROM movies 
         WHERE title ILIKE $1 OR description ILIKE $1 OR director ILIKE $1 OR genre ILIKE $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [`%${searchTerm}%`, limit, offset]
      );
      return result.rows.map(row => new Movie(row));
    } catch (error) {
      throw new Error(`Error searching movies: ${error.message}`);
    }
  }

  // UPDATE - Päivitä elokuvan tiedot
  static async updateById(id, updateData) {
    try {
      const allowedFields = ['title', 'description', 'genre', 'release_year', 'rating', 'director', 'poster_url'];
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
        `UPDATE movies SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
        values
      );

      return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error updating movie: ${error.message}`);
    }
  }

  // DELETE - Poista elokuva ID:n perusteella
  static async deleteById(id) {
    try {
      const result = await query('DELETE FROM movies WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0 ? new Movie(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error deleting movie: ${error.message}`);
    }
  }

  // Helper - Laske elokuvien määrä
  static async count(filters = {}) {
    try {
      let queryText = 'SELECT COUNT(*) FROM movies';
      let queryParams = [];
      let paramCount = 1;
      let conditions = [];

      // Sama suodatinlogiikka kuin findAll:ssa
      if (filters.genre) {
        conditions.push(`genre ILIKE $${paramCount}`);
        queryParams.push(`%${filters.genre}%`);
        paramCount++;
      }

      if (filters.release_year) {
        conditions.push(`release_year = $${paramCount}`);
        queryParams.push(filters.release_year);
        paramCount++;
      }

      if (filters.director) {
        conditions.push(`director ILIKE $${paramCount}`);
        queryParams.push(`%${filters.director}%`);
        paramCount++;
      }

      if (filters.title) {
        conditions.push(`title ILIKE $${paramCount}`);
        queryParams.push(`%${filters.title}%`);
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

  // Instance method - Palauta elokuvan julkiset tiedot
  toPublicObject() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      genre: this.genre,
      release_year: this.release_year,
      rating: this.rating,
      director: this.director,
      poster_url: this.poster_url,
      created_by: this.created_by,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Instance method - Päivitä tämä elokuva
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
}

export default Movie;

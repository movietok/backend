import { query } from '../config/database.js';

class Genre {
  /**
   * Get all genres from the database
   * @returns {Promise<Array>} Array of genres with id and name
   */
  static async getAllGenres() {
    try {
      const result = await query('SELECT id, name FROM "Genres" ORDER BY id ASC');
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to fetch genres: ${error.message}`);
    }
  }
}

export default Genre;
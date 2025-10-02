import { query } from '../config/database.js';

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.real_name = data.real_name;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // CREATE - Luo uusi käyttäjä
  static async create(userData) {
    try {
      const { username, email, password } = userData;
      const result = await query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
        [username, email, password]
      );
      return new User(result.rows[0]);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // READ - Hae käyttäjä ID:n perusteella
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // READ - Hae käyttäjä sähköpostin perusteella
  static async findByEmail(email) {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // READ - Hae käyttäjä käyttäjänimen perusteella
  static async findByUsername(username) {
    try {
      const result = await query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  // READ - Hae kaikki käyttäjät
  static async findAll(limit = 50, offset = 0) {
    try {
      const result = await query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return result.rows.map(row => new User(row));
    } catch (error) {
      throw new Error(`Error finding all users: ${error.message}`);
    }
  }

  // UPDATE - Päivitä käyttäjän tiedot
  static async updateById(id, updateData) {
    try {
      const allowedFields = ['username', 'email', 'password_hash'];
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
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
        values
      );

      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // DELETE - Poista käyttäjä ID:n perusteella
  static async deleteById(id) {
    try {
      const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Helper method - Tarkista onko käyttäjä olemassa
  static async exists(field, value) {
    try {
      const allowedFields = ['id', 'email', 'username'];
      if (!allowedFields.includes(field)) {
        throw new Error('Invalid field for existence check');
      }

      const result = await query(`SELECT id FROM users WHERE ${field} = $1`, [value]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking user existence: ${error.message}`);
    }
  }

  // Instance method - Palauta käyttäjän julkiset tiedot (ilman salasanaa)
  toPublicObject() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Instance method - Päivitä tämä käyttäjä
  async update(updateData) {
    const updated = await User.updateById(this.id, updateData);
    if (updated) {
      Object.assign(this, updated);
    }
    return updated;
  }

  // Instance method - Poista tämä käyttäjä
  async delete() {
    return await User.deleteById(this.id);
  }
}

export default User;

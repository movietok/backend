import { query } from '../config/database.js';

class Group {
  /**
   * Create a new group
   * @param {Object} groupData Group data
   * @param {string} groupData.name Group name
   * @param {string} groupData.ownerId Owner's user ID
   * @param {string} groupData.description Group description
   * @param {string} groupData.visibility Group visibility ('public', 'private', or 'closed')
   * @returns {Promise<Object>} Created group
   */
  static async create({ name, ownerId, description, visibility = 'public' }) {
    try {
      // Validate visibility
      if (!['public', 'private', 'closed'].includes(visibility)) {
        throw new Error('Invalid visibility value. Must be public, private, or closed');
      }

      // Check if group with same name already exists
      const existingGroup = await query(
        'SELECT id FROM groups WHERE LOWER(name) = LOWER($1)',
        [name]
      );

      if (existingGroup.rows.length > 0) {
        throw new Error('A group with this name already exists');
      }

      const result = await query(
        'INSERT INTO groups (name, owner_id, description, visibility) VALUES ($1, $2, $3, $4) RETURNING id, name, owner_id, description, visibility, created_at',
        [name, ownerId, description, visibility]
      );
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  /**
   * Get group details by ID
   * @param {number} gID Group ID
   * @returns {Promise<Object>} Group details
   */
  static async getById(gID) {
    try {
      // Debug logging for input value
      console.log('=== Group.getById Debug ===');
      console.log('Raw gID received:', gID);
      console.log('Type of gID:', typeof gID);
      
      const result = await query(
        `SELECT 
            g.id,
            g.name,
            g.description,
            g.theme_id,
            g.visibility,
            g.created_at,
            g.owner_id,
            u.username AS owner_name
        FROM groups g
        JOIN users u ON g.owner_id = u.id
        WHERE g.id = $1`,
        [gID]
      );

      if (result.rows.length === 0) {
        throw new Error('Group not found');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get group: ${error.message}`);
    }
  }

  /**
   * Delete a group
   * @param {number} gID Group ID
   * @param {number} ownerId Owner's user ID (for verification)
   * @returns {Promise<boolean>} True if deleted successfully
   */
  static async delete(gID, ownerId) {
    try {
      const result = await query(
        'DELETE FROM groups WHERE id = $1 AND owner_id = $2 RETURNING id',
        [gID, ownerId]
      );

      if (result.rows.length === 0) {
        throw new Error('User is not the owner');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }
}

export default Group;
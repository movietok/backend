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

      // Start a transaction
      await query('BEGIN');

      try {
        // Create the group
        const groupResult = await query(
          'INSERT INTO groups (name, owner_id, description, visibility) VALUES ($1, $2, $3, $4) RETURNING id, name, owner_id, description, visibility, created_at',
          [name, ownerId, description, visibility]
        );

        const group = groupResult.rows[0];

        // Add the owner to group_members
        await query(
          'INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
          [group.id, ownerId, 'owner']
        );

        // Commit the transaction
        await query('COMMIT');

        console.log(`Created group ${group.id} and added owner ${ownerId} as member`);
        return group;
      } catch (error) {
        // Rollback in case of error
        await query('ROLLBACK');
        throw error;
      }
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
      const result = await query(
        `SELECT 
            g.id,
            g.name,
            g.description,
            g.theme_id,
            g.visibility,
            g.poster_url,
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
      // First check if the group exists
      const groupCheck = await query(
        'SELECT id, owner_id FROM groups WHERE id = $1',
        [gID]
      );

      if (groupCheck.rows.length === 0) {
        console.error(`Delete group failed: Group with ID ${gID} not found`);
        throw new Error('Group not found');
      }

      // If group exists, check ownership and delete
      if (groupCheck.rows[0].owner_id !== ownerId) {
        console.error(`Delete group failed: User ${ownerId} is not the owner of group ${gID}`);
        throw new Error('User is not the owner of this group');
      }

      const result = await query(
        'DELETE FROM groups WHERE id = $1 AND owner_id = $2 RETURNING id',
        [gID, ownerId]
      );

      console.log(`Group ${gID} successfully deleted by user ${ownerId}`);
      return true;
    } catch (error) {
      console.error(`Delete group error details:`, {
        groupId: gID,
        userId: ownerId,
        error: error.message
      });
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  /**
   * Search for groups by name
   * @param {string} searchQuery Search query
   * @param {number} limit Maximum number of results to return
   * @returns {Promise<Array>} Array of matching groups
   */
  static async searchByName(searchQuery, limit = 20) {
    try {
      const result = await query(
        `SELECT 
          g.id,
          g.name,
          g.description,
          g.visibility,
          g.theme_id,
          g.poster_url,
          g.created_at,
          g.owner_id,
          u.username AS owner_name,
          similarity(LOWER(g.name), LOWER($1)) AS name_similarity
        FROM groups g
        JOIN users u ON g.owner_id = u.id
        WHERE 
          (g.name ILIKE $2 OR similarity(LOWER(g.name), LOWER($1)) > 0.3)
          AND g.visibility = 'public'
        ORDER BY name_similarity DESC
        LIMIT $3`,
        [searchQuery, `%${searchQuery}%`, limit]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to search groups: ${error.message}`);
    }
  }

  /**
   * Get all members of a group
   * @param {number} groupId Group ID
   * @returns {Promise<Array>} Array of group members with their details
   */
  static async getMembers(groupId) {
    try {
      // First check if the group exists
      const groupCheck = await query(
        'SELECT id FROM groups WHERE id = $1',
        [groupId]
      );

      if (groupCheck.rows.length === 0) {
        console.error(`Get members failed: Group with ID ${groupId} not found`);
        throw new Error('Group not found');
      }

      const result = await query(
        `SELECT 
          u.id,
          u.username,
          u.email,
          gm.joined_at,
          gm.role
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
        ORDER BY gm.joined_at DESC`,
        [groupId]
      );

      return result.rows;
    } catch (error) {
      console.error(`Get members error details:`, {
        groupId,
        error: error.message
      });
      throw new Error(`Failed to get group members: ${error.message}`);
    }
  }

  /**
   * Add a user to a group
   * @param {number} groupId Group ID
   * @param {number} userId User ID to add
   * @param {number} addedByUserId ID of the user performing the action (must be group owner)
   * @param {string} role Role to assign (default: 'member')
   * @returns {Promise<Object>} Added member details
   */
  static async joinGroup(groupId, userId) {
    try {
      // Start a transaction
      await query('BEGIN');

      try {
        // Check if group exists and get visibility
        const groupCheck = await query(
          'SELECT owner_id, visibility FROM groups WHERE id = $1',
          [groupId]
        );

        if (groupCheck.rows.length === 0) {
          throw new Error('Group not found');
        }

        // Check visibility rules
        const { visibility, owner_id } = groupCheck.rows[0];
        
        if (visibility === 'private') {
          throw new Error('This is a private group. You cannot join directly.');
        }

        if (visibility === 'closed') {
          throw new Error('This is a closed group. Contact support for access.');
        }

        // Prevent owner from re-joining
        if (userId === owner_id) {
          throw new Error('You are already the owner of this group');
        }

        // Check if user is already a member
        const memberCheck = await query(
          'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userId]
        );

        if (memberCheck.rows.length > 0) {
          throw new Error('You are already a member of this group');
        }

        // Add user to group as member
        const result = await query(
          `INSERT INTO group_members (group_id, user_id, role, joined_at)
           VALUES ($1, $2, 'member', CURRENT_TIMESTAMP)
           RETURNING user_id`,
          [groupId, userId]
        );

        // Get member details
        const memberDetails = await query(
          `SELECT 
            u.id,
            u.username,
            u.email,
            gm.joined_at,
            gm.role
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.user_id = $1`,
          [result.rows[0].user_id]
        );

        await query('COMMIT');

        console.log(`User ${userId} joined group ${groupId}`);
        return memberDetails.rows[0];
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Join group error details:`, {
        groupId,
        userId,
        error: error.message
      });
      throw new Error(`Failed to join group: ${error.message}`);
    }
  }
}

export default Group;
import { query } from '../config/database.js';

class Group {
  /**
   * Create a new group
   * @param {Object} groupData Group data
   * @param {string} groupData.name Group name
   * @param {string} groupData.ownerId Owner's user ID
   * @param {string} groupData.description Group description
   * @param {string} groupData.visibility Group visibility ('public', 'private', or 'closed')
   * @param {string} groupData.poster_url Group poster URL (optional)
   * @param {Array<number>} groupData.tags Array of genre IDs to tag the group with (optional)
   * @returns {Promise<Object>} Created group
   */
  static async create({ name, ownerId, description, visibility = 'public', poster_url, tags = [] }) {
    try {
      // Validate visibility
      if (!['public', 'private', 'closed'].includes(visibility)) {
        throw new Error('Invalid visibility value. Must be public, private, or closed');
      }

      // Validate tags if provided
      if (tags && tags.length > 0) {
        // Ensure all tags are valid numbers
        const validTags = tags.filter(tag => Number.isInteger(tag) && tag > 0);
        if (validTags.length !== tags.length) {
          throw new Error('All tags must be valid positive integers');
        }
        // Remove duplicates
        tags = [...new Set(validTags)];
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
          'INSERT INTO groups (name, owner_id, description, visibility, poster_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, owner_id, description, visibility, poster_url, created_at',
          [name, ownerId, description, visibility, poster_url]
        );

        const group = groupResult.rows[0];

        // Add the owner to group_members
        await query(
          'INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
          [group.id, ownerId, 'owner']
        );

        // Add tags if provided
        if (tags && tags.length > 0) {
          for (const genreId of tags) {
            await query(
              'INSERT INTO tags (group_id, genre_id) VALUES ($1, $2)',
              [group.id, genreId]
            );
          }
          console.log(`Added ${tags.length} tags to group ${group.id}: ${tags.join(', ')}`);
        }

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
   * @param {number|null} userId User ID requesting the group details (optional)
   * @returns {Promise<Object>} Group details
   */
  static async getById(gID, userId = null) {
    try {      
      // Start a transaction to ensure consistent read
      await query('BEGIN');

      try {
        // Get group details
        const groupResult = await query(
          `SELECT 
              g.id,
              g.name,
              g.description,
              g.theme_id,
              g.visibility,
              g.poster_url,
              g.created_at,
              g.owner_id,
              u.username AS owner_name,
              COUNT(gm.user_id) AS member_count
          FROM groups g
          JOIN users u ON g.owner_id = u.id
          LEFT JOIN group_members gm ON g.id = gm.group_id
          WHERE g.id = $1
          GROUP BY g.id, u.username`,
          [gID]
        );

        if (groupResult.rows.length === 0) {
          throw new Error('Group not found');
        }

        const group = groupResult.rows[0];

        // Check access permissions for private groups
        if (group.visibility === 'private') {
          if (!userId) {
            throw new Error('Authentication required to view this private group');
          }

          // Check if user is a member or owner of the private group
          const memberCheck = await query(
            'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2',
            [gID, userId]
          );

          const isOwner = group.owner_id === userId;
          const isMember = memberCheck.rows.length > 0;

          if (!isOwner && !isMember) {
            throw new Error('You are not a member of this private group and cannot view its details');
          }
        }

        // Get group members (without email)
        const membersResult = await query(
          `SELECT 
            u.id,
            u.username,
            gm.joined_at,
            gm.role
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = $1
          ORDER BY gm.joined_at DESC`,
          [gID]
        );

        // Combine group details with members
        group.members = membersResult.rows;

        await query('COMMIT');
        return group;
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
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
      // Start a transaction
      await query('BEGIN');

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

        // If group exists, check ownership
        if (groupCheck.rows[0].owner_id !== ownerId) {
          console.error(`Delete group failed: User ${ownerId} is not the owner of group ${gID}`);
          throw new Error('User is not the owner of this group');
        }

        // Delete related records in the correct order
        
        // 1. Delete tags associated with the group
        const deletedTags = await query(
          'DELETE FROM tags WHERE group_id = $1 RETURNING genre_id',
          [gID]
        );

        // 2. Delete group members
        const deletedMembers = await query(
          'DELETE FROM group_members WHERE group_id = $1 RETURNING user_id, role',
          [gID]
        );

        // 3. Finally delete the group itself
        const result = await query(
          'DELETE FROM groups WHERE id = $1 AND owner_id = $2 RETURNING id',
          [gID, ownerId]
        );

        // Commit the transaction
        await query('COMMIT');

        console.log(`Group ${gID} successfully deleted by user ${ownerId}:`, {
          deletedTags: deletedTags.rows.length,
          deletedMembers: deletedMembers.rows.length,
          deletedGroup: result.rows.length > 0
        });

        return {
          success: true,
          deletedTags: deletedTags.rows.length,
          deletedMembers: deletedMembers.rows.length
        };
      } catch (error) {
        // Rollback in case of error
        await query('ROLLBACK');
        throw error;
      }
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
          COUNT(gm.user_id) AS member_count,
          similarity(LOWER(g.name), LOWER($1)) AS name_similarity
        FROM groups g
        JOIN users u ON g.owner_id = u.id
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE 
          (g.name ILIKE $2 OR similarity(LOWER(g.name), LOWER($1)) > 0.3)
          AND g.visibility = 'public'
        GROUP BY g.id, u.username
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

  /**
   * Get groups by genre tags
   * @param {Array<number>} genreIds Array of genre IDs to filter by (optional - if empty, returns all groups)
   * @param {number} limit Maximum number of results to return
   * @param {string} matchType 'any' (OR) or 'all' (AND) - whether to match any tag or all tags
   * @returns {Promise<Array>} Array of groups that match the genre tags or all groups if no genres specified
   */
  static async getByGenreTags(genreIds, limit = 20, matchType = 'any') {
    try {
      // If no genres provided, return all public groups
      if (!genreIds || genreIds.length === 0) {
        const query_text = `
          SELECT DISTINCT
            g.id,
            g.name,
            g.description,
            g.visibility,
            g.theme_id,
            g.poster_url,
            g.created_at,
            g.owner_id,
            u.username AS owner_name,
            COUNT(gm.user_id) AS member_count,
            COALESCE(array_agg(DISTINCT t.genre_id) FILTER (WHERE t.genre_id IS NOT NULL), '{}') AS genre_tags
          FROM groups g
          JOIN users u ON g.owner_id = u.id
          LEFT JOIN group_members gm ON g.id = gm.group_id
          LEFT JOIN tags t ON g.id = t.group_id
          WHERE g.visibility = 'public'
          GROUP BY g.id, u.username
          ORDER BY g.created_at DESC
          LIMIT $1
        `;
        const result = await query(query_text, [limit]);
        return result.rows;
      }

      // Validate matchType
      if (!['any', 'all'].includes(matchType)) {
        throw new Error('Match type must be "any" or "all"');
      }

      let query_text;
      let queryParams;

      if (matchType === 'any') {
        // Match groups that have ANY of the specified genre tags
        query_text = `
          SELECT DISTINCT
            g.id,
            g.name,
            g.description,
            g.visibility,
            g.theme_id,
            g.poster_url,
            g.created_at,
            g.owner_id,
            u.username AS owner_name,
            COUNT(gm.user_id) AS member_count,
            array_agg(DISTINCT t.genre_id) AS genre_tags
          FROM groups g
          JOIN users u ON g.owner_id = u.id
          LEFT JOIN group_members gm ON g.id = gm.group_id
          JOIN tags t ON g.id = t.group_id
          WHERE t.genre_id = ANY($1)
            AND g.visibility = 'public'
          GROUP BY g.id, u.username
          ORDER BY g.created_at DESC
          LIMIT $2
        `;
        queryParams = [genreIds, limit];
      } else {
        // Match groups that have ALL of the specified genre tags
        query_text = `
          SELECT DISTINCT
            g.id,
            g.name,
            g.description,
            g.visibility,
            g.theme_id,
            g.poster_url,
            g.created_at,
            g.owner_id,
            u.username AS owner_name,
            COUNT(gm.user_id) AS member_count,
            array_agg(DISTINCT t.genre_id) AS genre_tags
          FROM groups g
          JOIN users u ON g.owner_id = u.id
          LEFT JOIN group_members gm ON g.id = gm.group_id
          JOIN tags t ON g.id = t.group_id
          WHERE g.id IN (
            SELECT group_id 
            FROM tags 
            WHERE genre_id = ANY($1)
            GROUP BY group_id 
            HAVING COUNT(DISTINCT genre_id) = $2
          )
          AND g.visibility = 'public'
          GROUP BY g.id, u.username
          ORDER BY g.created_at DESC
          LIMIT $3
        `;
        queryParams = [genreIds, genreIds.length, limit];
      }

      const result = await query(query_text, queryParams);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get groups by genre tags: ${error.message}`);
    }
  }

  /**
   * Add a member to a group (owner only)
   * @param {number} groupId Group ID
   * @param {number} userIdToAdd User ID to add to the group
   * @param {number} ownerId Owner's user ID (for verification)
   * @param {string} role Role to assign (default: 'member')
   * @returns {Promise<Object>} Added member details
   */
  static async addMember(groupId, userIdToAdd, ownerId, role = 'member') {
    try {
      // Start a transaction
      await query('BEGIN');

      try {
        // Check if group exists and verify ownership
        const groupCheck = await query(
          'SELECT owner_id, visibility FROM groups WHERE id = $1',
          [groupId]
        );

        if (groupCheck.rows.length === 0) {
          throw new Error('Group not found');
        }

        if (groupCheck.rows[0].owner_id !== ownerId) {
          throw new Error('Only the group owner can add members');
        }

        // Check if the user to add exists
        const userCheck = await query(
          'SELECT id, username FROM users WHERE id = $1',
          [userIdToAdd]
        );

        if (userCheck.rows.length === 0) {
          throw new Error('User to add not found');
        }

        // Prevent adding the owner as a member (they're already the owner)
        if (userIdToAdd === ownerId) {
          throw new Error('Cannot add the group owner as a member');
        }

        // Check if user is already a member
        const memberCheck = await query(
          'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userIdToAdd]
        );

        if (memberCheck.rows.length > 0) {
          throw new Error('User is already a member of this group');
        }

        // Validate role
        if (!['member', 'moderator'].includes(role)) {
          throw new Error('Invalid role. Must be "member" or "moderator"');
        }

        // Add user to group
        await query(
          `INSERT INTO group_members (group_id, user_id, role, joined_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [groupId, userIdToAdd, role]
        );

        // Get the added member's details
        const memberDetails = await query(
          `SELECT 
            u.id,
            u.username,
            u.email,
            gm.joined_at,
            gm.role
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = $1 AND gm.user_id = $2`,
          [groupId, userIdToAdd]
        );

        await query('COMMIT');

        console.log(`Owner ${ownerId} added user ${userIdToAdd} to group ${groupId} with role ${role}`);
        return memberDetails.rows[0];
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Add member error details:`, {
        groupId,
        userIdToAdd,
        ownerId,
        role,
        error: error.message
      });
      throw new Error(`Failed to add member: ${error.message}`);
    }
  }

  /**
   * Remove a member from a group
   * @param {number} groupId Group ID
   * @param {number} userIdToRemove User ID to remove from the group
   * @param {number} requestingUserId User ID performing the removal
   * @returns {Promise<Object>} Removal confirmation
   */
  static async removeMember(groupId, userIdToRemove, requestingUserId) {
    try {
      // Start a transaction
      await query('BEGIN');

      try {
        // Check if group exists
        const groupCheck = await query(
          'SELECT owner_id FROM groups WHERE id = $1',
          [groupId]
        );

        if (groupCheck.rows.length === 0) {
          throw new Error('Group not found');
        }

        const groupOwnerId = groupCheck.rows[0].owner_id;

        // Check if the user to remove exists in the group
        const memberCheck = await query(
          'SELECT user_id, role FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userIdToRemove]
        );

        if (memberCheck.rows.length === 0) {
          throw new Error('User is not a member of this group');
        }

        // Get requesting user's role in the group (if they are a member)
        const requestingUserRole = await query(
          'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, requestingUserId]
        );

        // Authorization logic
        const isOwner = requestingUserId === groupOwnerId;
        const isModerator = requestingUserRole.rows.length > 0 && requestingUserRole.rows[0].role === 'moderator';
        const isSelfRemoval = requestingUserId === userIdToRemove;

        // Check if the requesting user has permission to remove the member
        if (!isOwner && !isModerator && !isSelfRemoval) {
          throw new Error('You do not have permission to remove this member');
        }

        // Prevent removing the group owner
        if (userIdToRemove === groupOwnerId) {
          throw new Error('Cannot remove the group owner');
        }

        // Additional rule: moderators cannot remove other moderators (only owners can)
        const targetUserRole = memberCheck.rows[0].role;
        if (!isOwner && isModerator && targetUserRole === 'moderator' && !isSelfRemoval) {
          throw new Error('Moderators cannot remove other moderators');
        }

        // Get user details before removal
        const userDetails = await query(
          `SELECT 
            u.id,
            u.username,
            gm.role
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = $1 AND gm.user_id = $2`,
          [groupId, userIdToRemove]
        );

        // Remove the member
        await query(
          'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userIdToRemove]
        );

        await query('COMMIT');

        console.log(`User ${requestingUserId} removed user ${userIdToRemove} from group ${groupId}`);
        
        return {
          removedUser: userDetails.rows[0],
          removedBy: requestingUserId,
          isOwnerAction: isOwner,
          isModeratorAction: isModerator,
          isSelfRemoval: isSelfRemoval
        };
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Remove member error details:`, {
        groupId,
        userIdToRemove,
        requestingUserId,
        error: error.message
      });
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  /**
   * Update group details
   * @param {number} gID Group ID
   * @param {number} ownerId Owner's user ID (for verification)
   * @param {Object} updates Object containing fields to update
   * @param {string} updates.name New group name (optional)
   * @param {string} updates.description New description (optional)
   * @param {number} updates.theme_id New theme ID (optional)
   * @param {string} updates.visibility New visibility (optional)
   * @param {string} updates.poster_url New poster URL (optional)
   * @param {Array<number>} updates.tags Array of genre IDs to replace current tags (optional)
   * @returns {Promise<Object>} Updated group details
   */
  static async updateDetails(gID, ownerId, updates) {
    try {
      // Start a transaction
      await query('BEGIN');

      try {
        // Check if group exists and verify ownership
        const groupCheck = await query(
          'SELECT id, owner_id, name FROM groups WHERE id = $1',
          [gID]
        );

        if (groupCheck.rows.length === 0) {
          throw new Error('Group not found');
        }

        if (groupCheck.rows[0].owner_id !== ownerId) {
          throw new Error('Only the group owner can update group details');
        }

        // Validate updates object
        if (!updates || Object.keys(updates).length === 0) {
          throw new Error('No updates provided');
        }

        // Validate allowed fields
        const allowedFields = ['name', 'description', 'theme_id', 'visibility', 'poster_url', 'tags'];
        const updateFields = Object.keys(updates);
        const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
        
        if (invalidFields.length > 0) {
          throw new Error(`Invalid fields: ${invalidFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`);
        }

        // Validate specific field values
        if (updates.visibility && !['public', 'private', 'closed'].includes(updates.visibility)) {
          throw new Error('Invalid visibility value. Must be public, private, or closed');
        }

        if (updates.theme_id !== undefined && updates.theme_id !== null && isNaN(parseInt(updates.theme_id))) {
          throw new Error('Theme ID must be a valid number or null');
        }

        // Validate tags if provided
        if (updates.tags !== undefined) {
          if (!Array.isArray(updates.tags)) {
            throw new Error('Tags must be an array of numbers');
          }
          // Ensure all tags are valid numbers
          const validTags = updates.tags.filter(tag => Number.isInteger(tag) && tag > 0);
          if (validTags.length !== updates.tags.length) {
            throw new Error('All tags must be valid positive integers');
          }
          // Remove duplicates
          updates.tags = [...new Set(validTags)];
        }

        // Check for duplicate group name if name is being updated
        if (updates.name && updates.name !== groupCheck.rows[0].name) {
          const nameCheck = await query(
            'SELECT id FROM groups WHERE LOWER(name) = LOWER($1) AND id != $2',
            [updates.name, gID]
          );

          if (nameCheck.rows.length > 0) {
            throw new Error('A group with this name already exists');
          }
        }

        // Build dynamic update query
        const setClause = [];
        const values = [];
        let paramCount = 1;

        if (updates.name !== undefined) {
          setClause.push(`name = $${paramCount}`);
          values.push(updates.name);
          paramCount++;
        }

        if (updates.description !== undefined) {
          setClause.push(`description = $${paramCount}`);
          values.push(updates.description);
          paramCount++;
        }

        if (updates.theme_id !== undefined) {
          setClause.push(`theme_id = $${paramCount}`);
          values.push(updates.theme_id);
          paramCount++;
        }

        if (updates.visibility !== undefined) {
          setClause.push(`visibility = $${paramCount}`);
          values.push(updates.visibility);
          paramCount++;
        }

        if (updates.poster_url !== undefined) {
          setClause.push(`poster_url = $${paramCount}`);
          values.push(updates.poster_url);
          paramCount++;
        }

        // Ensure we have something to update
        if (setClause.length === 0) {
          throw new Error('No valid fields to update');
        }

        // Add WHERE clause parameters
        const whereParamStart = paramCount;
        const whereParamNext = paramCount + 1;
        values.push(gID, ownerId);
        const whereClause = `WHERE id = $${whereParamStart} AND owner_id = $${whereParamNext}`;

        // Execute update
        const updateQuery = `
          UPDATE groups 
          SET ${setClause.join(', ')} 
          ${whereClause}
          RETURNING id, name, description, theme_id, visibility, poster_url, created_at, owner_id
        `;

        console.log('Update query:', updateQuery);
        console.log('Values:', values);

        const result = await query(updateQuery, values);

        if (result.rows.length === 0) {
          throw new Error('Failed to update group details');
        }

        // Get owner name
        const ownerInfo = await query(
          'SELECT username FROM users WHERE id = $1',
          [ownerId]
        );

        const updatedGroup = result.rows[0];
        updatedGroup.owner_name = ownerInfo.rows[0]?.username;

        // Update tags if provided
        if (updates.tags !== undefined) {
          // First, delete all existing tags for this group
          await query(
            'DELETE FROM tags WHERE group_id = $1',
            [gID]
          );

          // Then add the new tags
          if (updates.tags.length > 0) {
            for (const genreId of updates.tags) {
              await query(
                'INSERT INTO tags (group_id, genre_id) VALUES ($1, $2)',
                [gID, genreId]
              );
            }
            console.log(`Updated tags for group ${gID}: ${updates.tags.join(', ')}`);
          } else {
            console.log(`Removed all tags from group ${gID}`);
          }
        }

        await query('COMMIT');

        console.log(`Group ${gID} details updated by owner ${ownerId}:`, {
          updatedFields: Object.keys(updates),
          values: updates
        });

        return updatedGroup;
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Update group details error:`, {
        groupId: gID,
        ownerId,
        updates,
        error: error.message
      });
      throw new Error(`Failed to update group details: ${error.message}`);
    }
  }
}

export default Group;
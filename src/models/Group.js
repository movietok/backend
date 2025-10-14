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
              COUNT(CASE WHEN gm.role != 'pending' THEN gm.user_id END) AS member_count
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

        // Get group genres/tags with genre names
        const genresResult = await query(
          `SELECT 
            t.genre_id,
            g.name AS genre_name
          FROM tags t
          JOIN genres g ON t.genre_id = g.id
          WHERE t.group_id = $1
          ORDER BY g.name ASC`,
          [gID]
        );

        // Combine group details with members and genres
        group.members = membersResult.rows;
        group.genres = genresResult.rows;

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
          COUNT(CASE WHEN gm.role != 'pending' THEN gm.user_id END) AS member_count,
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
      // If no genres provided, return all public and private groups
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
            (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.role != 'pending') AS member_count,
            COALESCE(array_agg(DISTINCT t.genre_id) FILTER (WHERE t.genre_id IS NOT NULL), '{}') AS genre_tags
          FROM groups g
          JOIN users u ON g.owner_id = u.id
          LEFT JOIN tags t ON g.id = t.group_id
          WHERE g.visibility IN ('public', 'private')
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
            (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.role != 'pending') AS member_count,
            array_agg(DISTINCT t.genre_id) AS genre_tags
          FROM groups g
          JOIN users u ON g.owner_id = u.id
          JOIN tags t ON g.id = t.group_id
          WHERE t.genre_id = ANY($1)
            AND g.visibility IN ('public', 'private')
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
            (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.role != 'pending') AS member_count,
            array_agg(DISTINCT t.genre_id) AS genre_tags
          FROM groups g
          JOIN users u ON g.owner_id = u.id
          JOIN tags t ON g.id = t.group_id
          WHERE g.id IN (
            SELECT group_id 
            FROM tags 
            WHERE genre_id = ANY($1)
            GROUP BY group_id 
            HAVING COUNT(DISTINCT genre_id) = $2
          )
          AND g.visibility IN ('public', 'private')
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
   * Request to join a group (creates pending membership)
   * @param {number} groupId Group ID
   * @param {number} userId User ID requesting to join
   * @returns {Promise<Object>} Join request details
   */
  static async requestToJoin(groupId, userId) {
    try {
      // Start a transaction
      await query('BEGIN');

      try {
        // Check if group exists
        const groupCheck = await query(
          'SELECT id, name, owner_id, visibility FROM groups WHERE id = $1',
          [groupId]
        );

        if (groupCheck.rows.length === 0) {
          throw new Error('Group not found');
        }

        const group = groupCheck.rows[0];

        // Check if user exists
        const userCheck = await query(
          'SELECT id, username FROM users WHERE id = $1',
          [userId]
        );

        if (userCheck.rows.length === 0) {
          throw new Error('User not found');
        }

        const user = userCheck.rows[0];

        // Prevent owner from requesting to join their own group
        if (userId === group.owner_id) {
          throw new Error('You are already the owner of this group');
        }

        // Check if user is already a member or has pending request
        const memberCheck = await query(
          'SELECT user_id, role FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userId]
        );

        if (memberCheck.rows.length > 0) {
          const currentRole = memberCheck.rows[0].role;
          if (currentRole === 'pending') {
            throw new Error('You already have a pending join request for this group');
          } else {
            throw new Error('You are already a member of this group');
          }
        }

        // Add user to group with pending role
        await query(
          `INSERT INTO group_members (group_id, user_id, role, joined_at)
           VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)`,
          [groupId, userId]
        );

        await query('COMMIT');

        console.log(`User ${userId} created join request for group ${groupId}`);
        
        return {
          group: {
            id: group.id,
            name: group.name
          },
          member: {
            id: user.id,
            username: user.username,
            role: 'pending',
            joined_at: new Date().toISOString()
          }
        };

      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Request to join error details:`, {
        groupId,
        userId,
        error: error.message
      });
      throw new Error(`Failed to process join request: ${error.message}`);
    }
  }

  /**
   * Approve a pending join request (owner or moderator only)
   * @param {number} groupId Group ID
   * @param {number} userIdToApprove User ID whose request to approve
   * @param {number} approverId ID of user performing the approval (owner or moderator)
   * @returns {Promise<Object>} Approval result
   */
  static async approvePendingMember(groupId, userIdToApprove, approverId) {
    try {
      // Start a transaction
      await query('BEGIN');

      try {
        // Check if group exists
        const groupCheck = await query(
          'SELECT owner_id, name FROM groups WHERE id = $1',
          [groupId]
        );

        if (groupCheck.rows.length === 0) {
          throw new Error('Group not found');
        }

        const group = groupCheck.rows[0];

        // Check if approver has permission (owner or moderator)
        const approverCheck = await query(
          'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, approverId]
        );

        const isOwner = parseInt(group.owner_id) === parseInt(approverId);
        const isModerator = approverCheck.rows.length > 0 && approverCheck.rows[0].role === 'moderator';

        if (!isOwner && !isModerator) {
          throw new Error('Only group owners or moderators can approve join requests');
        }

        // Check if there's a pending request from this user
        const pendingCheck = await query(
          'SELECT user_id, role FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = $3',
          [groupId, userIdToApprove, 'pending']
        );

        if (pendingCheck.rows.length === 0) {
          throw new Error('No pending join request found for this user');
        }

        // Get user details
        const userCheck = await query(
          'SELECT id, username FROM users WHERE id = $1',
          [userIdToApprove]
        );

        if (userCheck.rows.length === 0) {
          throw new Error('User not found');
        }

        const user = userCheck.rows[0];

        // Update role from pending to member
        await query(
          'UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3',
          ['member', groupId, userIdToApprove]
        );

        await query('COMMIT');

        console.log(`${isOwner ? 'Owner' : 'Moderator'} ${approverId} approved join request for user ${userIdToApprove} in group ${groupId}`);
        
        return {
          group: {
            id: groupId,
            name: group.name
          },
          member: {
            id: user.id,
            username: user.username,
            role: 'member'
          },
          approvedBy: {
            id: approverId,
            role: isOwner ? 'owner' : 'moderator'
          }
        };

      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Approve pending member error details:`, {
        groupId,
        userIdToApprove,
        approverId,
        error: error.message
      });
      throw new Error(`Failed to approve join request: ${error.message}`);
    }
  }

  /**
   * Leave a group (user removes themselves)
   * @param {number} groupId Group ID
   * @param {number} userId User ID leaving the group
   * @returns {Promise<Object>} Leave confirmation
   */
  static async leaveGroup(groupId, userId) {
    try {
      // Start a transaction
      await query('BEGIN');

      try {
        // Check if group exists
        const groupCheck = await query(
          'SELECT owner_id, name FROM groups WHERE id = $1',
          [groupId]
        );

        if (groupCheck.rows.length === 0) {
          throw new Error('Group not found');
        }

        const group = groupCheck.rows[0];

        // Prevent owner from leaving their own group
        if (userId === group.owner_id) {
          throw new Error('Group owners cannot leave their own group. Please delete the group');
        }

        // Check if user is a member of the group
        const memberCheck = await query(
          'SELECT user_id, role FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userId]
        );

        if (memberCheck.rows.length === 0) {
          throw new Error('You are not a member of this group');
        }

        const userRole = memberCheck.rows[0].role;

        // Get user details before removal
        const userDetails = await query(
          'SELECT id, username FROM users WHERE id = $1',
          [userId]
        );

        if (userDetails.rows.length === 0) {
          throw new Error('User not found');
        }

        const user = userDetails.rows[0];

        // Remove user from group
        await query(
          'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userId]
        );

        await query('COMMIT');

        console.log(`User ${userId} left group ${groupId} (was ${userRole})`);

        return {
          group: {
            id: groupId,
            name: group.name
          },
          user: {
            id: user.id,
            username: user.username,
            previousRole: userRole
          }
        };

      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Leave group error details:`, {
        groupId,
        userId,
        error: error.message
      });
      throw new Error(`Failed to leave group: ${error.message}`);
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

        // Authorization logic - only owners and moderators can remove members
        const isOwner = parseInt(requestingUserId) === parseInt(groupOwnerId);
        const isModerator = requestingUserRole.rows.length > 0 && requestingUserRole.rows[0].role === 'moderator';

        // Check if the requesting user has permission to remove the member
        if (!isOwner && !isModerator) {
          throw new Error('Only group owners and moderators can remove members');
        }

        // Prevent removing the group owner
        if (parseInt(userIdToRemove) === parseInt(groupOwnerId)) {
          throw new Error('Cannot remove the group owner');
        }

        // Prevent users from removing themselves (they should use the leave endpoint)
        if (parseInt(requestingUserId) === parseInt(userIdToRemove)) {
          throw new Error('Use the leave group endpoint to remove yourself from the group');
        }

        // Additional rule: moderators cannot remove other moderators (only owners can)
        const targetUserRole = memberCheck.rows[0].role;
        if (!isOwner && isModerator && targetUserRole === 'moderator') {
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
          isModeratorAction: isModerator
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
   * Update member role in a group (owner only)
   * @param {number} groupId Group ID
   * @param {number} memberId Member's user ID whose role to update
   * @param {number} ownerId Owner's user ID (for verification)
   * @param {string} newRole New role to assign ('member' or 'moderator')
   * @returns {Promise<Object>} Updated member details
   */
  static async updateMemberRole(groupId, memberId, ownerId, newRole) {
    try {
      // Start a transaction
      await query('BEGIN');

      try {
        // Check if group exists and verify ownership
        const groupCheck = await query(
          'SELECT owner_id FROM groups WHERE id = $1',
          [groupId]
        );

        if (groupCheck.rows.length === 0) {
          throw new Error('Group not found');
        }

        if (parseInt(groupCheck.rows[0].owner_id) !== parseInt(ownerId)) {
          throw new Error('Only the group owner can update member roles');
        }

        // Validate new role
        if (!['member', 'moderator'].includes(newRole)) {
          throw new Error('Invalid role. Must be "member" or "moderator"');
        }

        // Check if the user is a member of the group
        const memberCheck = await query(
          'SELECT user_id, role FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, memberId]
        );

        if (memberCheck.rows.length === 0) {
          throw new Error('User is not a member of this group');
        }

        // Prevent changing the owner's role
        if (memberId === ownerId) {
          throw new Error('Cannot change the role of the group owner');
        }

        const currentRole = memberCheck.rows[0].role;

        // Check if role is already the same
        if (currentRole === newRole) {
          throw new Error(`User is already a ${newRole}`);
        }

        // Update the member's role
        await query(
          'UPDATE group_members SET role = $1 WHERE group_id = $2 AND user_id = $3',
          [newRole, groupId, memberId]
        );

        // Get updated member details
        const updatedMember = await query(
          `SELECT 
            u.id,
            u.username,
            gm.joined_at,
            gm.role
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = $1 AND gm.user_id = $2`,
          [groupId, memberId]
        );

        await query('COMMIT');

        console.log(`Owner ${ownerId} updated role of user ${memberId} from ${currentRole} to ${newRole} in group ${groupId}`);
        
        return {
          member: updatedMember.rows[0],
          previousRole: currentRole,
          newRole: newRole,
          updatedBy: ownerId
        };
      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error(`Update member role error details:`, {
        groupId,
        memberId,
        ownerId,
        newRole,
        error: error.message
      });
      throw new Error(`Failed to update member role: ${error.message}`);
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

        // Ensure we have something to update (either group fields or tags)
        const hasGroupFieldUpdates = setClause.length > 0;
        const hasTagUpdates = updates.tags !== undefined;
        
        if (!hasGroupFieldUpdates && !hasTagUpdates) {
          throw new Error('No valid fields to update');
        }

        let updatedGroup;
        
        // Update group fields if any
        if (hasGroupFieldUpdates) {
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

          updatedGroup = result.rows[0];
        } else {
          // If only tags are being updated, get current group data
          const groupResult = await query(
            'SELECT id, name, description, theme_id, visibility, poster_url, created_at, owner_id FROM groups WHERE id = $1 AND owner_id = $2',
            [gID, ownerId]
          );
          
          if (groupResult.rows.length === 0) {
            throw new Error('Failed to update group details');
          }
          
          updatedGroup = groupResult.rows[0];
        }

        // Get owner name
        const ownerInfo = await query(
          'SELECT username FROM users WHERE id = $1',
          [ownerId]
        );

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

  /**
   * Get all group themes
   * @returns {Promise<Array>} Array of all group themes
   */
  static async getAllThemes() {
    try {
      const result = await query(
        'SELECT id, name, theme FROM group_themes ORDER BY name ASC'
      );

      console.log(`Retrieved ${result.rows.length} group themes`);
      return result.rows;
    } catch (error) {
      console.error(`Get all themes error:`, {
        error: error.message
      });
      throw new Error(`Failed to get group themes: ${error.message}`);
    }
  }

  /**
   * Get all groups that a user belongs to, ordered by role
   * @param {number} userId User ID
   * @returns {Promise<Array>} Array of groups ordered by user's role (owner, moderator, member)
   */
  static async getUserGroups(userId) {
    try {
      // Get groups where user is owner
      const ownerGroups = await query(
        `SELECT 
          g.id,
          g.name,
          g.description,
          g.visibility,
          g.poster_url,
          g.created_at,
          'owner' as user_role,
          (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.role != 'pending') as member_count
        FROM groups g
        WHERE g.owner_id = $1
        ORDER BY g.created_at DESC`,
        [userId]
      );

      // Get groups where user is moderator
      const moderatorGroups = await query(
        `SELECT 
          g.id,
          g.name,
          g.description,
          g.visibility,
          g.poster_url,
          g.created_at,
          gm.role as user_role,
          gm.joined_at,
          (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.role != 'pending') as member_count
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1 AND gm.role = 'moderator'
        ORDER BY gm.joined_at DESC`,
        [userId]
      );

      // Get groups where user is member
      const memberGroups = await query(
        `SELECT 
          g.id,
          g.name,
          g.description,
          g.visibility,
          g.poster_url,
          g.created_at,
          gm.role as user_role,
          gm.joined_at,
          (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id AND gm2.role != 'pending') as member_count
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1 AND gm.role = 'member'
        ORDER BY gm.joined_at DESC`,
        [userId]
      );

      // Combine all groups in the desired order
      const allGroups = [
        ...ownerGroups.rows,
        ...moderatorGroups.rows,
        ...memberGroups.rows
      ];

      console.log(`Retrieved ${allGroups.length} groups for user ${userId} (${ownerGroups.rows.length} owned, ${moderatorGroups.rows.length} moderated, ${memberGroups.rows.length} member)`);
      
      return {
        total: allGroups.length,
        owned: ownerGroups.rows.length,
        moderated: moderatorGroups.rows.length,
        member: memberGroups.rows.length,
        groups: allGroups
      };
    } catch (error) {
      console.error(`Get user groups error:`, {
        userId,
        error: error.message
      });
      throw new Error(`Failed to get user groups: ${error.message}`);
    }
  }

  /**
   * Get all pending join requests for a group
   * @param {number} groupId Group ID
   * @param {number} requesterId User ID making the request (for authorization)
   * @returns {Promise<Array>} Array of pending join requests
   */
  static async getAllPendingRequests(groupId, requesterId) {
    try {
      // Check if group exists
      const groupCheck = await query(
        'SELECT owner_id, name FROM groups WHERE id = $1',
        [groupId]
      );

      if (groupCheck.rows.length === 0) {
        throw new Error('Group not found');
      }

      const group = groupCheck.rows[0];

      // Check if requester has permission (owner or moderator)
      const requesterCheck = await query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, requesterId]
      );

      const isOwner = parseInt(group.owner_id) === parseInt(requesterId);
      const isModerator = requesterCheck.rows.length > 0 && requesterCheck.rows[0].role === 'moderator';

      if (!isOwner && !isModerator) {
        throw new Error('Only group owners and moderators can view pending requests');
      }

      // Get all pending requests for the group
      const result = await query(
        `SELECT 
          u.id,
          u.username,
          gm.joined_at as requested_at
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1 AND gm.role = 'pending'
        ORDER BY gm.joined_at ASC`,
        [groupId]
      );

      console.log(`Retrieved ${result.rows.length} pending requests for group ${groupId}`);
      
      return {
        group: {
          id: groupId,
          name: group.name
        },
        pendingRequests: result.rows,
        count: result.rows.length
      };
    } catch (error) {
      console.error(`Get pending requests error:`, {
        groupId,
        requesterId,
        error: error.message
      });
      throw new Error(`Failed to get pending requests: ${error.message}`);
    }
  }

  /**
   * Get popular groups sorted by member count
   * @param {number} limit Maximum number of groups to return
   * @returns {Promise<Array>} Array of groups sorted by member count (highest to lowest)
   */
  static async getPopularGroups(limit = 20) {
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
          (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.role != 'pending') AS member_count,
          COALESCE(array_agg(DISTINCT t.genre_id) FILTER (WHERE t.genre_id IS NOT NULL), '{}') AS genre_tags
        FROM groups g
        JOIN users u ON g.owner_id = u.id
        LEFT JOIN tags t ON g.id = t.group_id
        WHERE g.visibility IN ('public', 'private')
        GROUP BY g.id, u.username
        ORDER BY member_count DESC, g.created_at DESC
        LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get popular groups: ${error.message}`);
    }
  }
}

export default Group;
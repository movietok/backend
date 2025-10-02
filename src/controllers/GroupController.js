import Group from '../models/Group.js';

export const searchGroups = async (req, res) => {
  try {
    const { query, limit } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const groups = await Group.searchByName(query.trim(), parseInt(limit) || 10);

    res.json({
      success: true,
      groups
    });
  } catch (error) {
    console.error('Error searching groups:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


export const joinGroup = async (req, res) => {
  try {
    const { gID } = req.params;
    const userId = req.user.id; // Use the logged-in user's ID

    const member = await Group.joinGroup(gID, userId);

    res.status(201).json({
      success: true,
      message: 'Successfully joined the group',
      member
    });
  } catch (error) {
    console.error('Error joining group:', error);
    
    // Handle specific error cases
    if (error.message === 'Group not found') {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    if (error.message === 'You are already a member of this group' || 
        error.message === 'You are already the owner of this group') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('private group') || error.message.includes('closed group')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to join group'
    });
  }
};

export const requestToJoinGroup = async (req, res) => {
  try {
    const { gID } = req.params;
    const userId = req.user.id; // Use the logged-in user's ID

    const result = await Group.requestToJoin(gID, userId);

    res.status(201).json({
      success: true,
      message: 'Join request submitted successfully. Waiting for approval from group owner.',
      group: result.group,
      member: result.member
    });
  } catch (error) {
    console.error('Error requesting to join group:', error);
    
    // Handle specific error cases
    if (error.message === 'Group not found' || error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'You are already a member of this group' || 
        error.message === 'You are already the owner of this group' ||
        error.message === 'You already have a pending join request for this group') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process join request'
    });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, description, visibility, poster_url, tags } = req.body;
    const ownerId = req.user.id; // Assuming user info is set by auth middleware

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required'
      });
    }

    // Validate visibility if provided
    if (visibility && !['public', 'private', 'closed'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        error: 'Visibility must be public, private, or closed'
      });
    }

    // Validate and parse tags if provided
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags.map(tag => parseInt(tag)).filter(tag => !isNaN(tag) && tag > 0);
      } else if (typeof tags === 'string') {
        // Handle comma-separated string
        parsedTags = tags.split(',')
          .map(tag => parseInt(tag.trim()))
          .filter(tag => !isNaN(tag) && tag > 0);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Tags must be an array of numbers or comma-separated string'
        });
      }
    }

    const group = await Group.create({
      name,
      ownerId,
      description: description || '',
      visibility: visibility || 'public',
      poster_url: poster_url || null,
      tags: parsedTags
    });

    res.status(201).json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Error creating group:', error);
    if (error.message === 'A group with this name already exists') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const { gID } = req.params;
    const userId = req.user?.id || null; // Get user ID if authenticated, null if not

    const group = await Group.getById(gID, userId);

    res.json({
      success: true,
      group
    });
  } catch (error) {
    console.error('Error getting group details:', error);
    
    if (error.message === 'Group not found') {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    if (error.message === 'Authentication required to view this private group') {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to view this private group'
      });
    }
    
    if (error.message === 'You are not a member of this private group and cannot view its details') {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this private group and cannot view its details'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { gID } = req.params;
    const userId = req.user.id; // Assuming user info is set by auth middleware

    const deletionResult = await Group.delete(gID, userId);

    res.json({
      success: true,
      message: 'Group deleted successfully',
      details: {
        deletedTags: deletionResult.deletedTags,
        deletedMembers: deletionResult.deletedMembers
      }
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    
    // Handle specific error cases with appropriate status codes
    if (error.message === 'Group not found') {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    if (error.message === 'User is not the owner of this group') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this group'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while deleting the group'
    });
  }
};

export const getGroupsByGenres = async (req, res) => {
  try {
    const { genres, limit, matchType } = req.query;
    
    // Parse genres - can be comma-separated string, array, or empty
    let genreIds = [];
    
    if (genres) {
      if (typeof genres === 'string') {
        genreIds = genres.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      } else if (Array.isArray(genres)) {
        genreIds = genres.map(id => parseInt(id)).filter(id => !isNaN(id));
      } else {
        return res.status(400).json({
          success: false,
          error: 'Genres must be a comma-separated string or array of numbers'
        });
      }
    }

    // Validate matchType if provided
    const validMatchType = matchType && ['any', 'all'].includes(matchType) ? matchType : 'any';

    const groups = await Group.getByGenreTags(
      genreIds, 
      parseInt(limit) || 20, 
      validMatchType
    );

    res.json({
      success: true,
      matchType: validMatchType,
      genreIds,
      count: groups.length,
      groups
    });
  } catch (error) {
    console.error('Error getting groups by genres:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const removeMemberFromGroup = async (req, res) => {
  try {
    const { gID, userId } = req.params;
    const requestingUserId = req.user.id; // User performing the removal

    // Validate userId parameter
    const userIdToRemove = parseInt(userId);
    if (isNaN(userIdToRemove)) {
      return res.status(400).json({
        success: false,
        error: 'User ID must be a valid number'
      });
    }

    const result = await Group.removeMember(gID, userIdToRemove, requestingUserId);

    // Customize response message based on who performed the action
    let message;
    if (result.isSelfRemoval) {
      message = 'You have left the group successfully';
    } else if (result.isOwnerAction) {
      message = 'Member removed successfully by group owner';
    } else if (result.isModeratorAction) {
      message = 'Member removed successfully by group moderator';
    }

    res.json({
      success: true,
      message,
      removedUser: {
        id: result.removedUser.id,
        username: result.removedUser.username,
        role: result.removedUser.role
      },
      actionType: result.isSelfRemoval ? 'self_removal' : 
                  result.isOwnerAction ? 'owner_removal' : 'moderator_removal'
    });
  } catch (error) {
    console.error('Error removing member from group:', error);
    
    // Handle specific error cases
    if (error.message === 'Group not found') {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    if (error.message === 'User is not a member of this group') {
      return res.status(404).json({
        success: false,
        error: 'User is not a member of this group'
      });
    }
    
    if (error.message === 'You do not have permission to remove this member' ||
        error.message === 'Moderators cannot remove other moderators') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'Cannot remove the group owner') {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove the group owner'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to remove member'
    });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { gID, userId } = req.params;
    const ownerId = req.user.id; // Owner performing the role update
    const { role } = req.body;

    // Validate userId parameter
    const memberId = parseInt(userId);
    if (isNaN(memberId)) {
      return res.status(400).json({
        success: false,
        error: 'User ID must be a valid number'
      });
    }

    // Validate role
    if (!role || !['member', 'moderator'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be either "member" or "moderator"'
      });
    }

    const result = await Group.updateMemberRole(gID, memberId, ownerId, role);

    res.json({
      success: true,
      message: `Member role updated successfully from ${result.previousRole} to ${result.newRole}`,
      member: result.member,
      roleChange: {
        from: result.previousRole,
        to: result.newRole,
        updatedBy: result.updatedBy
      }
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    
    // Handle specific error cases
    if (error.message === 'Group not found') {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    if (error.message === 'User is not a member of this group') {
      return res.status(404).json({
        success: false,
        error: 'User is not a member of this group'
      });
    }
    
    if (error.message === 'Only the group owner can update member roles') {
      return res.status(403).json({
        success: false,
        error: 'Only the group owner can update member roles'
      });
    }
    
    if (error.message === 'Cannot change the role of the group owner') {
      return res.status(400).json({
        success: false,
        error: 'Cannot change the role of the group owner'
      });
    }
    
    if (error.message.includes('User is already a')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message === 'Invalid role. Must be "member" or "moderator"') {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be "member" or "moderator"'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update member role'
    });
  }
};

export const updateGroupDetails = async (req, res) => {
  try {
    const { gID } = req.params;
    const ownerId = req.user.id; // Owner ID from authentication
    const updates = req.body;

    // Validate that at least one field is provided
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update'
      });
    }

    // Validate individual fields if provided
    if (updates.name !== undefined && (!updates.name || updates.name.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Group name cannot be empty'
      });
    }

    if (updates.visibility && !['public', 'private', 'closed'].includes(updates.visibility)) {
      return res.status(400).json({
        success: false,
        error: 'Visibility must be public, private, or closed'
      });
    }

    // Validate and parse tags if provided
    if (updates.tags !== undefined) {
      if (Array.isArray(updates.tags)) {
        updates.tags = updates.tags.map(tag => parseInt(tag)).filter(tag => !isNaN(tag) && tag > 0);
      } else if (typeof updates.tags === 'string') {
        // Handle comma-separated string
        updates.tags = updates.tags.split(',')
          .map(tag => parseInt(tag.trim()))
          .filter(tag => !isNaN(tag) && tag > 0);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Tags must be an array of numbers or comma-separated string'
        });
      }
    }

    if (updates.theme_id !== undefined && updates.theme_id !== null) {
      const themeId = parseInt(updates.theme_id);
      if (isNaN(themeId)) {
        return res.status(400).json({
          success: false,
          error: 'Theme ID must be a valid number or null'
        });
      }
      updates.theme_id = themeId;
    }

    const updatedGroup = await Group.updateDetails(gID, ownerId, updates);

    res.json({
      success: true,
      message: 'Group details updated successfully',
      group: updatedGroup,
      updatedFields: Object.keys(updates)
    });
  } catch (error) {
    console.error('Error updating group details:', error);
    
    // Handle specific error cases
    if (error.message === 'Group not found') {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    if (error.message === 'Only the group owner can update group details') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this group'
      });
    }
    
    if (error.message === 'A group with this name already exists') {
      return res.status(400).json({
        success: false,
        error: 'A group with this name already exists'
      });
    }
    
    if (error.message.includes('Invalid fields:') || 
        error.message.includes('Invalid visibility') ||
        error.message.includes('Theme ID must be')) {
      return res.status(400).json({
        success: false,
        error: error.message.replace('Failed to update group details: ', '')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update group details'
    });
  }
};
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

export const createGroup = async (req, res) => {
  try {
    const { name, description, visibility } = req.body;
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

    const group = await Group.create({
      name,
      ownerId,
      description: description || '',
      visibility: visibility || 'public'
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

    const group = await Group.getById(gID);
    
    // Check if user has access based on visibility
    if (group.visibility !== 'public' && (!req.user || (req.user.id !== group.owner_id))) {
      return res.status(403).json({
        success: false,
        error: group.visibility === 'private' ? 
          'This is a private group. Only the owner can view it.' :
          'This is a closed group. Contact support for access.'
      });
    }

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
    
    // Validate genres parameter
    if (!genres) {
      return res.status(400).json({
        success: false,
        error: 'Genres parameter is required'
      });
    }

    // Parse genres - can be comma-separated string or array
    let genreIds;
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

    if (genreIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one valid genre ID is required'
      });
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

export const addMemberToGroup = async (req, res) => {
  try {
    const { gID } = req.params;
    const { userId, role } = req.body;
    const ownerId = req.user.id; // Owner ID from authentication

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate userId is a number
    const userIdToAdd = parseInt(userId);
    if (isNaN(userIdToAdd)) {
      return res.status(400).json({
        success: false,
        error: 'User ID must be a valid number'
      });
    }

    // Validate role if provided
    if (role && !['member', 'moderator'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be "member" or "moderator"'
      });
    }

    const member = await Group.addMember(gID, userIdToAdd, ownerId, role || 'member');

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      member
    });
  } catch (error) {
    console.error('Error adding member to group:', error);
    
    // Handle specific error cases
    if (error.message === 'Group not found') {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    if (error.message === 'User to add not found') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (error.message === 'Only the group owner can add members') {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to add members to this group'
      });
    }
    
    if (error.message === 'User is already a member of this group' ||
        error.message === 'Cannot add the group owner as a member') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to add member'
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
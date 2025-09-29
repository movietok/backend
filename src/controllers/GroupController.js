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

    await Group.delete(gID, userId);

    res.json({
      success: true,
      message: 'Group deleted successfully'
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
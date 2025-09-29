import Group from '../models/Group.js';

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
    if (error.message.includes('not found') || error.message.includes('not the owner')) {
      return res.status(404).json({
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
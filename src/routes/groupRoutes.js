import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createGroup,
  getGroupDetails,
  deleteGroup,
  searchGroups,
  joinGroup,
  getGroupsByGenres,
  addMemberToGroup,
  removeMemberFromGroup
} from '../controllers/GroupController.js';

const router = express.Router();

// All group routes require authentication
router.use(authenticateToken);

// Search groups
router.get('/search', searchGroups);

// Get groups by genre tags
router.get('/by-genres', getGroupsByGenres);

// Create a new group
router.post('/', createGroup);

// Get group details
router.get('/:gID', getGroupDetails);

// Join group
router.post('/:gID/join', joinGroup);

// Add member to group (owner only)
router.post('/:gID/members', addMemberToGroup);

// Remove member from group (owner, moderator, or self)
router.delete('/:gID/members/:userId', removeMemberFromGroup);

// Delete a group
router.delete('/:gID', deleteGroup);

export default router;
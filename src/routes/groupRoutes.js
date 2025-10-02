import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createGroup,
  getGroupDetails,
  deleteGroup,
  searchGroups,
  joinGroup,
  requestToJoinGroup,
  getGroupsByGenres,
  removeMemberFromGroup,
  updateMemberRole,
  updateGroupDetails
} from '../controllers/GroupController.js';

const router = express.Router();

// Public routes (no authentication required)
// Search groups
router.get('/search', searchGroups);

// Get groups by genre tags
router.get('/by-genres', getGroupsByGenres);

// Protected routes (authentication required)
router.use(authenticateToken);

// Create a new group
router.post('/', createGroup);

// Get group details
router.get('/:gID', getGroupDetails);

// Update group details (owner only)
router.put('/:gID', updateGroupDetails);

// Join group
router.post('/:gID/join', joinGroup);

// Request to join group (creates pending membership)
router.post('/:gID/request-join', requestToJoinGroup);

// Remove member from group (owner, moderator, or self)
router.delete('/:gID/members/:userId', removeMemberFromGroup);

// Update member role (owner only)
router.put('/:gID/members/:userId/role', updateMemberRole);

// Delete a group
router.delete('/:gID', deleteGroup);

export default router;
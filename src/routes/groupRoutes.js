import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createGroup,
  getGroupDetails,
  deleteGroup,
  searchGroups,
  joinGroup,
  requestToJoinGroup,
  approvePendingMember,
  leaveFromGroup,
  getGroupsByGenres,
  getAllGroupThemes,
  getUserGroups,
  getAllPendingRequests,
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

// Get all group themes
router.get('/themes', getAllGroupThemes);

// Protected routes (authentication required)
router.use(authenticateToken);

// Get user's groups by user ID (ordered by role: owner, moderator, member)
router.get('/user/:userId/groups', getUserGroups);

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

// Approve pending join request (owner or moderator only)
router.put('/:gID/members/:userId/approve', approvePendingMember);

// Get all pending join requests for a group (owner or moderator only)
router.get('/:gID/pending-requests', getAllPendingRequests);

// Leave group (user removes themselves)
router.post('/:gID/leave', leaveFromGroup);

// Remove member from group (owner or moderator only)
router.delete('/:gID/members/:userId', removeMemberFromGroup);

// Update member role (owner only)
router.put('/:gID/members/:userId/role', updateMemberRole);

// Delete a group
router.delete('/:gID', deleteGroup);

export default router;
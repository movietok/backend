import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createGroup,
  getGroupDetails,
  deleteGroup,
  searchGroups,
  getGroupMembers,
  joinGroup
} from '../controllers/GroupController.js';

const router = express.Router();

// All group routes require authentication
router.use(authenticateToken);

// Search groups
router.get('/search', searchGroups);

// Create a new group
router.post('/', createGroup);

// Get group details
router.get('/:gID', getGroupDetails);

// Get group members
router.get('/:gID/members', getGroupMembers);

// Join group
router.post('/:gID/join', joinGroup);

// Delete a group
router.delete('/:gID', deleteGroup);

export default router;
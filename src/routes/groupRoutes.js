import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createGroup,
  getGroupDetails,
  deleteGroup
} from '../controllers/GroupController.js';

const router = express.Router();

// All group routes require authentication
router.use(authenticateToken);

// Create a new group
router.post('/', createGroup);

// Get group details
router.get('/:gId', getGroupDetails);

// Delete a group
router.delete('/:gId', deleteGroup);

export default router;
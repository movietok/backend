import express from 'express';
import userRoutes from './userRoutes.js';
import reviewRoutes from './reviewRoutes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API versioning
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/reviews', reviewRoutes);

// Legacy routes (backward compatibility)
router.use('/api/users', userRoutes);
router.use('/api/reviews', reviewRoutes);

export default router;

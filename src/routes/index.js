import express from 'express';
import userRoutes from './userRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import finnkinoRoutes from './finnkinoRoutes.js';
import tmdbRoutes from './tmdbRoutes.js';

const router = express.Router();

// Health check endpoint - siirretty /api/health reitille
router.get('/api/health', async (req, res) => {
  try {
    const { testConnection } = await import('../config/database.js');
    const dbConnected = await testConnection();
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        limit: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      database: {
        connected: dbConnected,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432
      },
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version
    };

    res.json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      error: error.message
    });
  }
});

// API versioning
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/reviews', reviewRoutes);
router.use('/api/v1/tmdb', tmdbRoutes);
router.use('/api/v1/finnkino', finnkinoRoutes);

// Legacy routes (backward compatibility)
router.use('/api/users', userRoutes);
router.use('/api/reviews', reviewRoutes);
router.use('/api/tmdb', tmdbRoutes);
router.use('/api/finnkino', finnkinoRoutes);

export default router;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './src/routes/index.js';
import { testConnection, createDatabaseIfNotExists } from './src/config/database.js';
import { errorHandler, notFound } from './src/middleware/auth.js';
import config from './src/config/config.js';

// Load environment variables
dotenv.config();

const app = express();

// Validate configuration
try {
  config.validateConfig();
  config.printConfig();
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}

const serverConfig = config.getServerConfig();
const loggingConfig = config.getLoggingConfig();

// Middleware
app.use(cors(serverConfig.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (only in development)
if (loggingConfig.requests) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`🌐 ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Initialize database
const initializeDatabase = async () => {
  try {
    // Create database if it doesn't exist (only in development)
    if (config.environment === 'development') {
      await createDatabaseIfNotExists();
    }
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (config.environment === 'production') {
      process.exit(1);
    }
  }
};

// Initialize database
await initializeDatabase();

// Routes
app.use('/', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(serverConfig.port, () => {
  console.log(`🚀 Server running on port ${serverConfig.port}`);
  console.log(`🌍 Environment: ${config.environment}`);
  console.log(`📊 CORS origins: ${Array.isArray(serverConfig.cors.origin) ? serverConfig.cors.origin.join(', ') : serverConfig.cors.origin}`);
  
  if (config.environment === 'development') {
    console.log(`🔗 Health check: http://localhost:${serverConfig.port}/api/health`);
    console.log(`📚 API docs: http://localhost:${serverConfig.port}/api/users`);
  }
});

export default app;

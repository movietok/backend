import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class Config {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  // Get environment-specific database configuration
  getDatabaseConfig() {
    const env = this.environment.toUpperCase();
    
    const config = {
      user: process.env[`${env}_DB_USER`] || process.env.DB_USER || 'postgres',
      host: process.env[`${env}_DB_HOST`] || process.env.DB_HOST || 'localhost',
      database: process.env[`${env}_DB_NAME`] || process.env.DB_NAME || 'moviedb',
      password: process.env[`${env}_DB_PASSWORD`] || process.env.DB_PASSWORD || 'password',
      port: process.env[`${env}_DB_PORT`] || process.env.DB_PORT || 5432,
      
      // PostgreSQL connection pool settings
      max: this.environment === 'production' ? 20 : 10, // Maximum number of connections
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
    };

    // Add SSL configuration for production
    if (this.environment === 'production') {
      config.ssl = {
        rejectUnauthorized: false // Set to true in production with proper certificates
      };
    }

    return config;
  }

  // Get environment-specific JWT secret
  getJwtSecret() {
    const env = this.environment.toUpperCase();
    const secret = process.env[`${env}_JWT_SECRET`] || process.env.JWT_SECRET || 'fallback_secret';
    
    if (this.environment === 'production' && secret === 'fallback_secret') {
      console.warn('⚠️  WARNING: Using fallback JWT secret in production! This is not secure!');
    }
    
    return secret;
  }

  // Get server configuration
  getServerConfig() {
    return {
      port: process.env.PORT || 3000,
      environment: this.environment,
      cors: {
        origin: this.getCorsOrigins(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }
    };
  }

  // Get CORS origins based on environment
  getCorsOrigins() {
    switch (this.environment) {
      case 'production':
        return process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://yourdomain.com'];
      case 'development':
        return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'];
      case 'test':
        return ['http://localhost:3000'];
      default:
        return '*';
    }
  }

  // Get logging configuration
  getLoggingConfig() {
    return {
      level: this.environment === 'production' ? 'info' : 'debug',
      sql: this.environment === 'development', // Log SQL queries only in development
      errors: true, // Always log errors
      requests: this.environment !== 'test' // Don't log requests during testing
    };
  }

  // Get security configuration
  getSecurityConfig() {
    return {
      bcryptRounds: this.environment === 'production' ? 12 : 10,
      jwtExpiresIn: this.environment === 'production' ? '1h' : '24h',
      rateLimiting: {
        enabled: this.environment === 'production',
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: this.environment === 'production' ? 100 : 1000 // Max requests per window
      }
    };
  }

  // Validate required environment variables
  validateConfig() {
    const required = [];
    const env = this.environment.toUpperCase();

    // Check database configuration
    if (!process.env[`${env}_DB_HOST`] && !process.env.DB_HOST) {
      required.push(`${env}_DB_HOST or DB_HOST`);
    }
    if (!process.env[`${env}_DB_NAME`] && !process.env.DB_NAME) {
      required.push(`${env}_DB_NAME or DB_NAME`);
    }
    if (!process.env[`${env}_DB_USER`] && !process.env.DB_USER) {
      required.push(`${env}_DB_USER or DB_USER`);
    }
    if (!process.env[`${env}_DB_PASSWORD`] && !process.env.DB_PASSWORD) {
      required.push(`${env}_DB_PASSWORD or DB_PASSWORD`);
    }

    // Check JWT secret
    if (!process.env[`${env}_JWT_SECRET`] && !process.env.JWT_SECRET) {
      required.push(`${env}_JWT_SECRET or JWT_SECRET`);
    }

    if (required.length > 0) {
      throw new Error(`Missing required environment variables: ${required.join(', ')}`);
    }

    // Warn about insecure configurations in production
    if (this.environment === 'production') {
      this.validateProductionConfig();
    }

    return true;
  }

  // Validate production-specific configuration
  validateProductionConfig() {
    const warnings = [];
    
    const dbConfig = this.getDatabaseConfig();
    if (dbConfig.password === 'password' || dbConfig.password === 'secure_production_password') {
      warnings.push('Using default database password in production');
    }
    
    const jwtSecret = this.getJwtSecret();
    if (jwtSecret.includes('change_this') || jwtSecret === 'fallback_secret') {
      warnings.push('Using default JWT secret in production');
    }

    if (warnings.length > 0) {
      console.warn('⚠️  PRODUCTION SECURITY WARNINGS:');
      warnings.forEach(warning => console.warn(`   - ${warning}`));
      console.warn('   Please update your environment variables for security!');
    }
  }

  // Get all configuration
  getAll() {
    return {
      environment: this.environment,
      database: this.getDatabaseConfig(),
      server: this.getServerConfig(),
      jwt: {
        secret: this.getJwtSecret(),
        expiresIn: this.getSecurityConfig().jwtExpiresIn
      },
      security: this.getSecurityConfig(),
      logging: this.getLoggingConfig()
    };
  }

  // Pretty print configuration (without sensitive data)
  printConfig() {
    const config = this.getAll();
    const safeConfig = {
      ...config,
      database: {
        ...config.database,
        password: config.database.password ? '***HIDDEN***' : 'NOT SET'
      },
      jwt: {
        ...config.jwt,
        secret: config.jwt.secret ? '***HIDDEN***' : 'NOT SET'
      }
    };

    console.log('📋 Application Configuration:');
    console.log('Environment:', safeConfig.environment);
    console.log('Database:', {
      host: safeConfig.database.host,
      port: safeConfig.database.port,
      database: safeConfig.database.database,
      user: safeConfig.database.user,
      password: safeConfig.database.password
    });
    console.log('Server Port:', safeConfig.server.port);
    console.log('JWT Secret:', safeConfig.jwt.secret);
    console.log('Security Level:', safeConfig.environment === 'production' ? 'HIGH' : 'DEVELOPMENT');
  }
}

// Create singleton instance
const config = new Config();

export default config;

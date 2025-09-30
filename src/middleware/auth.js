import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/config.js';

const jwtConfig = config.getAll().jwt;
const loggingConfig = config.getLoggingConfig();

// Middleware JWT-tokenin tarkistamiseen
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token' 
      });
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Tarkista että käyttäjä on edelleen olemassa tietokannassa
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'The user associated with this token no longer exists' 
      });
    }

    req.user = user.toPublicObject();
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.' 
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid' 
      });
    } else {
      if (loggingConfig.errors) {
        console.error('Authentication error:', error);
      }
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'An error occurred during authentication' 
      });
    }
  }
};

// Optional authentication middleware - allows both authenticated and non-authenticated requests
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided - continue without user
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      
      // Check if user still exists in database
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user.toPublicObject();
      } else {
        req.user = null;
      }
    } catch (tokenError) {
      // Invalid or expired token - continue without user
      req.user = null;
    }

    next();
  } catch (error) {
    if (loggingConfig.errors) {
      console.error('Optional authentication error:', error);
    }
    // On error, continue without user
    req.user = null;
    next();
  }
};

// Middleware pyynnön validointiin
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }
    next();
  };
};

// Middleware virheenkäsittelyyn
export const errorHandler = (err, req, res, next) => {
  if (loggingConfig.errors) {
    console.error('Error:', err);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.environment === 'development' && { stack: err.stack })
  });
};

// Middleware 404-virheiden käsittelyyn
export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
};

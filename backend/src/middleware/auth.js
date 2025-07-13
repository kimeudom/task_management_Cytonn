/**
 * JWT Authentication Middleware
 * Handles token verification, user authentication, and role-based access control
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import RefreshToken from '../models/RefreshToken.js';
import { TOKEN_TYPES } from '../constants/enums.js';

/**
 * Add token to blacklist
 */
export const blacklistToken = async (token, userId, reason = 'logout') => {
  return await TokenBlacklist.addToken(token, userId, reason);
};

/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (token) => {
  return await TokenBlacklist.isTokenBlacklisted(token);
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'task-management-api',
    audience: 'task-management-frontend'
  });
};

/**
 * Generate persistent refresh token
 */
export const generateRefreshToken = async (user, deviceInfo = null) => {
  try {
    const { jti } = await RefreshToken.create(user.id, deviceInfo);

    const payload = {
      jti,
      id: user.id,
      email: user.email,
      type: 'refresh'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'task-management-api',
      audience: 'task-management-frontend'
    });

    return token;
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'task-management-api',
    audience: 'task-management-frontend'
  });
};

/**
 * Verify refresh token (both JWT and database)
 */
export const verifyRefreshToken = async (token) => {
  try {
    // First verify JWT signature and structure
    const decoded = verifyToken(token);

    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Verify token exists in database using JTI
    const refreshTokenRecord = await RefreshToken.verify(decoded.jti);
    if (!refreshTokenRecord) {
      throw new Error('Refresh token not found or expired');
    }

    // Update last used timestamp
    await refreshTokenRecord.updateLastUsed();

    return {
      decoded,
      record: refreshTokenRecord
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Extract token from request headers
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
};

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Token has been invalidated',
        code: 'TOKEN_BLACKLISTED'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Ensure it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Get fresh user data from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user data from database
    const user = await User.findById(decoded.id);
    
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Admin-only authorization
 */
export const requireAdmin = authorize('admin');

/**
 * Manager or Admin authorization
 */
export const requireManagerOrAdmin = authorize('manager', 'admin');

/**
 * Any authenticated user authorization
 */
export const requireAuth = authenticate;

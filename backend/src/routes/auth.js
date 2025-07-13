/**
 * Authentication routes
 * Handles user login, logout, token refresh, and registration
 */
import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  blacklistToken,
  authenticate,
  optionalAuth
} from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  middleName: Joi.string().max(100).allow(''),
  lastName: Joi.string().min(2).max(50).required(),
  roleId: Joi.number().integer().valid(1, 2, 3).default(2) // Default to User role
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

/**
 * POST /api/auth/login - Authenticate user and return tokens
 */
router.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // Return success response with tokens and user info
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/register - Create a new user account
 */
router.post('/register', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }

    // Create new user
    const user = await User.create(value);

    // Generate tokens for immediate login
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'User with this email or username already exists',
        code: 'USER_EXISTS'
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/refresh - Refresh authentication token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }

    const { refreshToken } = value;

    // Verify refresh token (both JWT and database)
    const { decoded } = await verifyRefreshToken(refreshToken);

    // Get fresh user data
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    next(error);
  }
});

/**
 * POST /api/auth/logout - Invalidate user session
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Add current token to blacklist
    await blacklistToken(req.token, req.user.id, 'logout');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me - Get current user information
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify - Verify token validity
 */
router.post('/verify', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user data
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: user.toJSON(),
        tokenInfo: {
          id: decoded.id,
          email: decoded.email,
          roleId: decoded.roleId,
          roleName: decoded.roleName,
          iat: decoded.iat,
          exp: decoded.exp
        }
      }
    });
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
});

export default router;

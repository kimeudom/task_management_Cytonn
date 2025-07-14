/**
 * Authentication routes
 * Handles user login, logout, token refresh, and registration
 */
import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import EmailVerificationToken from '../models/EmailVerificationToken.js';
import emailService from '../services/emailService.js';
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

const emailVerificationSchema = Joi.object({
  token: Joi.string().required()
});

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required()
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

    // Check if user email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Email verification required. Please verify your email address before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        data: {
          email: user.email
        }
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

    // Create new user (unverified by default)
    const user = await User.create({ ...value, isVerified: false });

    // Generate verification token
    const verificationToken = emailService.generateVerificationToken();
    await EmailVerificationToken.create(user.id, verificationToken);

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationToken
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: user.toJSON(),
        emailSent: emailResult.success
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

/**
 * POST /api/auth/verify-email - Verify user email with token
 */
router.post('/verify-email', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = emailVerificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }

    const { token } = value;

    // Find the verification token
    const verificationToken = await EmailVerificationToken.findByToken(token);
    if (!verificationToken) {
      return res.status(400).json({
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token is valid
    if (!verificationToken.isValid()) {
      return res.status(400).json({
        error: verificationToken.isExpired() ? 'Verification token has expired' : 'Verification token has already been used',
        code: verificationToken.isExpired() ? 'TOKEN_EXPIRED' : 'TOKEN_USED'
      });
    }

    // Verify the user
    const user = await User.verifyEmail(verificationToken.userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Mark token as used
    await EmailVerificationToken.markAsUsed(token);

    // Clean up all verification tokens for this user
    await EmailVerificationToken.deleteByUserId(user.id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/resend-verification - Resend verification email
 */
router.post('/resend-verification', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = resendVerificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }

    const { email } = value;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        error: 'Email is already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Delete existing verification tokens for this user
    await EmailVerificationToken.deleteByUserId(user.id);

    // Generate new verification token
    const verificationToken = emailService.generateVerificationToken();
    await EmailVerificationToken.create(user.id, verificationToken);

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationToken
    );

    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Failed to send verification email',
        code: 'EMAIL_SEND_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        emailSent: true
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

/**
 * User management routes
 * Handles all API endpoints related to user management
 * Creating, retrieving, updating and deleting users
 */
import express from 'express';
import Joi from 'joi';
import User from '../models/User.js';
import { authenticate, requireAdmin, allowSelfOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  middleName: Joi.string().max(100).allow(''),
  lastName: Joi.string().min(2).max(50).required(),
  roleId: Joi.number().integer().valid(1, 2, 3).default(3) // 1=Admin, 2=Manager, 3=User
});

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(50),
  email: Joi.string().email(),
  firstName: Joi.string().min(2).max(50),
  middleName: Joi.string().max(100).allow(''),
  lastName: Joi.string().min(2).max(50),
  roleId: Joi.number().integer().valid(1, 2, 3),
  status: Joi.string().valid('active', 'suspended', 'deleted')
}).min(1);

const changePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match'
    })
});

// GET /api/users/check-username - Check if username is available
router.get('/check-username', authenticate, async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        error: 'Username parameter is required'
      });
    }

    // Validate username format
    const usernameSchema = Joi.string().min(3).max(50);
    const { error } = usernameSchema.validate(username);
    if (error) {
      return res.status(400).json({
        error: 'Invalid username format',
        details: error.details.map(d => d.message)
      });
    }

    // Check if username exists
    const existingUser = await User.findByUsername(username);
    const isAvailable = !existingUser;

    res.json({
      success: true,
      data: {
        username,
        available: isAvailable
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users - Retrieve all users in the system
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100'
      });
    }

    const result = await User.findAll(page, limit, role);

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create a new user with the provided details
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const user = await User.create(value);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.toJSON()
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }
    next(error);
  }
});

// GET /api/users/:id - Retrieve a user by their ID
router.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id - Update a user's details
router.patch('/:id', authenticate, allowSelfOrAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Allow either { email, password } or the usual updateUserSchema
    const { email, password, ...otherFields } = req.body;
    let updatedUser = null;

    if (email && password && Object.keys(otherFields).length === 0) {
      // Update both email and password
      const user = await User.getById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (email) {
        await User.update(userId, { email });
      }
      if (password) {
        await user.updatePassword(password);
      }
      updatedUser = await User.getById(userId);
    } else if (password && Object.keys(otherFields).length === 0) {
      // Only password
      const user = await User.getById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await user.updatePassword(password);
      updatedUser = await User.getById(userId);
    } else if (email && Object.keys(otherFields).length === 0) {
      // Only email
      await User.update(userId, { email });
      updatedUser = await User.getById(userId);
    } else {
      // Validate request body for other fields
      const { error, value } = updateUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }
      updatedUser = await User.update(userId, value);
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      // Check which field caused the constraint violation
      const errorMessage = error.detail || error.message || '';
      if (errorMessage.includes('username')) {
        return res.status(409).json({
          error: 'Username already exists',
          code: 'USERNAME_EXISTS'
        });
      } else if (errorMessage.includes('email')) {
        return res.status(409).json({
          error: 'Email already exists',
          code: 'EMAIL_EXISTS'
        });
      } else {
        return res.status(409).json({
          error: 'Username or email already exists',
          code: 'DUPLICATE_FIELD'
        });
      }
    }
    next(error);
  }
});

// PATCH /api/users/:id/password - Change user password
router.patch('/:id/password', authenticate, allowSelfOrAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Validate request body
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Password validation failed',
        details: error.details.map(d => d.message),
        code: 'VALIDATION_ERROR'
      });
    }

    const { newPassword } = value;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    const success = await user.updatePassword(newPassword);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    next(error);
  }
});

// DELETE /api/users/:id - Delete a user by their ID
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const deleted = await User.delete(userId);

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

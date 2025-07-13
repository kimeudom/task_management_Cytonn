/**
 * Task management routes
 * Handles all API endpoints related to task management
 * CRUD operations for tasks with role-based access control
 */
import express from 'express';
import Joi from 'joi';
import Task from '../models/Task.js';
import { authenticate, requireManagerOrAdmin, requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000),
  priority: Joi.number().integer().min(1).max(5).default(1),
  deadline: Joi.date().iso().min('now'),
  assignedUsers: Joi.array().items(Joi.number().integer().positive()).default([])
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255),
  description: Joi.string().max(2000),
  status: Joi.string().valid('pending', 'inprogress', 'completed', 'archived'),
  priority: Joi.number().integer().min(1).max(5),
  deadline: Joi.date().iso(),
  assignedUsers: Joi.array().items(Joi.number().integer().positive())
}).min(1);

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'inprogress', 'completed', 'archived').required()
});

// Helper function to check if user can access task
const canAccessTask = (user, task) => {
  if (user.role === 'admin') return true;
  if (user.role === 'manager') return true;
  if (user.role === 'user') {
    // Check if user is in the assignedUsers array
    return task.assignedUsers && task.assignedUsers.some(assignedUser => assignedUser.id === user.id);
  }
  return false;
};

// GET /api/tasks - Retrieve all tasks based on user permissions
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-100'
      });
    }

    // Build filters
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    if (req.query.assignedTo) filters.assignedTo = parseInt(req.query.assignedTo);
    if (req.query.createdBy) filters.createdBy = parseInt(req.query.createdBy);

    const result = await Task.findByUserRole(req.user.id, req.user.role, page, limit, filters);

    res.json({
      success: true,
      data: result.tasks,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - Create a new task in the system
router.post('/', authenticate, requireManagerOrAdmin, async (req, res, next) => {
  try {

    // Validate request body
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    // Verify assigned users exist if provided
    if (value.assignedUsers && value.assignedUsers.length > 0) {
      for (const userId of value.assignedUsers) {
        const assignedUser = await User.findById(userId);
        if (!assignedUser) {
          return res.status(400).json({ error: `Assigned user with ID ${userId} does not exist` });
        }
      }
    }

    // Set creator
    value.createdBy = req.user.id;

    const task = await Task.create(value);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id - Retrieve a task by its ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions using centralized function
    if (!canAccessTask(req.user, task)) {
      return res.status(403).json({
        error: 'You do not have permission to view this task'
      });
    }

    res.json({
      success: true,
      data: task.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id - Update a task's details
router.patch('/:id', authenticate, requireManagerOrAdmin, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Validate request body
    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    // Verify assigned users exist if provided
    if (value.assignedUsers && value.assignedUsers.length > 0) {
      for (const userId of value.assignedUsers) {
        const assignedUser = await User.findById(userId);
        if (!assignedUser) {
          return res.status(400).json({ error: `Assigned user with ID ${userId} does not exist` });
        }
      }
    }

    const task = await Task.update(taskId, value, req.user.id, req.user.role);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task.toJSON()
    });
  } catch (error) {
    if (error.message.includes('Insufficient permissions')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

// DELETE /api/tasks/:id - Delete a task by its ID
router.delete('/:id', authenticate, requireManagerOrAdmin, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const deleted = await Task.delete(taskId, req.user.id, req.user.role);

    if (!deleted) {
      return res.status(404).json({ error: 'Task not found or insufficient permissions' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('Insufficient permissions')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

// PATCH /api/tasks/:id/status - Update task status
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Validate request body
    const { error, value } = statusUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const task = await Task.updateStatus(taskId, value.status, req.user.id, req.user.role);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: task.toJSON()
    });
  } catch (error) {
    if (error.message.includes('Insufficient permissions') ||
        error.message.includes('can only update status')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

// POST /api/tasks/:id/assign - Assign task to a user
router.post('/:id/assign', authenticate, requireManagerOrAdmin, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    const { userId } = req.body;

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }

    // Only managers and admins can assign tasks
    if (req.user.role === 'user') {
      return res.status(403).json({
        error: 'Insufficient permissions. Only managers and admins can assign tasks.'
      });
    }

    // Verify assigned user exists
    const assignedUser = await User.findById(parseInt(userId));
    if (!assignedUser) {
      return res.status(400).json({ error: 'User to assign does not exist' });
    }

    const task = await Task.update(taskId, { assignedUsers: [parseInt(userId)] }, req.user.id, req.user.role);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task assigned successfully',
      data: task.toJSON()
    });
  } catch (error) {
    if (error.message.includes('Insufficient permissions')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

// DELETE /api/tasks/:id/assign - Unassign task
router.delete('/:id/assign', authenticate, requireManagerOrAdmin, async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Only managers and admins can unassign tasks
    if (req.user.role === 'user') {
      return res.status(403).json({
        error: 'Insufficient permissions. Only managers and admins can unassign tasks.'
      });
    }

    const task = await Task.update(taskId, { assignedUsers: [] }, req.user.id, req.user.role);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      message: 'Task unassigned successfully',
      data: task.toJSON()
    });
  } catch (error) {
    if (error.message.includes('Insufficient permissions')) {
      return res.status(403).json({ error: error.message });
    }
    next(error);
  }
});

export default router;

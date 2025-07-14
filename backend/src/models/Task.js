/**
 * Task Model
 * Handles all database operations related to tasks
 * Supports task creation, assignment, status updates, and role-based access
 */

import pool from '../config/database.js';
import taskNotificationService from '../services/taskNotificationService.js';
import User from './User.js';

class Task {
  constructor(taskData) {
    this.id = taskData.task_id || taskData.id;
    this.title = taskData.title;
    this.description = taskData.description;
    this.status = taskData.status;
    this.priority = taskData.priority;
    this.deadline = taskData.deadline;
    this.createdBy = taskData.created_by || taskData.createdBy;
    this.createdAt = taskData.created_at || taskData.createdAt;
    this.updatedAt = taskData.updated_at || taskData.updatedAt;
    // For assigned users (from join)
    this.assignedUsers = taskData.assignedUsers || [];
  }

  // Create a new task
  static async create(taskData) {
    const { title, description, priority = 1, deadline, createdBy, assignedUsers = [] } = taskData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert task
      const taskQuery = `
        INSERT INTO tasks (title, description, status, priority, deadline, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING task_id, title, description, status, priority, deadline, created_by, created_at, updated_at
      `;

      const taskValues = [title, description, 'pending', priority, deadline, createdBy];
      const taskResult = await client.query(taskQuery, taskValues);
      const task = new Task(taskResult.rows[0]);

      // Assign users if provided
      if (assignedUsers.length > 0) {
        const assignQuery = `
          INSERT INTO task_assigned_users (task_id, user_id)
          VALUES ($1, $2)
        `;

        for (const userId of assignedUsers) {
          await client.query(assignQuery, [task.id, userId]);
        }

        task.assignedUsers = assignedUsers;
      }

      await client.query('COMMIT');

      // Send email notifications for task assignment (async, don't block response)
      if (assignedUsers.length > 0) {
        setImmediate(async () => {
          try {
            const createdByUser = await User.findById(createdBy);
            if (createdByUser) {
              await taskNotificationService.notifyTaskAssignment(task, assignedUsers, createdByUser);
            }
          } catch (emailError) {
            console.error('Failed to send task assignment emails:', emailError);
          }
        });
      }

      return task;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Find task by ID
  static async findById(id) {
    const taskQuery = `
      SELECT t.*,
             creator.first_name as creator_first_name, creator.last_name as creator_last_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.user_id
      WHERE t.task_id = $1
    `;

    const assignedQuery = `
      SELECT u.user_id, u.username, u.first_name, u.last_name
      FROM task_assigned_users tau
      JOIN users u ON tau.user_id = u.user_id
      WHERE tau.task_id = $1 AND u.status = 'active'
    `;

    try {
      const taskResult = await pool.query(taskQuery, [id]);
      if (taskResult.rows.length === 0) return null;

      const taskData = taskResult.rows[0];
      const task = new Task(taskData);

      // Add creator info
      task.creator = taskData.creator_first_name ? {
        firstName: taskData.creator_first_name,
        lastName: taskData.creator_last_name
      } : null;

      // Get assigned users
      const assignedResult = await pool.query(assignedQuery, [id]);
      task.assignedUsers = assignedResult.rows.map(row => ({
        id: row.user_id,
        username: row.username,
        firstName: row.first_name,
        lastName: row.last_name
      }));

      return task;
    } catch (error) {
      throw error;
    }
  }

  // Get tasks based on user role and permissions
  static async findByUserRole(userId, userRole, page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT DISTINCT t.*,
             creator.first_name as creator_first_name, creator.last_name as creator_last_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.user_id
      LEFT JOIN task_assigned_users tau ON t.task_id = tau.task_id
      WHERE 1=1
    `;

    let values = [];
    let paramCount = 0;

    // Role-based filtering
    if (userRole === 'User') {
      // Users can only see tasks assigned to them
      paramCount++;
      query += ` AND tau.user_id = $${paramCount}`;
      values.push(userId);
    } else if (userRole === 'Manager') {
      // Managers can see tasks they created or are assigned to
      paramCount++;
      query += ` AND (t.created_by = $${paramCount} OR tau.user_id = $${paramCount})`;
      values.push(userId);
    }
    // Admins can see all tasks (no additional filtering)

    // Apply filters
    if (filters.status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      values.push(filters.status);
    }

    if (filters.priority) {
      paramCount++;
      query += ` AND t.priority = $${paramCount}`;
      values.push(filters.priority);
    }

    if (filters.assignedTo) {
      paramCount++;
      query += ` AND tau.user_id = $${paramCount}`;
      values.push(filters.assignedTo);
    }

    if (filters.createdBy) {
      paramCount++;
      query += ` AND t.created_by = $${paramCount}`;
      values.push(filters.createdBy);
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    try {
      const result = await pool.query(query, values);

      // Get assigned users for each task
      const tasks = [];
      for (const row of result.rows) {
        const task = new Task(row);
        task.creator = row.creator_first_name ? {
          firstName: row.creator_first_name,
          lastName: row.creator_last_name
        } : null;

        // Get assigned users for this task
        const assignedQuery = `
          SELECT u.user_id, u.username, u.first_name, u.last_name
          FROM task_assigned_users tau
          JOIN users u ON tau.user_id = u.user_id
          WHERE tau.task_id = $1 AND u.status = 'active'
        `;
        const assignedResult = await pool.query(assignedQuery, [task.id]);
        task.assignedUsers = assignedResult.rows.map(assignedRow => ({
          id: assignedRow.user_id,
          username: assignedRow.username,
          firstName: assignedRow.first_name,
          lastName: assignedRow.last_name
        }));

        tasks.push(task);
      }

      // Get total count with same filters
      let countQuery = `
        SELECT COUNT(DISTINCT t.task_id)
        FROM tasks t
        LEFT JOIN task_assigned_users tau ON t.task_id = tau.task_id
        WHERE 1=1
      `;
      let countValues = [];
      let countParamCount = 0;

      // Apply same role-based filtering for count
      if (userRole === 'User') {
        countParamCount++;
        countQuery += ` AND tau.user_id = $${countParamCount}`;
        countValues.push(userId);
      } else if (userRole === 'Manager') {
        countParamCount++;
        countQuery += ` AND (t.created_by = $${countParamCount} OR tau.user_id = $${countParamCount})`;
        countValues.push(userId);
      }

      // Apply same filters for count
      if (filters.status) {
        countParamCount++;
        countQuery += ` AND t.status = $${countParamCount}`;
        countValues.push(filters.status);
      }
      if (filters.priority) {
        countParamCount++;
        countQuery += ` AND t.priority = $${countParamCount}`;
        countValues.push(filters.priority);
      }
      if (filters.assignedTo) {
        countParamCount++;
        countQuery += ` AND tau.user_id = $${countParamCount}`;
        countValues.push(filters.assignedTo);
      }
      if (filters.createdBy) {
        countParamCount++;
        countQuery += ` AND t.created_by = $${countParamCount}`;
        countValues.push(filters.createdBy);
      }

      const countResult = await pool.query(countQuery, countValues);
      const total = parseInt(countResult.rows[0].count);

      return {
        tasks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Update task
  static async update(id, updateData, userId, userRole) {
    // Check permissions first
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Permission check
    if (userRole === 'user' && existingTask.assignedTo !== userId) {
      throw new Error('Insufficient permissions to update this task');
    }
    if (userRole === 'manager' && existingTask.createdBy !== userId && existingTask.assignedTo !== userId) {
      throw new Error('Insufficient permissions to update this task');
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo'];
    const updates = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        paramCount++;
        const dbField = key === 'dueDate' ? 'due_date' : 
                       key === 'assignedTo' ? 'assigned_to' : key;
        updates.push(`${dbField} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    values.push(id);
    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, description, status, priority, due_date, created_by, assigned_to, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows.length > 0 ? new Task(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Delete task (only admins and managers who created the task)
  static async delete(id, userId, userRole) {
    if (userRole === 'user') {
      throw new Error('Insufficient permissions to delete tasks');
    }

    let query = 'DELETE FROM tasks WHERE id = $1';
    let values = [id];

    if (userRole === 'manager') {
      query += ' AND created_by = $2';
      values.push(userId);
    }

    query += ' RETURNING id';

    try {
      const result = await pool.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update task status (users can update status of assigned tasks)
  static async updateStatus(id, status, userId, userRole) {
    const validStatuses = ['pending', 'inprogress', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Check permissions and get existing task
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Check if user is assigned to the task
    const isAssigned = existingTask.assignedUsers.some(user => user.id === userId);
    if (userRole === 'User' && !isAssigned) {
      throw new Error('You can only update status of tasks assigned to you');
    }

    const oldStatus = existingTask.status;

    const query = `
      UPDATE tasks
      SET status = $1, updated_at = NOW()
      WHERE task_id = $2
      RETURNING task_id, title, description, status, priority, deadline, created_by, created_at, updated_at
    `;

    try {
      const result = await pool.query(query, [status, id]);
      if (result.rows.length === 0) {
        return null;
      }

      const updatedTask = new Task(result.rows[0]);
      updatedTask.assignedUsers = existingTask.assignedUsers; // Preserve assigned users

      // Send email notifications for status change (async, don't block response)
      if (oldStatus !== status) {
        setImmediate(async () => {
          try {
            const changedByUser = await User.findById(userId);
            if (changedByUser) {
              await taskNotificationService.notifyTaskStatusChange(updatedTask, oldStatus, status, changedByUser);
            }
          } catch (emailError) {
            console.error('Failed to send task status change emails:', emailError);
          }
        });
      }

      return updatedTask;
    } catch (error) {
      throw error;
    }
  }

  // Update task assignments
  static async updateAssignments(taskId, newAssignedUserIds, updatedByUserId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get existing task with current assignments
      const existingTask = await Task.findById(taskId);
      if (!existingTask) {
        throw new Error('Task not found');
      }

      // Remove all current assignments
      await client.query('DELETE FROM task_assigned_users WHERE task_id = $1', [taskId]);

      // Add new assignments
      if (newAssignedUserIds.length > 0) {
        const assignQuery = `
          INSERT INTO task_assigned_users (task_id, user_id)
          VALUES ($1, $2)
        `;

        for (const userId of newAssignedUserIds) {
          await client.query(assignQuery, [taskId, userId]);
        }
      }

      await client.query('COMMIT');

      // Get updated task
      const updatedTask = await Task.findById(taskId);

      // Send email notifications for assignment changes (async, don't block response)
      setImmediate(async () => {
        try {
          const updatedByUser = await User.findById(updatedByUserId);
          if (updatedByUser) {
            await taskNotificationService.notifyTaskUpdateComplete(existingTask, updatedTask, updatedByUser);
          }
        } catch (emailError) {
          console.error('Failed to send task assignment change emails:', emailError);
        }
      });

      return updatedTask;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      deadline: this.deadline,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      creator: this.creator,
      assignedUsers: this.assignedUsers
    };
  }
}

export default Task;

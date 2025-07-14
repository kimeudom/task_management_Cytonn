/**
 * Dashboard routes
 * Handles all API endpoints related to dashboard data
 * Provides statistics and summary data with role-based access control
 */
import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let taskQuery = '';
    let taskParams = [];
    let paramCount = 0;

    // Build query based on user role
    if (userRole === 'admin') {
      // Admin sees all tasks
      taskQuery = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tasks,
          COUNT(*) FILTER (WHERE deadline < NOW() AND status NOT IN ('completed', 'cancelled')) as overdue_tasks,
          COUNT(*) FILTER (WHERE priority >= 4) as high_priority_tasks
        FROM tasks
        WHERE 1=1
      `;
    } else if (userRole === 'manager') {
      // Manager sees tasks they created or are assigned to
      taskQuery = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tasks,
          COUNT(*) FILTER (WHERE deadline < NOW() AND status NOT IN ('completed', 'cancelled')) as overdue_tasks,
          COUNT(*) FILTER (WHERE priority >= 4) as high_priority_tasks
        FROM tasks t
        LEFT JOIN task_assigned_users tau ON t.task_id = tau.task_id
        WHERE (t.created_by = $1 OR tau.user_id = $1)
      `;
      paramCount++;
      taskParams.push(userId);
    } else {
      // User sees only assigned tasks
      taskQuery = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tasks,
          COUNT(*) FILTER (WHERE deadline < NOW() AND status NOT IN ('completed', 'cancelled')) as overdue_tasks,
          COUNT(*) FILTER (WHERE priority >= 4) as high_priority_tasks
        FROM tasks t
        JOIN task_assigned_users tau ON t.task_id = tau.task_id
        WHERE tau.user_id = $1
      `;
      paramCount++;
      taskParams.push(userId);
    }

    const taskResult = await pool.query(taskQuery, taskParams);
    const taskStats = taskResult.rows[0];

    // Convert string counts to numbers
    const stats = {
      totalTasks: parseInt(taskStats.total_tasks) || 0,
      pendingTasks: parseInt(taskStats.pending_tasks) || 0,
      inProgressTasks: parseInt(taskStats.in_progress_tasks) || 0,
      completedTasks: parseInt(taskStats.completed_tasks) || 0,
      cancelledTasks: parseInt(taskStats.cancelled_tasks) || 0,
      overdueTasks: parseInt(taskStats.overdue_tasks) || 0,
      highPriorityTasks: parseInt(taskStats.high_priority_tasks) || 0
    };

    // Add user statistics for admins
    if (userRole === 'admin') {
      const userStatsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE r.role_name = 'admin') as admin_users,
          COUNT(*) FILTER (WHERE r.role_name = 'manager') as manager_users,
          COUNT(*) FILTER (WHERE r.role_name = 'user') as regular_users,
          COUNT(*) FILTER (WHERE u.status = 'active') as active_users
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        WHERE u.status = 'active'
      `;
      
      const userResult = await pool.query(userStatsQuery);
      const userStats = userResult.rows[0];
      
      stats.userStats = {
        totalUsers: parseInt(userStats.total_users) || 0,
        adminUsers: parseInt(userStats.admin_users) || 0,
        managerUsers: parseInt(userStats.manager_users) || 0,
        regularUsers: parseInt(userStats.regular_users) || 0,
        activeUsers: parseInt(userStats.active_users) || 0
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/recent-tasks - Get recent tasks for dashboard
router.get('/recent-tasks', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 5;

    let taskQuery = '';
    let taskParams = [];
    let paramCount = 0;

    // Build query based on user role
    if (userRole === 'admin') {
      // Admin sees all tasks, sorted by priority and deadline
      taskQuery = `
        SELECT t.task_id as id, t.title, t.description, t.status, t.priority, t.deadline,
               t.created_by, t.created_at, t.updated_at,
               u.first_name as creator_first_name, u.last_name as creator_last_name
        FROM tasks t
        LEFT JOIN users u ON t.created_by = u.user_id
        ORDER BY 
          CASE 
            WHEN t.status = 'pending' AND t.deadline < NOW() + INTERVAL '3 days' THEN 1
            WHEN t.status = 'pending' AND t.priority >= 4 THEN 2
            WHEN t.status = 'in_progress' AND t.priority >= 4 THEN 3
            WHEN t.status = 'pending' THEN 4
            WHEN t.status = 'in_progress' THEN 5
            ELSE 6
          END,
          t.deadline ASC NULLS LAST,
          t.updated_at DESC
        LIMIT $1
      `;
      paramCount++;
      taskParams.push(limit);
    } else if (userRole === 'manager') {
      // Manager sees tasks they created or are assigned to
      taskQuery = `
        SELECT t.task_id as id, t.title, t.description, t.status, t.priority, t.deadline,
               t.created_by, t.created_at, t.updated_at,
               u.first_name as creator_first_name, u.last_name as creator_last_name
        FROM tasks t
        LEFT JOIN task_assigned_users tau ON t.task_id = tau.task_id
        LEFT JOIN users u ON t.created_by = u.user_id
        WHERE (t.created_by = $1 OR tau.user_id = $1)
        ORDER BY 
          CASE 
            WHEN t.status = 'pending' AND t.deadline < NOW() + INTERVAL '3 days' THEN 1
            WHEN t.status = 'pending' AND t.priority >= 4 THEN 2
            WHEN t.status = 'in_progress' AND t.priority >= 4 THEN 3
            WHEN t.status = 'pending' THEN 4
            WHEN t.status = 'in_progress' THEN 5
            ELSE 6
          END,
          t.deadline ASC NULLS LAST,
          t.updated_at DESC
        LIMIT $2
      `;
      paramCount++;
      taskParams.push(userId);
      paramCount++;
      taskParams.push(limit);
    } else {
      // User sees only assigned tasks
      taskQuery = `
        SELECT t.task_id as id, t.title, t.description, t.status, t.priority, t.deadline,
               t.created_by, t.created_at, t.updated_at,
               u.first_name as creator_first_name, u.last_name as creator_last_name
        FROM tasks t
        JOIN task_assigned_users tau ON t.task_id = tau.task_id
        LEFT JOIN users u ON t.created_by = u.user_id
        WHERE tau.user_id = $1
        ORDER BY 
          CASE 
            WHEN t.status = 'pending' AND t.deadline < NOW() + INTERVAL '3 days' THEN 1
            WHEN t.status = 'pending' AND t.priority >= 4 THEN 2
            WHEN t.status = 'in_progress' AND t.priority >= 4 THEN 3
            WHEN t.status = 'pending' THEN 4
            WHEN t.status = 'in_progress' THEN 5
            ELSE 6
          END,
          t.deadline ASC NULLS LAST,
          t.updated_at DESC
        LIMIT $2
      `;
      paramCount++;
      taskParams.push(userId);
      paramCount++;
      taskParams.push(limit);
    }

    const result = await pool.query(taskQuery, taskParams);
    
    // Get assigned users for each task
    const tasks = [];
    for (const row of result.rows) {
      const task = {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        deadline: row.deadline,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        creator: row.creator_first_name ? {
          firstName: row.creator_first_name,
          lastName: row.creator_last_name
        } : null
      };

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

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

export default router;

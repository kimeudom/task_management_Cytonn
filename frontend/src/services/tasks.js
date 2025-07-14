/**
 * Task Management Service
 * Handles all task-related API operations with proper error handling and data transformation
 */

import { apiService } from './api.js'
import { transformTaskFromBackend, transformTaskToBackend } from '@/utils/dataTransforms'

class TaskService {
  /**
   * Get all tasks with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10, max: 100)
   * @param {string} params.status - Filter by status
   * @param {string} params.priority - Filter by priority
   * @param {number} params.assignedTo - Filter by assigned user ID
   * @param {number} params.createdBy - Filter by creator user ID
   * @returns {Promise<Object>} Tasks list with pagination info
   */
  async getTasks(params = {}) {
    try {
      const response = await apiService.tasks.getAll(params)
      
      if (response.data.success) {
        return {
          tasks: response.data.data.map(transformTaskFromBackend),
          pagination: response.data.pagination
        }
      }
      
      throw new Error(response.data.message || 'Failed to fetch tasks')
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get task by ID
   * @param {number} id - Task ID
   * @returns {Promise<Object>} Task object
   */
  async getTaskById(id) {
    try {
      const response = await apiService.tasks.getById(id)
      
      if (response.data.success) {
        return transformTaskFromBackend(response.data.data)
      }
      
      throw new Error(response.data.message || 'Failed to fetch task')
    } catch (error) {
      console.error('Error fetching task:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Create new task (Manager/Admin only)
   * @param {Object} taskData - Task data
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description
   * @param {string} taskData.priority - Task priority (low, medium, high, urgent)
   * @param {string} taskData.deadline - Task deadline (ISO string)
   * @param {Array<number>} taskData.assignedUsers - Array of user IDs
   * @returns {Promise<Object>} Created task object
   */
  async createTask(taskData) {
    try {
      // Transform frontend data to backend format
      const backendData = transformTaskToBackend(taskData)
      
      const response = await apiService.tasks.create(backendData)
      
      if (response.data.success) {
        return transformTaskFromBackend(response.data.data)
      }
      
      throw new Error(response.data.message || 'Failed to create task')
    } catch (error) {
      console.error('Error creating task:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Update task (Manager/Admin or task creator only)
   * @param {number} id - Task ID
   * @param {Object} taskData - Updated task data
   * @returns {Promise<Object>} Updated task object
   */
  async updateTask(id, taskData) {
    try {
      // Transform frontend data to backend format
      const backendData = transformTaskToBackend(taskData)
      
      const response = await apiService.tasks.update(id, backendData)
      
      if (response.data.success) {
        return transformTaskFromBackend(response.data.data)
      }
      
      throw new Error(response.data.message || 'Failed to update task')
    } catch (error) {
      console.error('Error updating task:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Delete task (Manager/Admin only)
   * @param {number} id - Task ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTask(id) {
    try {
      const response = await apiService.tasks.delete(id)
      
      if (response.data.success) {
        return true
      }
      
      throw new Error(response.data.message || 'Failed to delete task')
    } catch (error) {
      console.error('Error deleting task:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Update task status (Any authenticated user for assigned tasks)
   * @param {number} id - Task ID
   * @param {string} status - New status (pending, in_progress, completed, cancelled)
   * @returns {Promise<Object>} Updated task object
   */
  async updateTaskStatus(id, status) {
    try {
      const response = await apiService.tasks.updateStatus(id, status)
      
      if (response.data.success) {
        return transformTaskFromBackend(response.data.data)
      }
      
      throw new Error(response.data.message || 'Failed to update task status')
    } catch (error) {
      console.error('Error updating task status:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get task statistics for dashboard
   * @returns {Promise<Object>} Task statistics
   */
  async getTaskStats() {
    try {
      // Since backend doesn't have a stats endpoint, we'll calculate from all tasks
      const response = await apiService.tasks.getAll({ limit: 1000 })
      
      if (response.data.success) {
        const tasks = response.data.data
        const now = new Date()
        
        const stats = {
          totalTasks: tasks.length,
          pendingTasks: tasks.filter(task => task.status === 'pending').length,
          inProgressTasks: tasks.filter(task => task.status === 'in_progress').length,
          completedTasks: tasks.filter(task => task.status === 'completed').length,
          cancelledTasks: tasks.filter(task => task.status === 'cancelled').length,
          overdueTasks: tasks.filter(task => {
            if (!task.deadline) return false
            return new Date(task.deadline) < now && task.status !== 'completed'
          }).length,
          highPriorityTasks: tasks.filter(task => 
            task.priority === 'high' || task.priority === 'urgent'
          ).length
        }
        
        return stats
      }
      
      throw new Error(response.data.message || 'Failed to fetch task statistics')
    } catch (error) {
      console.error('Error fetching task stats:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Validate task data before submission
   * @param {Object} taskData - Task data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateTaskData(taskData, isUpdate = false) {
    const errors = []

    // Title validation
    if (!isUpdate || taskData.title !== undefined) {
      if (!taskData.title || taskData.title.length < 3) {
        errors.push('Task title must be at least 3 characters long')
      }
      if (taskData.title && taskData.title.length > 255) {
        errors.push('Task title must be less than 255 characters')
      }
    }

    // Description validation
    if (taskData.description && taskData.description.length > 2000) {
      errors.push('Task description must be less than 2000 characters')
    }

    // Priority validation
    if (!isUpdate || taskData.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (taskData.priority && !validPriorities.includes(taskData.priority.toLowerCase())) {
        errors.push('Please select a valid priority level')
      }
    }

    // Status validation
    if (taskData.status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled']
      if (taskData.status && !validStatuses.includes(taskData.status.toLowerCase())) {
        errors.push('Please select a valid status')
      }
    }

    // Deadline validation
    if (taskData.deadline !== undefined && taskData.deadline !== null) {
      const deadline = new Date(taskData.deadline)
      if (isNaN(deadline.getTime())) {
        errors.push('Please enter a valid deadline date')
      }
    }

    // Assigned users validation
    if (taskData.assignedUsers !== undefined) {
      if (!Array.isArray(taskData.assignedUsers)) {
        errors.push('Assigned users must be an array')
      } else if (taskData.assignedUsers.some(id => !Number.isInteger(id) || id <= 0)) {
        errors.push('All assigned user IDs must be positive integers')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Handle API errors and provide user-friendly messages
   * @param {Error} error - The error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          if (data.code === 'VALIDATION_ERROR') {
            return new Error(data.details?.join(', ') || 'Validation failed')
          }
          return new Error(data.error || 'Bad request')

        case 401:
          return new Error('You are not authorized to perform this action')

        case 403:
          return new Error('You do not have permission to perform this action')

        case 404:
          return new Error('Task not found')

        case 429:
          return new Error('Too many requests. Please try again later')

        case 500:
          return new Error('Server error. Please try again later')

        default:
          return new Error(data.error || data.message || 'An unexpected error occurred')
      }
    }

    if (error.code === 'NETWORK_ERROR') {
      return new Error('Network error. Please check your connection')
    }

    return new Error(error.message || 'An unexpected error occurred')
  }
}

// Create singleton instance
const taskService = new TaskService()

export default taskService
export { TaskService }

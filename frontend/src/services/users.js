/**
 * User Management Service
 * Handles all user-related API 
 */

import { apiService } from './api.js'
import { transformUserFromBackend, transformUserToBackend } from '@/utils/dataTransforms'
import { withRetryAndErrorHandling, createErrorHandler } from '@/utils/errorHandler'

class UserService {
  constructor() {
    // Create context-specific error handler
    this.handleError = createErrorHandler('User Management', {
      showToast: true,
      logError: true
    })
  }
  /**
   * Get all users with pagination and filtering (Admin only)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10, max: 100)
   * @param {string} params.role - Filter by role (admin, manager, user)
   * @returns {Promise<Object>} Users list with pagination info
   */
  async getUsers(params = {}) {
    const fetchUsers = async () => {
      const response = await apiService.users.getAll(params)

      if (response.data.success) {
        return {
          users: response.data.data.map(transformUserFromBackend),
          pagination: response.data.pagination
        }
      }

      throw new Error(response.data.message || 'Failed to fetch users')
    }

    return withRetryAndErrorHandling(fetchUsers, undefined, {
      context: 'Fetching users',
      showToast: true
    })()
  }

  /**
   * Get user by ID (Admin only)
   * @param {number} id - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(id) {
    try {
      const response = await apiService.users.getById(id)
      
      if (response.data.success) {
        return transformUserFromBackend(response.data.data)
      }
      
      throw new Error(response.data.message || 'Failed to fetch user')
    } catch (error) {
      console.error('Error fetching user:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Create new user (Admin only)
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email address
   * @param {string} userData.password - Password
   * @param {string} userData.firstName - First name
   * @param {string} userData.middleName - Middle name (optional)
   * @param {string} userData.lastName - Last name
   * @param {string} userData.role - User role (admin, manager, user)
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData) {
    try {
      // Transform frontend data to backend format
      const backendData = transformUserToBackend(userData)
      
      const response = await apiService.users.create(backendData)
      
      if (response.data.success) {
        return transformUserFromBackend(response.data.data)
      }
      
      throw new Error(response.data.message || 'Failed to create user')
    } catch (error) {
      console.error('Error creating user:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Update user (Admin only)
   * @param {number} id - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(id, userData) {
    try {
      // Transform frontend data to backend format
      const backendData = transformUserToBackend(userData)
      
      const response = await apiService.users.update(id, backendData)
      
      if (response.data.success) {
        return transformUserFromBackend(response.data.data)
      }
      
      throw new Error(response.data.message || 'Failed to update user')
    } catch (error) {
      console.error('Error updating user:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Delete user (Admin only)
   * @param {number} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(id) {
    try {
      const response = await apiService.users.delete(id)
      
      if (response.data.success) {
        return true
      }
      
      throw new Error(response.data.message || 'Failed to delete user')
    } catch (error) {
      console.error('Error deleting user:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Get users for assignment dropdown (simplified list)
   * @returns {Promise<Array>} Array of users with id, name, and role
   */
  async getUsersForAssignment() {
    try {
      const response = await apiService.users.getAll({ limit: 100 })
      
      if (response.data.success) {
        return response.data.data.map(user => ({
          id: user.id || user.user_id,
          name: `${user.firstName || user.first_name} ${user.lastName || user.last_name}`,
          email: user.email,
          role: user.role || user.roleName || user.role_name
        }))
      }
      
      throw new Error(response.data.message || 'Failed to fetch users')
    } catch (error) {
      console.error('Error fetching users for assignment:', error)
      throw this.handleError(error)
    }
  }

  /**
   * Validate user data before submission
   * @param {Object} userData - User data to validate
   * @param {boolean} isUpdate - Whether this is an update operation
   * @returns {Object} Validation result
   */
  validateUserData(userData, isUpdate = false) {
    const errors = []

    // Username validation
    if (!isUpdate || userData.username !== undefined) {
      if (!userData.username || userData.username.length < 3) {
        errors.push('Username must be at least 3 characters long')
      }
    }

    // Email validation
    if (!isUpdate || userData.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!userData.email || !emailRegex.test(userData.email)) {
        errors.push('Please enter a valid email address')
      }
    }

    // Password validation (only for create or when password is being updated)
    if (!isUpdate || userData.password !== undefined) {
      if (!userData.password || userData.password.length < 8) {
        errors.push('Password must be at least 8 characters long')
      }
    }

    // Name validation
    if (!isUpdate || userData.firstName !== undefined) {
      if (!userData.firstName || userData.firstName.length < 2) {
        errors.push('First name must be at least 2 characters long')
      }
    }

    if (!isUpdate || userData.lastName !== undefined) {
      if (!userData.lastName || userData.lastName.length < 2) {
        errors.push('Last name must be at least 2 characters long')
      }
    }

    // Role validation
    if (!isUpdate || userData.role !== undefined) {
      const validRoles = ['admin', 'manager', 'user']
      if (!userData.role || !validRoles.includes(userData.role.toLowerCase())) {
        errors.push('Please select a valid role')
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
          return new Error('User not found')

        case 409:
          return new Error('A user with this email or username already exists')

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
const userService = new UserService()

export default userService
export { UserService }

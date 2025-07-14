/**
 * API Guards for Role-Based Access Control
 * Intercepts API calls to check permissions before execution
 */

import { hasPermission, canPerformTaskAction } from '@/utils/permissions'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

/**
 * Permission guard decorator for API functions
 * @param {string|Array} requiredPermissions - Required permission(s)
 * @param {Function} apiFunction - API function to guard
 * @param {Object} options - Guard options
 * @returns {Function} Guarded API function
 */
export function withPermissionGuard(requiredPermissions, apiFunction, options = {}) {
  return async function(...args) {
    const authStore = useAuthStore()
    const toast = useToast()
    
    // Check authentication
    if (!authStore.isAuthenticated) {
      const error = new Error('Authentication required')
      if (options.showToast !== false) {
        toast.error('Please log in to continue')
      }
      throw error
    }
    
    // Check permissions
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(permission, authStore.user)
    )
    
    if (!hasRequiredPermission) {
      const error = new Error('Insufficient permissions')
      if (options.showToast !== false) {
        toast.error('You do not have permission to perform this action')
      }
      throw error
    }
    
    try {
      return await apiFunction.apply(this, args)
    } catch (error) {
      // Handle permission-related API errors
      if (error.response?.status === 403) {
        if (options.showToast !== false) {
          toast.error('Access denied')
        }
      } else if (error.response?.status === 401) {
        if (options.showToast !== false) {
          toast.error('Session expired. Please log in again')
        }
        authStore.logout()
      }
      throw error
    }
  }
}

/**
 * Task-specific permission guard
 * @param {string} action - Action to perform on task
 * @param {Function} apiFunction - API function to guard
 * @param {Object} options - Guard options
 * @returns {Function} Guarded API function
 */
export function withTaskPermissionGuard(action, apiFunction, options = {}) {
  return async function(taskId, ...args) {
    const authStore = useAuthStore()
    const toast = useToast()
    
    // Check authentication
    if (!authStore.isAuthenticated) {
      const error = new Error('Authentication required')
      if (options.showToast !== false) {
        toast.error('Please log in to continue')
      }
      throw error
    }
    
    // For task-specific actions, we need to get the task first
    if (options.getTask && typeof options.getTask === 'function') {
      try {
        const task = await options.getTask(taskId)
        
        if (!canPerformTaskAction(task, action, authStore.user)) {
          const error = new Error('Insufficient permissions for this task')
          if (options.showToast !== false) {
            toast.error('You do not have permission to perform this action on this task')
          }
          throw error
        }
      } catch (error) {
        if (error.message.includes('permission')) {
          throw error
        }
        // If we can't get the task, let the API call handle it
      }
    }
    
    try {
      return await apiFunction.apply(this, [taskId, ...args])
    } catch (error) {
      // Handle permission-related API errors
      if (error.response?.status === 403) {
        if (options.showToast !== false) {
          toast.error('Access denied')
        }
      } else if (error.response?.status === 401) {
        if (options.showToast !== false) {
          toast.error('Session expired. Please log in again')
        }
        authStore.logout()
      }
      throw error
    }
  }
}

/**
 * Role-based guard decorator
 * @param {string|Array} requiredRoles - Required role(s)
 * @param {Function} apiFunction - API function to guard
 * @param {Object} options - Guard options
 * @returns {Function} Guarded API function
 */
export function withRoleGuard(requiredRoles, apiFunction, options = {}) {
  return async function(...args) {
    const authStore = useAuthStore()
    const toast = useToast()
    
    // Check authentication
    if (!authStore.isAuthenticated) {
      const error = new Error('Authentication required')
      if (options.showToast !== false) {
        toast.error('Please log in to continue')
      }
      throw error
    }
    
    // Check role
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const userRole = authStore.user?.role?.toLowerCase()
    
    if (!userRole || !roles.map(r => r.toLowerCase()).includes(userRole)) {
      const error = new Error('Insufficient role permissions')
      if (options.showToast !== false) {
        toast.error('You do not have the required role to perform this action')
      }
      throw error
    }
    
    try {
      return await apiFunction.apply(this, args)
    } catch (error) {
      // Handle permission-related API errors
      if (error.response?.status === 403) {
        if (options.showToast !== false) {
          toast.error('Access denied')
        }
      } else if (error.response?.status === 401) {
        if (options.showToast !== false) {
          toast.error('Session expired. Please log in again')
        }
        authStore.logout()
      }
      throw error
    }
  }
}

/**
 * Create guarded API service with permission checks
 * @param {Object} apiService - Original API service
 * @returns {Object} Guarded API service
 */
export function createGuardedApiService(apiService) {
  return {
    // Authentication endpoints (no guards needed)
    auth: apiService.auth,
    
    // User management endpoints (admin only)
    users: {
      getAll: withPermissionGuard('users.list', apiService.users.getAll),
      getById: withPermissionGuard('users.view', apiService.users.getById),
      create: withPermissionGuard('users.create', apiService.users.create),
      update: withPermissionGuard('users.edit', apiService.users.update),
      delete: withPermissionGuard('users.delete', apiService.users.delete)
    },
    
    // Task management endpoints
    tasks: {
      getAll: withPermissionGuard('tasks.view', apiService.tasks.getAll),
      getById: withPermissionGuard('tasks.view', apiService.tasks.getById),
      create: withPermissionGuard('tasks.create', apiService.tasks.create),
      update: withPermissionGuard('tasks.edit', apiService.tasks.update),
      delete: withPermissionGuard('tasks.delete', apiService.tasks.delete),
      updateStatus: withPermissionGuard('tasks.update_status', apiService.tasks.updateStatus)
    }
  }
}

/**
 * Middleware to check permissions before route navigation
 * @param {string|Array} requiredPermissions - Required permission(s)
 * @returns {Function} Route guard function
 */
export function createPermissionGuard(requiredPermissions) {
  return (to, from, next) => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
    
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    const hasRequiredPermission = permissions.some(permission => 
      hasPermission(permission, authStore.user)
    )
    
    if (!hasRequiredPermission) {
      next('/unauthorized')
      return
    }
    
    next()
  }
}

/**
 * Middleware to check role before route navigation
 * @param {string|Array} requiredRoles - Required role(s)
 * @returns {Function} Route guard function
 */
export function createRoleGuard(requiredRoles) {
  return (to, from, next) => {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const userRole = authStore.user?.role?.toLowerCase()
    
    if (!userRole || !roles.map(r => r.toLowerCase()).includes(userRole)) {
      next('/unauthorized')
      return
    }
    
    next()
  }
}

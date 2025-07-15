/**
 * Role-Based Access Control (RBAC) Utilities
 * Manages permissions and access control throughout the application
 */

import { useAuthStore } from '@/stores/auth'

// Define role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  user: 1,
  manager: 2,
  admin: 3
}

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  admin: {
    users: ['create', 'read', 'update', 'delete', 'manage_roles'],
    tasks: ['create', 'read', 'update', 'delete', 'assign', 'manage_all'],
    dashboard: ['read', 'manage'],
    system: ['configure', 'monitor']
  },
  manager: {
    users: ['read'],
    tasks: ['create', 'read', 'update', 'delete', 'assign'],
    dashboard: ['read'],
    reports: ['read', 'generate']
  },
  user: {
    tasks: ['read', 'update_status', 'comment', 'self_assign'],
    dashboard: ['read'],
    profile: ['read', 'update']
  }
}

// Define resource-specific permissions
export const RESOURCE_PERMISSIONS = {
  // User management
  'users.list': ['admin'],
  'users.create': ['admin'],
  'users.edit': ['admin'],
  'users.delete': ['admin'],
  'users.view': ['admin', 'manager'],
  
  // Task management
  'tasks.create': ['admin', 'manager'],
  'tasks.edit': ['admin', 'manager'],
  'tasks.delete': ['admin', 'manager'],
  'tasks.assign': ['admin', 'manager'],
  'tasks.self_assign': ['admin', 'manager', 'user'],
  'tasks.view': ['admin', 'manager', 'user'],
  'tasks.update_status': ['admin', 'manager', 'user'],
  
  // Dashboard
  'dashboard.view': ['admin', 'manager', 'user'],
  'dashboard.manage': ['admin'],
  
  // Reports
  'reports.view': ['admin', 'manager'],
  'reports.generate': ['admin', 'manager']
}

/**
 * Check if user has permission for a specific action
 * @param {string} permission - Permission string (e.g., 'users.create')
 * @param {Object} user - User object (optional, uses current user if not provided)
 * @returns {boolean} Whether user has permission
 */
export function hasPermission(permission, user = null) {
  const authStore = useAuthStore()
  const currentUser = user || authStore.user
  
  if (!currentUser || !currentUser.role) {
    return false
  }
  
  const userRole = currentUser.role.toLowerCase()
  const allowedRoles = RESOURCE_PERMISSIONS[permission]
  
  if (!allowedRoles) {
    console.warn(`Permission '${permission}' not defined`)
    return false
  }
  
  return allowedRoles.includes(userRole)
}

/**
 * Check if user has any of the specified permissions
 * @param {Array<string>} permissions - Array of permission strings
 * @param {Object} user - User object (optional)
 * @returns {boolean} Whether user has any of the permissions
 */
export function hasAnyPermission(permissions, user = null) {
  return permissions.some(permission => hasPermission(permission, user))
}

/**
 * Check if user has all of the specified permissions
 * @param {Array<string>} permissions - Array of permission strings
 * @param {Object} user - User object (optional)
 * @returns {boolean} Whether user has all permissions
 */
export function hasAllPermissions(permissions, user = null) {
  return permissions.every(permission => hasPermission(permission, user))
}

/**
 * Check if user role has higher or equal hierarchy level
 * @param {string} requiredRole - Required role
 * @param {Object} user - User object (optional)
 * @returns {boolean} Whether user meets role requirement
 */
export function hasRoleLevel(requiredRole, user = null) {
  const authStore = useAuthStore()
  const currentUser = user || authStore.user
  
  if (!currentUser || !currentUser.role) {
    return false
  }
  
  const userLevel = ROLE_HIERARCHY[currentUser.role.toLowerCase()] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole.toLowerCase()] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Check if user can access a specific resource
 * @param {string} resource - Resource name
 * @param {string} action - Action to perform
 * @param {Object} user - User object (optional)
 * @returns {boolean} Whether user can access resource
 */
export function canAccessResource(resource, action, user = null) {
  const authStore = useAuthStore()
  const currentUser = user || authStore.user
  
  if (!currentUser || !currentUser.role) {
    return false
  }
  
  const userRole = currentUser.role.toLowerCase()
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  
  if (!rolePermissions || !rolePermissions[resource]) {
    return false
  }
  
  return rolePermissions[resource].includes(action)
}

/**
 * Helper function to check if user is assigned to a task
 * @param {Object} task - Task object
 * @param {number} userId - User ID
 * @returns {boolean} Whether user is assigned to task
 */
function isUserAssignedToTask(task, userId) {
  if (!task || !task.assignedUsers || !userId) {
    return false
  }
  // Standardize to check against an array of user objects
  return task.assignedUsers.some(user => user && user.id === userId)
}

/**
 * Check if user can perform action on specific task
 * @param {Object} task - Task object
 * @param {string} action - Action to perform
 * @param {Object} user - User object (optional)
 * @returns {boolean} Whether user can perform action
 */
export function canPerformTaskAction(task, action, user = null) {
  const authStore = useAuthStore()
  const currentUser = user || authStore.user

  if (!currentUser || !task) {
    return false
  }

  const userRole = currentUser.role.toLowerCase()
  const userId = currentUser.id

  // Admin can do everything
  if (userRole === 'admin') {
    return true
  }

  const isOwner = task.createdBy === userId
  const isAssigned = isUserAssignedToTask(task, userId)

  // Manager permissions
  if (userRole === 'manager') {
    switch (action) {
      case 'create':
      case 'read':
      case 'assign':
        return true
      case 'update':
      case 'delete':
        // Managers can update/delete tasks they created or are assigned to
        return isOwner || isAssigned
      default:
        return false
    }
  }

  // User permissions
  if (userRole === 'user') {
    switch (action) {
      case 'read':
        // Users can read tasks they created or are assigned to
        return isOwner || isAssigned
      case 'update_status':
      case 'comment':
        // Users can update status or comment on tasks assigned to them
        return isAssigned
      default:
        return false
    }
  }

  return false
}

/**
 * Get filtered menu items based on user permissions
 * @param {Array} menuItems - Array of menu items
 * @param {Object} user - User object (optional)
 * @returns {Array} Filtered menu items
 */
export function getFilteredMenuItems(menuItems, user = null) {
  const authStore = useAuthStore()
  const currentUser = user || authStore.user
  
  if (!currentUser) {
    return []
  }
  
  return menuItems.filter(item => {
    if (!item.permission) {
      return true // No permission required
    }
    
    if (Array.isArray(item.permission)) {
      return hasAnyPermission(item.permission, currentUser)
    }
    
    return hasPermission(item.permission, currentUser)
  })
}

/**
 * Check if user can view component based on permissions
 * @param {string|Array} permissions - Permission(s) required
 * @param {Object} user - User object (optional)
 * @returns {boolean} Whether component should be visible
 */
export function canViewComponent(permissions, user = null) {
  if (!permissions) {
    return true // No permissions required
  }
  
  if (Array.isArray(permissions)) {
    return hasAnyPermission(permissions, user)
  }
  
  return hasPermission(permissions, user)
}

/**
 * Get user's effective permissions
 * @param {Object} user - User object (optional)
 * @returns {Array} Array of permission strings
 */
export function getUserPermissions(user = null) {
  const authStore = useAuthStore()
  const currentUser = user || authStore.user
  
  if (!currentUser || !currentUser.role) {
    return []
  }
  
  const userRole = currentUser.role.toLowerCase()
  const permissions = []
  
  // Add all permissions for user's role
  Object.entries(RESOURCE_PERMISSIONS).forEach(([permission, roles]) => {
    if (roles.includes(userRole)) {
      permissions.push(permission)
    }
  })
  
  return permissions
}

/**
 * Middleware function to check permissions before API calls
 * @param {string} permission - Required permission
 * @param {Function} apiCall - API function to call
 * @param {Object} user - User object (optional)
 * @returns {Function} Wrapped API function
 */
export function withPermissionCheck(permission, apiCall, user = null) {
  return async (...args) => {
    if (!hasPermission(permission, user)) {
      throw new Error('You do not have permission to perform this action')
    }
    
    return await apiCall(...args)
  }
}

/**
 * Enhanced permission checking with debugging
 * @param {Object} task - Task object
 * @param {string} action - Action to perform
 * @param {Object} user - User object (optional)
 * @returns {boolean} Whether user can perform action
 */
export function canPerformTaskActionDebug(task, action, user = null) {
  const authStore = useAuthStore()
  const currentUser = user || authStore.user
  
  console.log('Permission check:', {
    task: task?.id,
    action,
    user: currentUser?.id,
    userRole: currentUser?.role,
    taskCreatedBy: task?.createdBy,
    taskAssignedUsers: task?.assignedUsers,
    taskAssignedTo: task?.assignedTo
  })
  
  const result = canPerformTaskAction(task, action, currentUser)
  console.log('Permission result:', result)
  
  return result
}

/**
 * Vue composable for permissions
 * @returns {Object} Permission utilities
 */
export function usePermissions() {
  const authStore = useAuthStore()
  
  return {
    hasPermission: (permission) => hasPermission(permission, authStore.user),
    hasAnyPermission: (permissions) => hasAnyPermission(permissions, authStore.user),
    hasAllPermissions: (permissions) => hasAllPermissions(permissions, authStore.user),
    hasRoleLevel: (role) => hasRoleLevel(role, authStore.user),
    canAccessResource: (resource, action) => canAccessResource(resource, action, authStore.user),
    canPerformTaskAction: (task, action) => canPerformTaskAction(task, action, authStore.user),
    canPerformTaskActionDebug: (task, action) => canPerformTaskActionDebug(task, action, authStore.user),
    canViewComponent: (permissions) => canViewComponent(permissions, authStore.user),
    getUserPermissions: () => getUserPermissions(authStore.user),
    isAdmin: () => authStore.isAdmin,
    isManager: () => authStore.isManager,
    isUser: () => authStore.isUser,
    isManagerOrAdmin: () => authStore.isManagerOrAdmin
  }
}
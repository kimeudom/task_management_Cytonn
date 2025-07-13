/**
 * Centralised definitions for all enums used across the application
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  USER: 'user'
};

export const ROLE_ID_MAP = {
  1: USER_ROLES.ADMIN,
  2: USER_ROLES.USER,
  3: USER_ROLES.MANAGER
};

// Reverse mapping
export const ROLE_NAME_TO_ID = {
  [USER_ROLES.ADMIN]: 1,
  [USER_ROLES.USER]: 2,
  [USER_ROLES.MANAGER]: 3
};

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted'
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh'
};

export const BLACKLIST_REASONS = {
  LOGOUT: 'logout',
  FORCED_LOGOUT: 'forced_logout',
  SECURITY_BREACH: 'security_breach'
};

// Helper functions
//----------------------------------------------------------
export const isValidRole = (role) => {
  return Object.values(USER_ROLES).includes(role?.toLowerCase());
};

export const isValidUserStatus = (status) => {
  return Object.values(USER_STATUS).includes(status?.toLowerCase());
};

export const isValidTaskStatus = (status) => {
  return Object.values(TASK_STATUS).includes(status?.toLowerCase());
};

export const isValidTaskPriority = (priority) => {
  return Object.values(TASK_PRIORITY).includes(priority?.toLowerCase());
};

export const normalizeRole = (role) => {
  if (typeof role === 'number') {
    return ROLE_ID_MAP[role] || USER_ROLES.USER;
  }
  return role?.toLowerCase();
};

export const getRoleId = (roleName) => {
  return ROLE_NAME_TO_ID[roleName?.toLowerCase()] || 2;
};

export const getRoleName = (roleId) => {
  return ROLE_ID_MAP[roleId] || USER_ROLES.USER;
};

// Role hierarchy for permissions
export const ROLE_HIERARCHY = {
  [USER_ROLES.ADMIN]: 3,
  [USER_ROLES.MANAGER]: 2,
  [USER_ROLES.USER]: 1
};

export const hasPermission = (userRole, requiredRole) => {
  const userLevel = ROLE_HIERARCHY[userRole?.toLowerCase()] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole?.toLowerCase()] || 0;
  return userLevel >= requiredLevel;
};

// Arrays for validation
export const VALID_ROLES = Object.values(USER_ROLES);
export const VALID_USER_STATUSES = Object.values(USER_STATUS);
export const VALID_TASK_STATUSES = Object.values(TASK_STATUS);
export const VALID_TASK_PRIORITIES = Object.values(TASK_PRIORITY);
export const VALID_TOKEN_TYPES = Object.values(TOKEN_TYPES);
export const VALID_BLACKLIST_REASONS = Object.values(BLACKLIST_REASONS);

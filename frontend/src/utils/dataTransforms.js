/**
 * Data transformation utilities
 * Handles mapping between frontend and backend data structures
 */

/**
 * Transform backend user data to frontend format
 */
export const transformUserFromBackend = (backendUser) => {
  if (!backendUser) return null

  // Map roleId to role name
  const roleMap = {
    1: 'admin',
    2: 'manager',
    3: 'user'
  }

  const firstName = backendUser.firstName || backendUser.first_name || '';
  const lastName = backendUser.lastName || backendUser.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || backendUser.username || 'Unknown User';

  return {
    id: backendUser.id || backendUser.user_id,
    username: backendUser.username,
    email: backendUser.email,
    firstName: firstName,
    middleName: backendUser.middleName || backendUser.middle_and_other_name || '',
    lastName: lastName,
    name: fullName, // Add computed full name for easier display
    role: backendUser.role || backendUser.role_name || roleMap[backendUser.roleId || backendUser.role_id] || 'user',
    roleName: backendUser.roleName || backendUser.role_name || backendUser.role || roleMap[backendUser.roleId || backendUser.role_id] || 'user',
    roleId: backendUser.roleId || backendUser.role_id,
    status: backendUser.status || 'active',
    isVerified: backendUser.isVerified || backendUser.is_verified || false,
    createdAt: backendUser.createdAt || backendUser.created_at,
    updatedAt: backendUser.updatedAt || backendUser.updated_at
  }
}

/**
 * Transform frontend user data to backend format
 */
export const transformUserToBackend = (frontendUser) => {
  if (!frontendUser) return null

  // Map role name to roleId
  const roleMap = {
    admin: 1,
    manager: 2,
    user: 3
  }

  const backendUser = {
    username: frontendUser.username,
    email: frontendUser.email,
    firstName: frontendUser.firstName,
    lastName: frontendUser.lastName,
    roleId: roleMap[frontendUser.role] || 3
  }

  // Add middleName if provided
  if (frontendUser.middleName) {
    backendUser.middleName = frontendUser.middleName
  }

  // Add password if provided (for creation)
  if (frontendUser.password) {
    backendUser.password = frontendUser.password
  }

  return backendUser
}

/**
 * Transform backend task data to frontend format
 */
export const transformTaskFromBackend = (backendTask) => {
  if (!backendTask) return null

  // Map backend status to frontend status
  const statusMap = {
    'pending': 'pending',
    'inprogress': 'in_progress', // Backend uses 'inprogress', frontend uses 'in_progress'
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'archived': 'archived'
  }

  // Map backend priority to frontend priority (backend uses integers)
  const priorityMap = {
    1: 'low',
    2: 'medium',
    3: 'high',
    4: 'urgent'
  }

  // Transform assigned users to ensure proper display
  const assignedUsers = (backendTask.assignedUsers || []).map(user => {
    if (typeof user === 'object' && user !== null) {
      return transformUserFromBackend(user);
    }
    return user; // If it's just an ID, keep it as is
  });

  // Create proper display names for assigned users
  const assignedUserNames = assignedUsers.map(user => {
    if (typeof user === 'object' && user !== null) {
      return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Unknown';
    }
    return 'Unknown';
  }).filter(name => name !== 'Unknown');

  return {
    id: backendTask.id || backendTask.task_id,
    title: backendTask.title,
    description: backendTask.description || '',
    status: statusMap[backendTask.status] || backendTask.status,
    priority: priorityMap[backendTask.priority] || backendTask.priority || 'medium',
    deadline: backendTask.deadline,
    dueDate: backendTask.deadline, // alias for compatibility
    createdAt: backendTask.createdAt || backendTask.created_at,
    updatedAt: backendTask.updatedAt || backendTask.updated_at,
    createdBy: backendTask.createdBy || backendTask.created_by,
    assignedUsers: assignedUsers,
    // Computed properties for easier frontend use
    assignedTo: assignedUsers[0],
    assignedToName: assignedUserNames.length > 0 ?
      assignedUserNames.join(', ') :
      'Unassigned',
    createdByName: backendTask.creator ?
      `${backendTask.creator.firstName || backendTask.creator.first_name || ''} ${backendTask.creator.lastName || backendTask.creator.last_name || ''}`.trim() || backendTask.creator.username || 'Unknown' :
      'Unknown'
  }
}

/**
 * Transform frontend task data to backend format
 */
export const transformTaskToBackend = (frontendTask) => {
  if (!frontendTask) return null

  // Map frontend status to backend status
  const statusMap = {
    'pending': 'pending',
    'in_progress': 'inprogress', // Frontend uses 'in_progress', backend uses 'inprogress'
    'completed': 'completed',
    'cancelled': 'cancelled',
    'archived': 'archived'
  }

  // Map frontend priority to backend priority (backend expects integers)
  const priorityMap = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'urgent': 4
  }

  const backendTask = {
    title: frontendTask.title,
    description: frontendTask.description || '',
    priority: priorityMap[frontendTask.priority] || parseInt(frontendTask.priority) || 2,
    deadline: frontendTask.deadline
  }

  // Add status if provided
  if (frontendTask.status) {
    backendTask.status = statusMap[frontendTask.status] || frontendTask.status
  }

  // Handle assigned users
  if (frontendTask.assignedUsers) {
    backendTask.assignedUsers = frontendTask.assignedUsers
  } else if (frontendTask.assignedTo) {
    backendTask.assignedUsers = [frontendTask.assignedTo]
  }

  return backendTask
}

/**
 * Transform backend API response to standardized format
 */
export const transformApiResponse = (response) => {
  if (!response?.data) return response

  const { success, data, message, error, code } = response.data

  return {
    success: success || false,
    data: data || null,
    message: message || '',
    error: error || '',
    code: code || '',
    originalResponse: response
  }
}

/**
 * Transform backend error to user-friendly message
 */
export const transformErrorMessage = (error) => {
  if (!error?.response?.data) {
    return error.message || 'An unexpected error occurred'
  }

  const { code, message, details, error: errorMsg } = error.response.data

  // Handle specific error codes
  switch (code) {
    case 'VALIDATION_ERROR':
      return details?.join(', ') || 'Validation failed'
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password'
    case 'USER_NOT_FOUND':
      return 'User not found'
    case 'TASK_NOT_FOUND':
      return 'Task not found'
    case 'UNAUTHORIZED':
      return 'You are not authorized to perform this action'
    case 'FORBIDDEN':
      return 'Access denied'
    default:
      return message || errorMsg || 'An error occurred'
  }
}

/**
 * Get priority label from priority number
 */
export const getPriorityLabel = (priority) => {
  const priorityMap = {
    1: 'Low',
    2: 'Medium', 
    3: 'High',
    4: 'Urgent',
    5: 'Critical'
  }
  return priorityMap[priority] || 'Unknown'
}

/**
 * Get status label with proper formatting
 */
export const getStatusLabel = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'in_progress': 'In Progress',
    'inprogress': 'In Progress', // Backend uses 'inprogress'
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'archived': 'Archived'
  }
  return statusMap[status] || status
}

/**
 * Safely extract data from API response
 */
export const extractResponseData = (response) => {
  if (!response || !response.data) return null

  // Handle different response formats
  if (response.data.success && response.data.data) {
    return response.data.data
  }

  if (response.data.data) {
    return response.data.data
  }

  return response.data
}

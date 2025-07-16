/**
 * API Service
 * Centralized API communication service with request/response interceptors
 */

import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    try {
      // Get token directly from localStorage to avoid circular dependencies
      const token = localStorage.getItem('accessToken')

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      // Handle case where localStorage is not available
      console.warn('Could not get auth token:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling with token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle network errors
    if (!error.response) {
      error.code = 'NETWORK_ERROR'
      return Promise.reject(error)
    }

    const { status, data } = error.response

    // Handle authentication errors with token refresh
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Check if it's a token expiration error
      if (data?.code === 'TOKEN_EXPIRED') {
        try {
          // Import auth service dynamically to avoid circular dependency
          const authService = (await import('@/services/auth')).default
          await authService.refreshAccessToken()

          // Retry the original request with new token
          const token = authService.getToken()
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, let the error bubble up
          console.error('Token refresh failed:', refreshError)
        }
      }
    }

    // Add error classification for better handling
    switch (status) {
      case 400:
        if (data?.code === 'VALIDATION_ERROR') {
          error.type = 'VALIDATION_ERROR'
        }
        break
      case 401:
        error.type = 'AUTH_ERROR'
        break
      case 403:
        error.type = 'PERMISSION_ERROR'
        break
      case 404:
        error.type = 'NOT_FOUND_ERROR'
        break
      case 429:
        error.type = 'RATE_LIMIT_ERROR'
        break
      case 500:
      case 502:
      case 503:
      case 504:
        error.type = 'SERVER_ERROR'
        break
      default:
        error.type = 'UNKNOWN_ERROR'
    }

    return Promise.reject(error)
  }
)

// API methods
export const apiService = {
  // Generic methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // Authentication
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
    me: () => api.get('/auth/me'),
    verify: (token) => api.post('/auth/verify', { token }),
    verifyEmail: (email) => api.post('/auth/resend-verification', { email }),
    resendVerification: (email) => api.post('/auth/resend-verification', { email })
  },
  
  // Users
  users: {
    getAll: (params = {}) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (userData) => {
      // Map frontend role names to backend roleId
      const roleMap = { admin: 1, manager: 2, user: 3 }
      const backendData = {
        ...userData,
        roleId: roleMap[userData.role] || 3 // default to user
      }
      delete backendData.role
      delete backendData.status // backend doesn't use status in create
      return api.post('/users', backendData)
    },
    update: (id, userData) => {
      // Map frontend role names to backend roleId
      const roleMap = { admin: 1, manager: 2, user: 3 }
      const backendData = {
        ...userData,
        roleId: roleMap[userData.role] || userData.roleId
      }
      delete backendData.role
      delete backendData.status // backend doesn't use status in update
      return api.patch(`/users/${id}`, backendData)
    },
    delete: (id) => api.delete(`/users/${id}`),
    isUsernameTaken: (username) => api.get(`/users/check-username`, { params: { username } }),
    changePassword: (id, passwordData) => api.patch(`/users/${id}/password`, passwordData)
  },
  
  // Tasks
  tasks: {
    getAll: (params = {}) => api.get('/tasks', { params }),
    getById: (id) => api.get(`/tasks/${id}`),
    create: (taskData) => {
      // Map frontend priority strings to backend integers
      const priorityMap = {
        'low': 1,
        'medium': 2,
        'high': 3,
        'urgent': 4
      }

      // Map frontend data to backend structure
      const backendData = {
        title: taskData.title,
        description: taskData.description || '',
        priority: priorityMap[taskData.priority] || parseInt(taskData.priority) || 2, // Default to medium
        deadline: taskData.deadline || taskData.dueDate,
        assignedUsers: taskData.assignedUsers || (taskData.assignedTo ? [taskData.assignedTo] : [])
      }

      console.log('API: Creating task with backend data:', backendData)
      return api.post('/tasks', backendData)
    },
    update: (id, taskData) => {
      // Map frontend priority strings to backend integers
      const priorityMap = {
        'low': 1,
        'medium': 2,
        'high': 3,
        'urgent': 4
      }

      // Map frontend data to backend structure
      const backendData = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority ? (priorityMap[taskData.priority] || parseInt(taskData.priority)) : undefined,
        status: taskData.status,
        deadline: taskData.deadline || taskData.dueDate,
        assignedUsers: taskData.assignedUsers || (taskData.assignedTo ? [taskData.assignedTo] : undefined)
      }

      // Remove undefined values
      Object.keys(backendData).forEach(key => backendData[key] === undefined && delete backendData[key])

      console.log('API: Updating task with backend data:', backendData)
      return api.patch(`/tasks/${id}`, backendData)
    },
    delete: (id) => api.delete(`/tasks/${id}`),
    updateStatus: (id, status) => {
      // Map frontend status to backend status
      const statusMap = {
        'pending': 'pending',
        'in_progress': 'inprogress',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'archived': 'archived'
      }
      return api.patch(`/tasks/${id}/status`, { status: statusMap[status] || status })
    },
    assign: (id, userId) => api.post(`/tasks/${id}/assign`, { userId }),
    unassign: (id) => api.delete(`/tasks/${id}/assign`),
    getStats: () => api.get('/tasks/stats')
  },

  // Dashboard
  dashboard: {
    getStats: () => api.get('/dashboard/stats'),
    getRecentTasks: (params = {}) => api.get('/dashboard/recent-tasks', { params })
  }
}

export { api }
export default apiService

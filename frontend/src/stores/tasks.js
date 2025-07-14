/**
 * Pinia Tasks Store
 * Manages task-related state and actions
 */

import { defineStore } from 'pinia'
import { apiService } from '@/services/api'
import taskService from '@/services/tasks'
import { withErrorHandling } from '@/utils/errorHandler'
import { useAuthStore } from '@/stores/auth'
import { transformTaskFromBackend, transformTaskToBackend, extractResponseData } from '@/utils/dataTransforms'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    currentTask: null,
    totalTasks: 0,
    loading: false,
    error: null,
    filters: {
      status: '',
      priority: '',
      assignedTo: '',
      search: ''
    },
    stats: {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      cancelledTasks: 0,
      overdueTasks: 0,
      highPriorityTasks: 0
    }
  }),

  getters: {
    /**
     * Get filtered tasks based on current filters
     */
    filteredTasks: (state) => {
      let filtered = state.tasks

      if (state.filters.status) {
        filtered = filtered.filter(task => task.status === state.filters.status)
      }

      if (state.filters.priority) {
        filtered = filtered.filter(task => task.priority === state.filters.priority)
      }

      if (state.filters.assignedTo) {
        if (state.filters.assignedTo === 'me') {
          // This would need to be compared with current user ID
          filtered = filtered.filter(task => task.assignedToMe)
        } else {
          filtered = filtered.filter(task => task.assignedTo === state.filters.assignedTo)
        }
      }

      if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase()
        filtered = filtered.filter(task => 
          task.title.toLowerCase().includes(searchTerm) ||
          task.description.toLowerCase().includes(searchTerm)
        )
      }

      return filtered
    },

    /**
     * Get tasks by status
     */
    tasksByStatus: (state) => (status) => {
      return state.tasks.filter(task => task.status === status)
    },

    /**
     * Get tasks by priority
     */
    tasksByPriority: (state) => (priority) => {
      return state.tasks.filter(task => task.priority === priority)
    },

    /**
     * Get overdue tasks
     */
    overdueTasks: (state) => {
      const now = new Date()
      return state.tasks.filter(task => 
        task.deadline && 
        new Date(task.deadline) < now && 
        task.status !== 'completed'
      )
    },

    /**
     * Get my tasks (assigned to current user)
     */
    myTasks: (state) => {
      return state.tasks.filter(task => task.assignedToMe)
    }
  },

  actions: {
    /**
     * Fetch all tasks
     */
    async fetchTasks(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await apiService.tasks.getAll(params)
        const rawTasks = extractResponseData(response) || response.data.tasks || response.data
        this.tasks = Array.isArray(rawTasks) ? rawTasks.map(transformTaskFromBackend) : []
        this.totalTasks = this.tasks.length
        return this.tasks
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch task by ID
     */
    async fetchTask(id) {
      this.loading = true
      this.error = null

      try {
        const response = await apiService.tasks.getById(id)
        const rawTask = extractResponseData(response) || response.data
        this.currentTask = transformTaskFromBackend(rawTask)
        return this.currentTask
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Load tasks (alias for fetchTasks for component compatibility)
     */
    async loadTasks(params = {}) {
      return this.fetchTasks(params)
    },

    /**
     * Load task (alias for fetchTask for component compatibility)
     */
    async loadTask(id) {
      return this.fetchTask(id)
    },

    /**
     * Create new task
     */
    async createTask(taskData) {
      this.loading = true
      this.error = null

      try {
        const response = await apiService.tasks.create(taskData)
        const newTask = response.data
        this.tasks.unshift(newTask)
        return newTask
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Update task
     */
    async updateTask(id, taskData) {
      this.loading = true
      this.error = null

      try {
        const response = await apiService.tasks.update(id, taskData)
        const updatedTask = response.data
        
        // Update in tasks array
        const index = this.tasks.findIndex(task => task.id === id)
        if (index !== -1) {
          this.tasks[index] = updatedTask
        }
        
        // Update current task if it's the same
        if (this.currentTask?.id === id) {
          this.currentTask = updatedTask
        }
        
        return updatedTask
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete task
     */
    async deleteTask(id) {
      this.loading = true
      this.error = null

      try {
        await apiService.tasks.delete(id)
        
        // Remove from tasks array
        this.tasks = this.tasks.filter(task => task.id !== id)
        
        // Clear current task if it's the deleted one
        if (this.currentTask?.id === id) {
          this.currentTask = null
        }
        
        return true
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Update task status
     */
    async updateTaskStatus(id, status) {
      try {
        const response = await apiService.tasks.updateStatus(id, status)
        const updatedTask = response.data
        
        // Update in tasks array
        const index = this.tasks.findIndex(task => task.id === id)
        if (index !== -1) {
          this.tasks[index] = { ...this.tasks[index], status }
        }
        
        // Update current task if it's the same
        if (this.currentTask?.id === id) {
          this.currentTask = { ...this.currentTask, status }
        }
        
        return updatedTask
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    /**
     * Assign task to user
     */
    async assignTask(id, userId) {
      try {
        const response = await apiService.tasks.assign(id, userId)
        const updatedTask = response.data
        
        // Update in tasks array
        const index = this.tasks.findIndex(task => task.id === id)
        if (index !== -1) {
          this.tasks[index] = updatedTask
        }
        
        // Update current task if it's the same
        if (this.currentTask?.id === id) {
          this.currentTask = updatedTask
        }
        
        return updatedTask
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    /**
     * Fetch task statistics from dashboard API
     */
    async fetchStats() {
      try {
        const response = await apiService.dashboard.getStats()
        if (response.data.success) {
          this.stats = response.data.data
          return this.stats
        }
        throw new Error(response.data.message || 'Failed to fetch stats')
      } catch (error) {
        this.error = error.message
        // Handle authentication errors
        if (error.response?.status === 401) {
          const authStore = useAuthStore()
          authStore.handleAuthError(error)
        }
        throw error
      }
    },

    /**
     * Fetch recent tasks from dashboard API
     */
    async fetchRecentTasks(limit = 5) {
      try {
        const response = await apiService.dashboard.getRecentTasks({ limit })
        if (response.data.success) {
          // Transform backend data to frontend format
          const recentTasks = response.data.data.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: this.getPriorityName(task.priority),
            deadline: task.deadline,
            createdBy: task.createdBy,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            creator: task.creator,
            assignedUsers: task.assignedUsers || []
          }))
          return recentTasks
        }
        throw new Error(response.data.message || 'Failed to fetch recent tasks')
      } catch (error) {
        this.error = error.message
        // Handle authentication errors
        if (error.response?.status === 401) {
          const authStore = useAuthStore()
          authStore.handleAuthError(error)
        }
        throw error
      }
    },

    /**
     * Helper method to convert priority number to name
     */
    getPriorityName(priority) {
      const priorityMap = {
        1: 'low',
        2: 'medium',
        3: 'medium',
        4: 'high',
        5: 'urgent'
      }
      return priorityMap[priority] || 'medium'
    },

    /**
     * Set filter
     */
    setFilter(key, value) {
      this.filters[key] = value
    },

    /**
     * Reset filters
     */
    resetFilters() {
      this.filters = {
        status: '',
        priority: '',
        assignedTo: '',
        search: ''
      }
    },

    /**
     * Clear error state
     */
    clearError() {
      this.error = null
    },

    /**
     * Clear current task
     */
    clearCurrentTask() {
      this.currentTask = null
    },

    /**
     * Load task statistics
     */
    async loadTaskStats() {
      try {
        const stats = await taskService.getTaskStats()
        this.stats = stats
      } catch (error) {
        console.error('Failed to load task stats:', error)
        // Calculate stats from existing tasks if API fails
        this.calculateStatsFromTasks()
      }
    },

    /**
     * Calculate statistics from current tasks
     */
    calculateStatsFromTasks() {
      const now = new Date()

      this.stats = {
        totalTasks: this.tasks.length,
        pendingTasks: this.tasks.filter(task => task.status === 'pending').length,
        inProgressTasks: this.tasks.filter(task => task.status === 'in_progress').length,
        completedTasks: this.tasks.filter(task => task.status === 'completed').length,
        cancelledTasks: this.tasks.filter(task => task.status === 'cancelled').length,
        overdueTasks: this.tasks.filter(task => {
          if (!task.deadline) return false
          return new Date(task.deadline) < now && task.status !== 'completed'
        }).length,
        highPriorityTasks: this.tasks.filter(task =>
          task.priority === 'high' || task.priority === 'urgent'
        ).length
      }
    },

    /**
     * Update task status with optimistic updates
     */
    async updateTaskStatus(taskId, status) {
      const taskIndex = this.tasks.findIndex(task => task.id === taskId)
      if (taskIndex === -1) return

      const originalStatus = this.tasks[taskIndex].status

      // Optimistic update
      this.tasks[taskIndex].status = status
      this.calculateStatsFromTasks()

      try {
        const updatedTask = await taskService.updateTaskStatus(taskId, status)
        this.tasks[taskIndex] = updatedTask
      } catch (error) {
        // Revert on error
        this.tasks[taskIndex].status = originalStatus
        this.calculateStatsFromTasks()
        throw error
      }
    },

    /**
     * Enhanced load tasks with better error handling
     */
    async loadTasks(params = {}) {
      this.loading = true
      this.error = null

      try {
        const result = await taskService.getTasks(params)
        this.tasks = result.tasks
        this.calculateStatsFromTasks()
      } catch (error) {
        this.error = error.message
        console.error('Failed to load tasks:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})

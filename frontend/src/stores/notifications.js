/**
 * Pinia Notifications Store
 * Manages notification state and real-time updates
 */

import { defineStore } from 'pinia'
import { apiService } from '@/services/api'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Get unread notifications
     */
    unreadNotifications: (state) => {
      return state.notifications.filter(notification => !notification.read)
    },

    /**
     * Get read notifications
     */
    readNotifications: (state) => {
      return state.notifications.filter(notification => notification.read)
    },

    /**
     * Get notifications by type
     */
    notificationsByType: (state) => (type) => {
      return state.notifications.filter(notification => notification.type === type)
    },

    /**
     * Check if there are unread notifications
     */
    hasUnreadNotifications: (state) => {
      return state.unreadCount > 0
    }
  },

  actions: {
    /**
     * Fetch all notifications
     */
    async fetchNotifications(params = {}) {
      this.loading = true
      this.error = null

      try {
        const response = await apiService.notifications.getAll(params)
        this.notifications = response.data.notifications || response.data
        this.updateUnreadCount()
        return this.notifications
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * Mark notification as read
     */
    async markAsRead(id) {
      try {
        await apiService.notifications.markAsRead(id)
        
        // Update local state
        const notification = this.notifications.find(n => n.id === id)
        if (notification && !notification.read) {
          notification.read = true
          this.updateUnreadCount()
        }
        
        return true
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
      try {
        await apiService.notifications.markAllAsRead()
        
        // Update local state
        this.notifications.forEach(notification => {
          notification.read = true
        })
        this.unreadCount = 0
        
        return true
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    /**
     * Delete notification
     */
    async deleteNotification(id) {
      try {
        await apiService.notifications.delete(id)
        
        // Remove from local state
        const index = this.notifications.findIndex(n => n.id === id)
        if (index !== -1) {
          const wasUnread = !this.notifications[index].read
          this.notifications.splice(index, 1)
          
          if (wasUnread) {
            this.updateUnreadCount()
          }
        }
        
        return true
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    /**
     * Add new notification (for real-time updates)
     */
    addNotification(notification) {
      this.notifications.unshift(notification)
      this.updateUnreadCount()
    },

    /**
     * Update unread count
     */
    updateUnreadCount() {
      this.unreadCount = this.notifications.filter(n => !n.read).length
    },

    /**
     * Clear error state
     */
    clearError() {
      this.error = null
    },

    /**
     * Clear all notifications
     */
    clearNotifications() {
      this.notifications = []
      this.unreadCount = 0
    },

    /**
     * Show browser notification (if permission granted)
     */
    showBrowserNotification(title, options = {}) {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        })

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)

        return notification
      }
    },

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      }
      return false
    }
  }
})

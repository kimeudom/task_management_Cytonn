/**
 * Pinia Authentication Store
 * Manages authentication state and actions
 */

import { defineStore } from 'pinia';
import authService from '@/services/auth.js';
import { transformUserFromBackend } from '@/utils/dataTransforms';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: authService.getUser(),
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null,
    emailVerification: {
      loading: false,
      error: null,
      success: false,
      message: '',
      pendingEmail: null
    }
  }),

  getters: {
    /**
     * Get authentication token
     */
    token: () => authService.getToken(),

    /**
     * Get user's full name
     */
    userFullName: (state) => {
      if (!state.user) return '';
      const { firstName, lastName } = state.user;
      return [firstName, lastName].filter(Boolean).join(' ');
    },

    /**
     * Get user's role name
     */
    userRole: (state) => state.user?.role || state.user?.roleName || '',

    /**
     * Check if user is admin
     */
    isAdmin: (state) => {
      const role = (state.user?.role || state.user?.roleName || '').toLowerCase();
      return role === 'admin';
    },

    /**
     * Check if user is manager
     */
    isManager: (state) => {
      const role = (state.user?.role || state.user?.roleName || '').toLowerCase();
      return role === 'manager';
    },

    /**
     * Check if user is regular user
     */
    isUser: (state) => {
      const role = (state.user?.role || state.user?.roleName || '').toLowerCase();
      return role === 'user';
    },

    /**
     * Check if user is manager or admin
     */
    isManagerOrAdmin: (state) => {
      const role = (state.user?.role || state.user?.roleName || '').toLowerCase();
      return role === 'admin' || role === 'manager';
    },

    /**
     * Check if user email is verified
     */
    isEmailVerified: (state) => {
      return state.user?.isVerified || false;
    },

    /**
     * Get email verification loading state
     */
    isEmailVerificationLoading: (state) => {
      return state.emailVerification.loading;
    },

    /**
     * Get email verification error
     */
    emailVerificationError: (state) => {
      return state.emailVerification.error;
    },

    /**
     * Get email verification success state
     */
    emailVerificationSuccess: (state) => {
      return state.emailVerification.success;
    },

    /**
     * Get email verification message
     */
    emailVerificationMessage: (state) => {
      return state.emailVerification.message;
    },

    /**
     * Get pending verification email
     */
    pendingVerificationEmail: (state) => {
      return state.emailVerification.pendingEmail;
    }
  },

  actions: {
    /**
     * Login user
     */
    async login(email, password) {
      this.loading = true;
      this.error = null;

      try {
        const user = await authService.login(email, password);
        // Transform backend user data to frontend format
        this.user = transformUserFromBackend(user);
        this.isAuthenticated = true;

        // Clear any pending email verification
        this.clearEmailVerification();

        return this.user;
      } catch (error) {
        // Handle email verification error specially
        if (error.code === 'EMAIL_NOT_VERIFIED') {
          this.emailVerification.pendingEmail = error.email || email;
          this.emailVerification.error = error.message;
        } else {
          this.error = error.message;
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Register new user
     */
    async register(userData) {
      this.loading = true;
      this.error = null;

      try {
        const result = await authService.register(userData);

        // With email verification, we don't auto-login
        // Store the email for verification flow
        this.emailVerification.pendingEmail = userData.email;
        this.emailVerification.success = true;
        this.emailVerification.message = result.message;

        return result;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logout user
     */
    async logout() {
      this.loading = true;

      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.user = null;
        this.isAuthenticated = false;
        this.loading = false;
        this.error = null;
      }
    },

    /**
     * Refresh user data
     */
    async refreshUser() {
      if (!this.isAuthenticated) return;

      try {
        const user = await authService.getCurrentUser();
        this.user = user;
      } catch (error) {
        console.error('Failed to refresh user:', error);
        // If refresh fails, logout user
        await this.logout();
      }
    },

    /**
     * Verify authentication status (optimized to reduce API calls)
     */
    async verifyAuth() {
      if (!authService.isAuthenticated()) {
        this.user = null;
        this.isAuthenticated = false;
        return false;
      }

      // If we already have a valid user and token, don't make unnecessary API calls
      if (this.user && this.isAuthenticated && authService.getAccessToken()) {
        return true;
      }

      try {
        // Get user data from auth service without making API calls
        const user = authService.getUser();
        if (user) {
          this.user = user;
          this.isAuthenticated = true;
          return true;
        }

        // Only make API call if we don't have user data
        const isValid = await authService.validateSession();
        if (!isValid) {
          await this.logout();
          return false;
        }

        // Update user data from auth service
        this.user = authService.getUser();
        this.isAuthenticated = true;
        return true;
      } catch (error) {
        console.error('Auth verification error:', error);
        await this.logout();
        return false;
      }
    },

    /**
     * Initialize auth state on app start
     */
    async initialize() {
      this.loading = true;

      try {
        if (authService.isAuthenticated()) {
          const isValid = await this.verifyAuth();
          if (isValid) {
            this.user = authService.getUser();
            this.isAuthenticated = true;
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await this.logout();
      } finally {
        this.loading = false;
      }
    },

    /**
     * Verify email with token
     */
    async verifyEmail(token) {
      this.emailVerification.loading = true;
      this.emailVerification.error = null;

      try {
        const result = await authService.verifyEmail(token);

        // Email verified successfully
        this.emailVerification.success = true;
        this.emailVerification.message = result.message;
        this.emailVerification.pendingEmail = null;

        // Update current user's verification status if they're logged in
        if (this.isAuthenticated && this.user && result.user) {
          // Transform and update user data
          this.user = transformUserFromBackend(result.user);
        }

        return result;
      } catch (error) {
        this.emailVerification.error = error.message;
        this.emailVerification.success = false;
        throw error;
      } finally {
        this.emailVerification.loading = false;
      }
    },

    /**
     * Resend verification email
     */
    async resendVerificationEmail(email) {
      this.emailVerification.loading = true;
      this.emailVerification.error = null;

      try {
        const result = await authService.resendVerificationEmail(email);

        this.emailVerification.success = true;
        this.emailVerification.message = result.message;
        this.emailVerification.pendingEmail = email;

        return result;
      } catch (error) {
        this.emailVerification.error = error.message;
        this.emailVerification.success = false;
        throw error;
      } finally {
        this.emailVerification.loading = false;
      }
    },

    /**
     * Clear email verification state
     */
    clearEmailVerification() {
      this.emailVerification.loading = false;
      this.emailVerification.error = null;
      this.emailVerification.success = false;
      this.emailVerification.message = '';
      this.emailVerification.pendingEmail = null;
    },

    /**
     * Clear error state
     */
    clearError() {
      this.error = null;
      this.emailVerification.error = null;
    },

    /**
     * Check if user has required role
     */
    hasRole(requiredRole) {
      return authService.hasRole(requiredRole);
    },

    /**
     * Handle authentication errors
     */
    handleAuthError(error) {
      const authError = authService.handleAuthError(error);
      this.error = authError.message;

      // Handle specific error types
      if (error.response?.data?.code === 'TOKEN_BLACKLISTED' ||
          error.response?.data?.code === 'TOKEN_EXPIRED') {
        this.logout();
      }

      return authError;
    },

    /**
     * Force logout and redirect
     */
    forceLogout() {
      authService.forceLogout();
      this.user = null;
      this.isAuthenticated = false;
      this.error = null;
    },

    /**
     * Check if user can perform action based on role
     */
    canPerformAction(action, resource = null) {
      if (!this.isAuthenticated) return false;

      const userRole = this.userRole.toLowerCase();

      // Admin can do everything
      if (userRole === 'admin') return true;

      // Define role-based permissions
      const permissions = {
        manager: {
          users: ['read'],
          tasks: ['create', 'read', 'update', 'delete', 'assign'],
          dashboard: ['read']
        },
        user: {
          tasks: ['read', 'update_status'],
          dashboard: ['read'],
          profile: ['read', 'update']
        }
      };

      const rolePermissions = permissions[userRole];
      if (!rolePermissions) return false;

      if (resource) {
        return rolePermissions[resource]?.includes(action) || false;
      }

      // Check if action is allowed for any resource
      return Object.values(rolePermissions).some(actions => actions.includes(action));
    }
  }
});

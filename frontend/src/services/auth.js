/**
 * Authentication Service for Vue.js Frontend
 * Handles JWT authentication with automatic token refresh
 */

import { api } from './api.js';

class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');

    // Don't setup interceptors here - they're handled by api.js
    // This prevents duplicate interceptors that can cause infinite loops
  }

  /**
   * Login user with email and password
   */
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { user, tokens } = response.data.data;
        this.setAuthData(user, tokens.accessToken, tokens.refreshToken);
        return user;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle specific error codes from backend
      if (error.response?.data?.code === 'INVALID_CREDENTIALS') {
        throw new Error('Invalid email or password');
      } else if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        // Return special error object for email verification
        const verificationError = new Error('Email verification required. Please verify your email address before logging in.');
        verificationError.code = 'EMAIL_NOT_VERIFIED';
        verificationError.email = error.response.data.data?.email;
        throw verificationError;
      } else if (error.response?.data?.code === 'VALIDATION_ERROR') {
        throw new Error(error.response.data.details?.join(', ') || 'Validation failed');
      }
      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        // With email verification, we don't auto-login after registration
        return {
          user: response.data.data.user,
          emailSent: response.data.data.emailSent,
          message: response.data.message
        };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      const details = error.response?.data?.details;

      if (details && Array.isArray(details)) {
        throw new Error(details.join(', '));
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post('/auth/refresh', {
        refreshToken: this.refreshToken
      });

      if (response.data.success) {
        this.accessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', this.accessToken);
        return this.accessToken;
      } else {
        throw new Error(response.data.error || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);

      // Handle specific refresh token errors
      if (error.response?.data?.code === 'REFRESH_TOKEN_EXPIRED') {
        this.clearAuthData();
        throw new Error('Session expired. Please login again.');
      } else if (error.response?.data?.code === 'INVALID_REFRESH_TOKEN') {
        this.clearAuthData();
        throw new Error('Invalid session. Please login again.');
      }

      this.clearAuthData();
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      if (this.accessToken) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    try {
      const response = await api.post('/auth/verify-email', {
        token
      });

      if (response.data.success) {
        return {
          user: response.data.data.user,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.error || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);

      // Handle specific error codes
      if (error.response?.data?.code === 'INVALID_TOKEN') {
        throw new Error('Invalid verification link. Please request a new verification email.');
      } else if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        throw new Error('Verification link has expired. Please request a new verification email.');
      } else if (error.response?.data?.code === 'TOKEN_USED') {
        throw new Error('This verification link has already been used.');
      } else if (error.response?.data?.code === 'USER_NOT_FOUND') {
        throw new Error('User account not found.');
      }

      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Email verification failed');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    try {
      const response = await api.post('/auth/resend-verification', {
        email
      });

      if (response.data.success) {
        return {
          message: response.data.message,
          emailSent: response.data.data.emailSent
        };
      } else {
        throw new Error(response.data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);

      // Handle specific error codes
      if (error.response?.data?.code === 'USER_NOT_FOUND') {
        throw new Error('No account found with this email address.');
      } else if (error.response?.data?.code === 'ALREADY_VERIFIED') {
        throw new Error('This email address is already verified.');
      } else if (error.response?.data?.code === 'EMAIL_SEND_FAILED') {
        throw new Error('Failed to send verification email. Please try again later.');
      }

      throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to resend verification email');
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');

      if (response.data.success) {
        this.user = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return this.user;
      }
    } catch (error) {
      throw new Error('Failed to get user info');
    }
  }

  /**
   * Verify if token is valid
   */
  async verifyToken() {
    if (!this.accessToken) return false;

    try {
      const response = await api.post('/auth/verify', {
        token: this.accessToken
      });

      if (response.data.success) {
        // Update user data if token is valid
        this.user = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(this.user));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token verification error:', error);

      // Handle specific verification errors
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        // Try to refresh token automatically
        try {
          await this.refreshAccessToken();
          return true;
        } catch (refreshError) {
          return false;
        }
      } else if (error.response?.data?.code === 'TOKEN_BLACKLISTED') {
        // Token was blacklisted, clear auth data
        this.clearAuthData();
        return false;
      }

      return false;
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(requiredRole) {
    if (!this.user) return false;

    // Check both role and roleName properties for compatibility
    const userRole = (this.user.role || this.user.roleName || '').toLowerCase();
    const required = requiredRole.toLowerCase();

    // Admin has access to everything
    if (userRole === 'admin') return true;

    // Manager has access to manager and user routes
    if (userRole === 'manager' && (required === 'manager' || required === 'user')) {
      return true;
    }

    // Exact role match
    return userRole === required;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Check if user is manager or admin
   */
  isManagerOrAdmin() {
    return this.hasRole('admin') || this.hasRole('manager');
  }

  /**
   * Get current access token
   */
  getToken() {
    return this.accessToken;
  }

  /**
   * Set authentication data
   */
  setAuthData(user, accessToken, refreshToken) {
    this.user = user;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Clear authentication data
   */
  clearAuthData() {
    this.user = null;
    this.accessToken = null;
    this.refreshToken = null;
    
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.accessToken && !!this.user;
  }

  /**
   * Get user info
   */
  getUser() {
    return this.user;
  }

  /**
   * Get access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Initialize auth service - load tokens from localStorage
   */
  initialize() {
    try {
      const user = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (user && accessToken && refreshToken) {
        this.user = JSON.parse(user);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
      this.clearAuthData();
    }
  }

  /**
   * Handle authentication errors with specific error codes
   */
  handleAuthError(error) {
    if (!error.response?.data) {
      return new Error(error.message || 'Authentication failed');
    }

    const { code, error: errorMsg, message, details } = error.response.data;

    switch (code) {
      case 'TOKEN_MISSING':
        return new Error('Authentication required');
      case 'TOKEN_EXPIRED':
        return new Error('Session expired');
      case 'TOKEN_INVALID':
        return new Error('Invalid authentication token');
      case 'TOKEN_BLACKLISTED':
        return new Error('Session has been invalidated');
      case 'INVALID_TOKEN_TYPE':
        return new Error('Invalid token type');
      case 'USER_NOT_FOUND':
        return new Error('User account not found');
      case 'INVALID_CREDENTIALS':
        return new Error('Invalid email or password');
      case 'EMAIL_NOT_VERIFIED':
        const emailError = new Error('Email verification required. Please verify your email address before logging in.');
        emailError.code = 'EMAIL_NOT_VERIFIED';
        emailError.email = error.response.data.data?.email;
        return emailError;
      case 'VALIDATION_ERROR':
        return new Error(details?.join(', ') || 'Validation failed');
      case 'INSUFFICIENT_PERMISSIONS':
        return new Error('You do not have permission to perform this action');
      case 'AUTH_REQUIRED':
        return new Error('Authentication required');
      default:
        return new Error(errorMsg || message || 'Authentication failed');
    }
  }

  /**
   * Check if current session is valid
   */
  async validateSession() {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      const isValid = await this.verifyToken();
      if (!isValid) {
        this.clearAuthData();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      this.clearAuthData();
      return false;
    }
  }

  /**
   * Force logout (clear all auth data)
   */
  forceLogout() {
    this.clearAuthData();
    window.location.href = '/login';
  }
}

// Create singleton instance
const authService = new AuthService();

// Initialize immediately
authService.initialize();

export default authService;

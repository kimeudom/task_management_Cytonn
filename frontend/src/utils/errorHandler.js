/**
 * Comprehensive Error Handling System
 * Provides centralized error handling with user-friendly messages and retry logic
 */

import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'PERMISSION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
}

/**
 * Classify error based on response
 * @param {Error} error - Error object
 * @returns {string} Error type
 */
export function classifyError(error) {
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      return ERROR_TYPES.NETWORK
    }
    return ERROR_TYPES.UNKNOWN
  }

  const { status, data } = error.response

  switch (status) {
    case 400:
      if (data?.code === 'VALIDATION_ERROR') {
        return ERROR_TYPES.VALIDATION
      }
      return ERROR_TYPES.UNKNOWN

    case 401:
      return ERROR_TYPES.AUTHENTICATION

    case 403:
      return ERROR_TYPES.AUTHORIZATION

    case 404:
      return ERROR_TYPES.NOT_FOUND

    case 429:
      return ERROR_TYPES.RATE_LIMIT

    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_TYPES.SERVER

    default:
      return ERROR_TYPES.UNKNOWN
  }
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(error, context = '') {
  const errorType = classifyError(error)
  const contextPrefix = context ? `${context}: ` : ''

  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return `${contextPrefix}Network connection failed. Please check your internet connection and try again.`

    case ERROR_TYPES.AUTHENTICATION:
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        return 'Your session has expired. Please log in again.'
      }
      if (error.response?.data?.code === 'INVALID_CREDENTIALS') {
        return 'Invalid email or password. Please try again.'
      }
      return `${contextPrefix}Authentication failed. Please log in again.`

    case ERROR_TYPES.AUTHORIZATION:
      return `${contextPrefix}You don't have permission to perform this action.`

    case ERROR_TYPES.VALIDATION:
      const details = error.response?.data?.details
      if (details && Array.isArray(details)) {
        return `${contextPrefix}${details.join(', ')}`
      }
      return `${contextPrefix}Please check your input and try again.`

    case ERROR_TYPES.NOT_FOUND:
      return `${contextPrefix}The requested resource was not found.`

    case ERROR_TYPES.RATE_LIMIT:
      return `${contextPrefix}Too many requests. Please wait a moment and try again.`

    case ERROR_TYPES.SERVER:
      return `${contextPrefix}Server error. Please try again later.`

    default:
      return error.response?.data?.error || 
             error.response?.data?.message || 
             error.message || 
             `${contextPrefix}An unexpected error occurred.`
  }
}

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} Whether error can be retried
 */
export function isRetryableError(error) {
  const errorType = classifyError(error)
  
  return [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.SERVER,
    ERROR_TYPES.RATE_LIMIT
  ].includes(errorType)
}

/**
 * Calculate retry delay with exponential backoff
 * @param {number} attempt - Current attempt number (0-based)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
export function calculateRetryDelay(attempt, config = RETRY_CONFIG) {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt)
  return Math.min(delay, config.maxDelay)
}

/**
 * Sleep for specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise} Promise that resolves with function result
 */
export async function withRetry(fn, config = RETRY_CONFIG) {
  let lastError

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on last attempt or non-retryable errors
      if (attempt === config.maxRetries || !isRetryableError(error)) {
        break
      }

      // Wait before retrying
      const delay = calculateRetryDelay(attempt, config)
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Enhanced error handler with toast notifications
 * @param {Error} error - Error object
 * @param {Object} options - Handler options
 */
export function handleError(error, options = {}) {
  const {
    context = '',
    showToast = true,
    logError = true,
    redirectOnAuth = true
  } = options

  const errorType = classifyError(error)
  const message = getUserFriendlyMessage(error, context)

  // Log error for debugging
  if (logError) {
    console.error(`[${errorType}] ${context}:`, error)
  }

  // Show toast notification
  if (showToast) {
    const toast = useToast()
    
    switch (errorType) {
      case ERROR_TYPES.AUTHENTICATION:
        toast.error(message)
        if (redirectOnAuth) {
          const authStore = useAuthStore()
          authStore.logout()
          window.location.href = '/login'
        }
        break

      case ERROR_TYPES.AUTHORIZATION:
        toast.warning(message)
        break

      case ERROR_TYPES.VALIDATION:
        toast.warning(message)
        break

      case ERROR_TYPES.NETWORK:
      case ERROR_TYPES.SERVER:
        toast.error(message)
        break

      case ERROR_TYPES.RATE_LIMIT:
        toast.warning(message)
        break

      default:
        toast.error(message)
    }
  }

  return {
    type: errorType,
    message,
    originalError: error
  }
}

/**
 * Create error handler for specific context
 * @param {string} context - Context name
 * @param {Object} defaultOptions - Default options
 * @returns {Function} Context-specific error handler
 */
export function createErrorHandler(context, defaultOptions = {}) {
  return (error, options = {}) => {
    return handleError(error, {
      context,
      ...defaultOptions,
      ...options
    })
  }
}

/**
 * Async wrapper with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(asyncFn, options = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      handleError(error, options)
      throw error
    }
  }
}

/**
 * Async wrapper with retry and error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} retryConfig - Retry configuration
 * @param {Object} errorOptions - Error handling options
 * @returns {Function} Wrapped function
 */
export function withRetryAndErrorHandling(asyncFn, retryConfig = RETRY_CONFIG, errorOptions = {}) {
  return async (...args) => {
    try {
      return await withRetry(() => asyncFn(...args), retryConfig)
    } catch (error) {
      handleError(error, errorOptions)
      throw error
    }
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    if (event.reason && typeof event.reason === 'object' && event.reason.response) {
      handleError(event.reason, {
        context: 'Unhandled Promise',
        showToast: true
      })
    }
  })

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    const toast = useToast()
    toast.error('An unexpected error occurred. Please refresh the page.')
  })
}

/**
 * Error boundary for Vue components
 * @param {Object} error - Error object
 * @param {Object} instance - Vue component instance
 * @param {string} info - Error info
 */
export function handleVueError(error, instance, info) {
  console.error('Vue error:', error, info)
  
  const toast = useToast()
  toast.error('A component error occurred. Please refresh the page.')
  
  // You could also send error to monitoring service here
}

export default {
  classifyError,
  getUserFriendlyMessage,
  isRetryableError,
  withRetry,
  handleError,
  createErrorHandler,
  withErrorHandling,
  withRetryAndErrorHandling,
  setupGlobalErrorHandler,
  handleVueError,
  ERROR_TYPES,
  RETRY_CONFIG
}

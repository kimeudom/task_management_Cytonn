/**
 * Vue Router Guards for Authentication and Authorization
 * Provides route protection based on authentication status and user permissions
 */

import { useAuthStore } from '@/stores/auth.js'
import { hasPermission, hasRoleLevel } from '@/utils/permissions'
import { useToast } from 'vue-toastification'

/**
 * Authentication guard - requires user to be logged in and email verified
 */
export const requireAuth = async (to, from, next) => {
  const authStore = useAuthStore();

  // If not authenticated, redirect to login
  if (!authStore.isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  // Only verify auth if we don't have user data or if coming from login
  // This prevents excessive API calls on every navigation
  if (!authStore.user || from.name === 'login') {
    const isValid = await authStore.verifyAuth();
    if (!isValid) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      });
    }
  }

  // Check if email is verified (unless it's an email verification route)
  const emailVerificationRoutes = ['verify-email', 'check-email', 'email-verified'];
  if (!emailVerificationRoutes.includes(to.name) && !authStore.isEmailVerified) {
    return next({
      name: 'check-email',
      query: { email: authStore.user?.email }
    });
  }

  next();
};

/**
 * Guest guard - redirects authenticated users away from auth pages
 */
export const requireGuest = (to, from, next) => {
  const authStore = useAuthStore();

  if (authStore.isAuthenticated) {
    return next({ name: 'dashboard' });
  }

  next();
};

/**
 * Email verification guard - requires user to have verified email
 */
export const requireEmailVerification = async (to, from, next) => {
  const authStore = useAuthStore();

  // First check authentication
  if (!authStore.isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  // Verify token is still valid
  const isValid = await authStore.verifyAuth();
  if (!isValid) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  // Check email verification
  if (!authStore.isEmailVerified) {
    return next({
      name: 'check-email',
      query: { email: authStore.user?.email }
    });
  }

  next();
};

/**
 * Admin guard - requires admin role
 */
export const requireAdmin = async (to, from, next) => {
  const authStore = useAuthStore();

  // First check authentication
  if (!authStore.isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  // Verify token and check admin role
  const isValid = await authStore.verifyAuth();
  if (!isValid) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  if (!authStore.isAdmin) {
    return next({
      name: 'unauthorized',
      query: { message: 'Admin access required' }
    });
  }

  next();
};

/**
 * Manager or Admin guard - requires manager or admin role
 */
export const requireManagerOrAdmin = async (to, from, next) => {
  const authStore = useAuthStore();

  // First check authentication
  if (!authStore.isAuthenticated) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  // Verify token and check role
  const isValid = await authStore.verifyAuth();
  if (!isValid) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  if (!authStore.isManagerOrAdmin) {
    return next({
      name: 'unauthorized',
      query: { message: 'Manager or Admin access required' }
    });
  }

  next();
};

/**
 * Permission guard factory - creates guards for specific permissions
 * @param {string|Array} requiredPermissions - Required permission(s)
 * @returns {Function} Route guard function
 */
export function requirePermission(requiredPermissions) {
  return async (to, from, next) => {
    const authStore = useAuthStore()
    const toast = useToast()

    // First check authentication
    if (!authStore.isAuthenticated) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Verify session
    try {
      const isValid = await authStore.verifyAuth()
      if (!isValid) {
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
        return
      }
    } catch (error) {
      console.error('Auth verification failed:', error)
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Check permissions
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    const hasRequiredPermission = permissions.some(permission =>
      hasPermission(permission, authStore.user)
    )

    if (!hasRequiredPermission) {
      toast.error('You do not have permission to access this page')
      next({
        name: 'unauthorized',
        query: { from: to.fullPath }
      })
      return
    }

    next()
  }
}

/**
 * Role-based guard factory - enhanced version
 */
export const requireRole = (requiredRoles) => {
  return async (to, from, next) => {
    const authStore = useAuthStore()
    const toast = useToast()

    // First check authentication
    if (!authStore.isAuthenticated) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    }

    // Verify token and check role
    const isValid = await authStore.verifyAuth()
    if (!isValid) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    }

    // Check role
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    const userRole = authStore.user?.role?.toLowerCase()

    if (!userRole || !roles.map(r => r.toLowerCase()).includes(userRole)) {
      toast.error('You do not have the required role to access this page')
      next({
        name: 'unauthorized',
        query: { from: to.fullPath }
      })
      return
    }

    next()
  }
}

/**
 * Role level guard factory - creates guards for minimum role levels
 * @param {string} minimumRole - Minimum required role
 * @returns {Function} Route guard function
 */
export function requireRoleLevel(minimumRole) {
  return async (to, from, next) => {
    const authStore = useAuthStore()
    const toast = useToast()

    // First check authentication
    if (!authStore.isAuthenticated) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Verify session
    try {
      const isValid = await authStore.verifyAuth()
      if (!isValid) {
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
        return
      }
    } catch (error) {
      console.error('Auth verification failed:', error)
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // Check role level
    if (!hasRoleLevel(minimumRole, authStore.user)) {
      toast.error('You do not have sufficient privileges to access this page')
      next({
        name: 'unauthorized',
        query: { from: to.fullPath }
      })
      return
    }

    next()
  }
}

/**
 * Route meta-based guard - checks route meta properties
 * @param {Object} to - Target route
 * @param {Object} from - Current route
 * @param {Function} next - Navigation function
 */
export async function metaGuard(to, from, next) {
  const authStore = useAuthStore()
  const toast = useToast()

  // Check if route has meta requirements
  if (!to.meta) {
    next()
    return
  }

  // Check authentication requirement
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      name: 'login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // Check email verification requirement for authenticated users
  if (to.meta.requiresAuth && authStore.isAuthenticated) {
    // Skip verification if we already have valid user data and not coming from login
    // This prevents excessive API calls and potential infinite loops
    if (authStore.user && from.name !== 'login') {
      // Just check email verification without API calls
      const emailVerificationRoutes = ['verify-email', 'check-email', 'email-verified'];
      if (!emailVerificationRoutes.includes(to.name) && !authStore.isEmailVerified) {
        next({
          name: 'check-email',
          query: { email: authStore.user?.email }
        })
        return
      }
    } else {
      // Only verify auth if we don't have user data or coming from login
      try {
        const isValid = await authStore.verifyAuth();
        if (!isValid) {
          next({
            name: 'login',
            query: { redirect: to.fullPath }
          })
          return
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
        return
      }

      const emailVerificationRoutes = ['verify-email', 'check-email', 'email-verified'];
      if (!emailVerificationRoutes.includes(to.name) && !authStore.isEmailVerified) {
        next({
          name: 'check-email',
          query: { email: authStore.user?.email }
        })
        return
      }
    }
  }

  // Check guest requirement (redirect authenticated users)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  // Check permission requirement
  if (to.meta.permission) {
    if (!authStore.isAuthenticated) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    const hasRequiredPermission = Array.isArray(to.meta.permission)
      ? to.meta.permission.some(p => hasPermission(p, authStore.user))
      : hasPermission(to.meta.permission, authStore.user)

    if (!hasRequiredPermission) {
      toast.error('You do not have permission to access this page')
      next({
        name: 'unauthorized',
        query: { from: to.fullPath }
      })
      return
    }
  }

  // Check role requirement
  if (to.meta.role) {
    if (!authStore.isAuthenticated) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }

    const userRole = authStore.user?.role?.toLowerCase()
    const requiredRoles = Array.isArray(to.meta.role) ? to.meta.role : [to.meta.role]

    if (!userRole || !requiredRoles.map(r => r.toLowerCase()).includes(userRole)) {
      toast.error('You do not have the required role to access this page')
      next({
        name: 'unauthorized',
        query: { from: to.fullPath }
      })
      return
    }
  }

  next()
}

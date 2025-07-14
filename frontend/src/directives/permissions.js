/**
 * Vue Directives for Role-Based Access Control
 * Provides v-permission and v-role directives for conditional rendering
 */

import { hasPermission, hasRoleLevel, canViewComponent } from '@/utils/permissions'
import { useAuthStore } from '@/stores/auth'

/**
 * v-permission directive
 * Usage: v-permission="'users.create'" or v-permission="['users.create', 'users.edit']"
 */
export const vPermission = {
  mounted(el, binding) {
    const permissions = binding.value
    const authStore = useAuthStore()
    
    if (!canViewComponent(permissions, authStore.user)) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    }
  },
  
  updated(el, binding) {
    const permissions = binding.value
    const authStore = useAuthStore()
    
    if (!canViewComponent(permissions, authStore.user)) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    } else {
      el.style.display = ''
      el.removeAttribute('data-permission-hidden')
    }
  }
}

/**
 * v-role directive
 * Usage: v-role="'admin'" or v-role="['admin', 'manager']"
 */
export const vRole = {
  mounted(el, binding) {
    const roles = Array.isArray(binding.value) ? binding.value : [binding.value]
    const authStore = useAuthStore()
    const userRole = authStore.user?.role?.toLowerCase()
    
    if (!userRole || !roles.map(r => r.toLowerCase()).includes(userRole)) {
      el.style.display = 'none'
      el.setAttribute('data-role-hidden', 'true')
    }
  },
  
  updated(el, binding) {
    const roles = Array.isArray(binding.value) ? binding.value : [binding.value]
    const authStore = useAuthStore()
    const userRole = authStore.user?.role?.toLowerCase()
    
    if (!userRole || !roles.map(r => r.toLowerCase()).includes(userRole)) {
      el.style.display = 'none'
      el.setAttribute('data-role-hidden', 'true')
    } else {
      el.style.display = ''
      el.removeAttribute('data-role-hidden')
    }
  }
}

/**
 * v-role-level directive
 * Usage: v-role-level="'manager'" (shows for manager and admin)
 */
export const vRoleLevel = {
  mounted(el, binding) {
    const requiredRole = binding.value
    const authStore = useAuthStore()
    
    if (!hasRoleLevel(requiredRole, authStore.user)) {
      el.style.display = 'none'
      el.setAttribute('data-role-level-hidden', 'true')
    }
  },
  
  updated(el, binding) {
    const requiredRole = binding.value
    const authStore = useAuthStore()
    
    if (!hasRoleLevel(requiredRole, authStore.user)) {
      el.style.display = 'none'
      el.setAttribute('data-role-level-hidden', 'true')
    } else {
      el.style.display = ''
      el.removeAttribute('data-role-level-hidden')
    }
  }
}

/**
 * v-auth directive
 * Usage: v-auth (shows only for authenticated users)
 */
export const vAuth = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      el.style.display = 'none'
      el.setAttribute('data-auth-hidden', 'true')
    }
  },
  
  updated(el, binding) {
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      el.style.display = 'none'
      el.setAttribute('data-auth-hidden', 'true')
    } else {
      el.style.display = ''
      el.removeAttribute('data-auth-hidden')
    }
  }
}

/**
 * Install all permission directives
 * @param {Object} app - Vue app instance
 */
export function installPermissionDirectives(app) {
  app.directive('permission', vPermission)
  app.directive('role', vRole)
  app.directive('role-level', vRoleLevel)
  app.directive('auth', vAuth)
}

export default {
  install: installPermissionDirectives
}

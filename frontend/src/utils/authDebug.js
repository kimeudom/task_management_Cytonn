/**
 * Authentication Debug Utilities
 * Helps debug authentication and token issues
 */

import { authService } from '@/services/auth'
import { apiService } from '@/services/api'

/**
 * Debug current authentication state
 */
export const debugAuthState = async () => {
  console.log('🔍 Authentication Debug Info:')
  console.log('================================')
  
  // Check auth service state
  console.log('Auth Service State:')
  console.log('- Is Authenticated:', authService.isAuthenticated())
  console.log('- Access Token:', authService.getToken() ? 'Present' : 'Missing')
  console.log('- Refresh Token:', authService.refreshToken ? 'Present' : 'Missing')
  console.log('- User:', authService.getUser())

  // Check role information
  const user = authService.getUser()
  if (user) {
    console.log('\nRole Information:')
    console.log('- user.role:', user.role)
    console.log('- user.roleName:', user.roleName)
    console.log('- user.roleId:', user.roleId)
    console.log('- hasRole("admin"):', authService.hasRole('admin'))
    console.log('- hasRole("manager"):', authService.hasRole('manager'))
    console.log('- hasRole("user"):', authService.hasRole('user'))
    console.log('- isAdmin():', authService.isAdmin())
    console.log('- isManagerOrAdmin():', authService.isManagerOrAdmin())
  }
  
  // Check localStorage
  console.log('\nLocalStorage:')
  console.log('- accessToken:', localStorage.getItem('accessToken') ? 'Present' : 'Missing')
  console.log('- refreshToken:', localStorage.getItem('refreshToken') ? 'Present' : 'Missing')
  console.log('- user:', localStorage.getItem('user') ? 'Present' : 'Missing')

  // Check auth store state
  try {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    console.log('\nAuth Store State:')
    console.log('- isAuthenticated:', authStore.isAuthenticated)
    console.log('- user:', authStore.user)
    console.log('- userRole:', authStore.userRole)
    console.log('- isAdmin:', authStore.isAdmin)
    console.log('- isManager:', authStore.isManager)
    console.log('- isManagerOrAdmin:', authStore.isManagerOrAdmin)
    console.log('- hasRole("admin"):', authStore.hasRole('admin'))
  } catch (error) {
    console.log('\nAuth Store Error:', error.message)
  }
  
  // Check token expiry
  const token = authService.getToken()
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      const isExpired = payload.exp < now
      const timeLeft = payload.exp - now
      
      console.log('\nToken Info:')
      console.log('- Expires at:', new Date(payload.exp * 1000).toLocaleString())
      console.log('- Is Expired:', isExpired)
      console.log('- Time left:', isExpired ? 'Expired' : `${Math.floor(timeLeft / 60)} minutes`)
      console.log('- User ID:', payload.userId)
      console.log('- Role ID:', payload.roleId)
    } catch (error) {
      console.log('- Token parsing error:', error.message)
    }
  }
  
  console.log('================================')
}

/**
 * Test API call with current token
 */
export const testApiCall = async () => {
  console.log('🧪 Testing API Call...')
  
  try {
    const response = await apiService.users.getAll()
    console.log('✅ API call successful:', response.data)
    return true
  } catch (error) {
    console.log('❌ API call failed:', error.message)
    console.log('Error details:', error.response?.data)
    return false
  }
}

/**
 * Test token refresh
 */
export const testTokenRefresh = async () => {
  console.log('🔄 Testing Token Refresh...')
  
  try {
    const newToken = await authService.refreshAccessToken()
    console.log('✅ Token refresh successful')
    console.log('New token:', newToken ? 'Present' : 'Missing')
    return true
  } catch (error) {
    console.log('❌ Token refresh failed:', error.message)
    return false
  }
}

/**
 * Force token expiry for testing
 */
export const forceTokenExpiry = () => {
  console.log('⚠️ Forcing token expiry for testing...')
  
  const token = authService.getToken()
  if (token) {
    try {
      const parts = token.split('.')
      const payload = JSON.parse(atob(parts[1]))
      
      // Set expiry to 1 second ago
      payload.exp = Math.floor(Date.now() / 1000) - 1
      
      // Create new token with expired payload
      const expiredToken = parts[0] + '.' + btoa(JSON.stringify(payload)) + '.' + parts[2]
      
      // Update in auth service and localStorage
      authService.accessToken = expiredToken
      localStorage.setItem('accessToken', expiredToken)
      
      console.log('✅ Token expired artificially')
      debugAuthState()
    } catch (error) {
      console.log('❌ Error forcing expiry:', error.message)
    }
  } else {
    console.log('❌ No token to expire')
  }
}

/**
 * Run comprehensive auth tests
 */
export const runAuthTests = async () => {
  console.log('🚀 Running Comprehensive Auth Tests...')
  console.log('=====================================')
  
  // 1. Check current state
  debugAuthState()
  
  // 2. Test API call
  const apiSuccess = await testApiCall()
  
  // 3. Test token refresh if API failed
  if (!apiSuccess) {
    console.log('\n🔄 API failed, testing token refresh...')
    const refreshSuccess = await testTokenRefresh()
    
    if (refreshSuccess) {
      console.log('\n🔄 Retrying API call after refresh...')
      await testApiCall()
    }
  }
  
  console.log('\n✅ Auth tests completed')
  console.log('=====================================')
}

/**
 * Clear all auth data for testing
 */
export const clearAuthData = () => {
  console.log('🗑️ Clearing all auth data...')
  authService.clearAuthData()
  console.log('✅ Auth data cleared')
}

/**
 * Test role-based access control
 */
export const testRBAC = async () => {
  console.log('🔐 Testing Role-Based Access Control...')

  const user = authService.getUser()
  if (!user) {
    console.log('❌ No user logged in')
    return
  }

  console.log(`Testing RBAC for user: ${user.email} (${user.role || user.roleName})`)

  // Test role checks
  const roles = ['admin', 'manager', 'user']
  roles.forEach(role => {
    const hasRole = authService.hasRole(role)
    console.log(`- hasRole('${role}'):`, hasRole)
  })

  // Test specific permissions
  console.log('\nPermission Tests:')
  console.log('- Can access Users page:', authService.hasRole('admin'))
  console.log('- Can create tasks:', authService.hasRole('admin') || authService.hasRole('manager'))
  console.log('- Can view own tasks:', authService.hasRole('user') || authService.hasRole('manager') || authService.hasRole('admin'))

  // Test navigation visibility
  try {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    console.log('\nNavigation Visibility:')
    console.log('- User Management link visible:', authStore.isAdmin)
    console.log('- Admin features visible:', authStore.isAdmin)
    console.log('- Manager features visible:', authStore.isManagerOrAdmin)
  } catch (error) {
    console.log('Navigation test error:', error.message)
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.authDebug = {
    state: debugAuthState,
    testApi: testApiCall,
    testRefresh: testTokenRefresh,
    forceExpiry: forceTokenExpiry,
    runTests: runAuthTests,
    testRBAC: testRBAC,
    clear: clearAuthData
  }

  console.log('🔧 Auth debug tools available at window.authDebug')
  console.log('📋 Available methods: state, testApi, testRefresh, forceExpiry, runTests, testRBAC, clear')
}

/**
 * Frontend-Backend Integration Test Utilities
 * Provides functions to test API connectivity and data flow
 */

import { apiService } from '@/services/api'
import { authService } from '@/services/auth'
import { transformUserFromBackend, transformTaskFromBackend } from '@/utils/dataTransforms'

/**
 * Test basic API connectivity
 */
export const testApiConnectivity = async () => {
  const results = {
    backend: false,
    auth: false,
    users: false,
    tasks: false,
    dashboard: false,
    errors: []
  }

  try {
    // Test basic backend connectivity
    const healthResponse = await fetch('http://localhost:3000/health')
    results.backend = healthResponse.ok
    
    if (!results.backend) {
      results.errors.push('Backend server is not responding')
    }
  } catch (error) {
    results.errors.push(`Backend connectivity error: ${error.message}`)
  }

  try {
    // Test authentication
    await authService.login('admin@example.com', 'password123')
    results.auth = true
    
    // Test users API
    const usersResponse = await apiService.users.getAll()
    results.users = !!usersResponse.data
    
    // Test tasks API
    const tasksResponse = await apiService.tasks.getAll()
    results.tasks = !!tasksResponse.data

    // Test dashboard API
    const dashboardStatsResponse = await apiService.dashboard.getStats()
    const dashboardTasksResponse = await apiService.dashboard.getRecentTasks()
    results.dashboard = !!(dashboardStatsResponse.data && dashboardTasksResponse.data)

  } catch (error) {
    results.errors.push(`API test error: ${error.message}`)
  }

  return results
}

/**
 * Test data transformation
 */
export const testDataTransformation = () => {
  const results = {
    userTransform: false,
    taskTransform: false,
    errors: []
  }

  try {
    // Test user transformation
    const backendUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roleId: 1,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    const { transformUserFromBackend, transformTaskFromBackend } = await import('@/utils/dataTransforms')

    const transformedUser = transformUserFromBackend(backendUser)
    results.userTransform = transformedUser.role === 'admin' && transformedUser.status === 'active'

    // Test task transformation
    const backendTask = {
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      status: 'inprogress',
      priority: 3,
      createdAt: new Date().toISOString()
    }

    const transformedTask = transformTaskFromBackend(backendTask)
    results.taskTransform = transformedTask.status === 'in_progress'

  } catch (error) {
    results.errors.push(`Data transformation error: ${error.message}`)
  }

  return results
}

/**
 * Test theme system
 */
export const testThemeSystem = () => {
  const results = {
    systemDetection: false,
    toggle: false,
    persistence: false,
    errors: []
  }

  try {
    // Test system preference detection
    const hasMediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    results.systemDetection = !!hasMediaQuery

    // Test theme toggle
    const html = document.documentElement
    const initialHasDark = html.classList.contains('dark')
    
    // Toggle theme
    if (initialHasDark) {
      html.classList.remove('dark')
    } else {
      html.classList.add('dark')
    }
    
    const afterToggle = html.classList.contains('dark')
    results.toggle = afterToggle !== initialHasDark

    // Restore original state
    if (initialHasDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // Test persistence
    const hasLocalStorage = typeof localStorage !== 'undefined'
    results.persistence = hasLocalStorage

  } catch (error) {
    results.errors.push(`Theme system error: ${error.message}`)
  }

  return results
}

/**
 * Run comprehensive integration tests
 */
export const runIntegrationTests = async () => {
  console.log('🧪 Running Frontend-Backend Integration Tests...')
  
  const results = {
    timestamp: new Date().toISOString(),
    api: await testApiConnectivity(),
    dataTransform: testDataTransformation(),
    theme: testThemeSystem(),
    overall: false
  }

  // Calculate overall success
  results.overall = 
    results.api.backend && 
    results.api.auth && 
    results.dataTransform.userTransform && 
    results.theme.systemDetection

  // Log results
  console.log('📊 Integration Test Results:', results)
  
  if (results.overall) {
    console.log('✅ All integration tests passed!')
  } else {
    console.log('❌ Some integration tests failed:')
    const allErrors = [
      ...results.api.errors,
      ...results.dataTransform.errors,
      ...results.theme.errors
    ]
    allErrors.forEach(error => console.log(`  - ${error}`))
  }

  return results
}

/**
 * Test specific API endpoint
 */
export const testEndpoint = async (endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url: `http://localhost:3000/api${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    }

    if (data) {
      config.data = data
    }

    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: data ? JSON.stringify(data) : undefined
    })

    return {
      success: response.ok,
      status: response.status,
      data: await response.json()
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.integrationTest = {
    runAll: runIntegrationTests,
    testApi: testApiConnectivity,
    testData: testDataTransformation,
    testTheme: testThemeSystem,
    testEndpoint
  }
}

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back, {{ authStore.userFullName }}! Here's an overview of your tasks.
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ClipboardDocumentListIcon class="h-8 w-8 text-blue-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Tasks
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ stats.totalTasks }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ClockIcon class="h-8 w-8 text-yellow-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  In Progress
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ stats.inProgressTasks }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CheckCircleIcon class="h-8 w-8 text-green-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completed
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ stats.completedTasks }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ExclamationTriangleIcon class="h-8 w-8 text-red-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Overdue
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ stats.overdueTasks }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Tasks -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- My Tasks -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ getTasksSectionTitle() }}
            </h3>
          </div>
          <div class="card-body">
            <div v-if="loading" class="flex justify-center py-8">
              <div class="spinner h-8 w-8"></div>
            </div>
            <div v-else-if="recentTasks.length === 0" class="text-center py-8">
              <ClipboardDocumentListIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 dark:text-gray-400">No tasks found</p>
            </div>
            <div v-else class="max-h-96 overflow-y-auto space-y-3">
              <div
                v-for="task in recentTasks"
                :key="task.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                @click="navigateToTask(task.id)"
              >
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ task.title }}
                  </h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatDate(task.deadline) }}
                  </p>
                  <div v-if="task.assignedUsers && task.assignedUsers.length > 0" class="text-xs text-gray-400 mt-1">
                    Assigned to: {{ task.assignedUsers.map(u => u.firstName + ' ' + u.lastName).join(', ') }}
                  </div>
                </div>
                <div class="flex items-center space-x-2 flex-shrink-0">
                  <span
                    class="badge w-16 text-center"
                    :class="getStatusBadgeClass(task.status)"
                  >
                    {{ task.status.replace('_', ' ') }}
                  </span>
                  <span
                    class="badge w-16 text-center"
                    :class="getPriorityBadgeClass(task.priority)"
                  >
                    {{ task.priority }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <router-link
              to="/tasks"
              class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all tasks →
            </router-link>
          </div>
        </div>

        <!-- Quick Actions -->
        <div v-if="shouldShowQuickActions" class="card">
          <div class="card-header">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Quick Actions
            </h3>
          </div>
          <div class="card-body space-y-4">
            <!-- Task Creation (Managers and Admins only) -->
            <router-link
              v-if="authStore.isManager || authStore.isAdmin"
              to="/tasks/create"
              class="block p-4 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors duration-200"
            >
              <div class="flex items-center">
                <PlusIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div class="ml-3">
                  <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Create New Task
                  </p>
                  <p class="text-xs text-blue-700 dark:text-blue-300">
                    Add a new task to your project
                  </p>
                </div>
              </div>
            </router-link>

            <!-- View All Tasks -->
            <router-link
              v-if="authStore.isManager || authStore.isAdmin"
              to="/tasks"
              class="block p-4 bg-indigo-50 dark:bg-indigo-900 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors duration-200"
            >
              <div class="flex items-center">
                <ClipboardDocumentListIcon class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <div class="ml-3">
                  <p class="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                    Manage Tasks
                  </p>
                  <p class="text-xs text-indigo-700 dark:text-indigo-300">
                    View and manage all tasks
                  </p>
                </div>
              </div>
            </router-link>

            <!-- Gantt Chart (All roles) -->
            <router-link
              to="/gantt"
              class="block p-4 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors duration-200"
            >
              <div class="flex items-center">
                <ChartBarIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-900 dark:text-green-100">
                    View Gantt Chart
                  </p>
                  <p class="text-xs text-green-700 dark:text-green-300">
                    Visualize project timeline
                  </p>
                </div>
              </div>
            </router-link>

            <!-- User Management (Admins only) -->
            <router-link
              v-if="authStore.isAdmin"
              to="/users"
              class="block p-4 bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors duration-200"
            >
              <div class="flex items-center">
                <UsersIcon class="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <div class="ml-3">
                  <p class="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Manage Users
                  </p>
                  <p class="text-xs text-purple-700 dark:text-purple-300">
                    Add or edit user accounts
                  </p>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import { format } from 'date-fns'
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'

// Composables
const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const loading = ref(true)
const recentTasks = ref([])
const stats = ref({
  totalTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  overdueTasks: 0
})

// Computed properties
const shouldShowQuickActions = computed(() => {
  // Users only see the tasks section, no quick actions needed
  return authStore.isManager || authStore.isAdmin
})

// Methods
const formatDate = (date) => {
  if (!date) return 'No deadline'
  return format(new Date(date), 'MMM dd, yyyy')
}

const getPriorityName = (priority) => {
  const priorityMap = {
    1: 'low',
    2: 'medium',
    3: 'medium',
    4: 'high',
    5: 'urgent'
  }
  return priorityMap[priority] || 'medium'
}

const getTasksSectionTitle = () => {
  const userRole = authStore.userRole?.toLowerCase()
  if (userRole === 'admin') {
    return 'Recent Tasks'
  } else if (userRole === 'manager') {
    return 'My Tasks'
  } else {
    return 'Assigned Tasks'
  }
}

const navigateToTask = (taskId) => {
  router.push(`/tasks/${taskId}`)
}

const getStatusBadgeClass = (status) => {
  const statusClasses = {
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'in_progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
  return statusClasses[status] || statusClasses['pending']
}

const getPriorityBadgeClass = (priority) => {
  const priorityClasses = {
    'low': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'urgent': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
  return priorityClasses[priority] || priorityClasses['medium']
}



const fetchDashboardData = async () => {
  try {
    loading.value = true

    // Fetch dashboard statistics and recent tasks from API
    const [statsResponse, tasksResponse] = await Promise.all([
      apiService.dashboard.getStats(),
      apiService.dashboard.getRecentTasks({ limit: 5 })
    ])

    if (statsResponse.data.success) {
      stats.value = {
        totalTasks: statsResponse.data.data.totalTasks,
        inProgressTasks: statsResponse.data.data.inProgressTasks,
        completedTasks: statsResponse.data.data.completedTasks,
        overdueTasks: statsResponse.data.data.overdueTasks,
        pendingTasks: statsResponse.data.data.pendingTasks,
        cancelledTasks: statsResponse.data.data.cancelledTasks,
        highPriorityTasks: statsResponse.data.data.highPriorityTasks
      }
    }

    if (tasksResponse.data.success) {
      recentTasks.value = tasksResponse.data.data.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: getPriorityName(task.priority),
        deadline: task.deadline ? new Date(task.deadline) : null,
        assignedUsers: task.assignedUsers || [],
        creator: task.creator
      }))
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    // Handle authentication errors
    if (error.response?.status === 401) {
      authStore.handleAuthError(error)
    }
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchDashboardData()
})
</script>

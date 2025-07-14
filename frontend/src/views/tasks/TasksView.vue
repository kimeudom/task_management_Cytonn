<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Tasks
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Manage and track your tasks
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            v-permission="'tasks.create'"
            @click="createTask"
            class="btn-primary"
          >
            <PlusIcon class="h-5 w-5 mr-2" />
            Create Task
          </button>

          <!-- View toggle -->
          <div class="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border">
            <button
              @click="viewMode = 'list'"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
            >
              List
            </button>
            <button
              @click="viewMode = 'cards'"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                viewMode === 'cards'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="card mb-6">
        <div class="card-body">
          <!-- Search Bar -->
          <div class="mb-4">
            <label class="form-label">Search Tasks</label>
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by title, description, or assignee..."
                class="form-input pl-10"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="form-label">Status</label>
              <select v-model="filters.status" class="form-input">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label class="form-label">Priority</label>
              <select v-model="filters.priority" class="form-input">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label class="form-label">Assigned To</label>
              <select v-model="filters.assignedTo" class="form-input">
                <option value="">All Users</option>
                <option value="me">My Tasks</option>
                <option
                  v-for="user in availableUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="form-label">Due Date</label>
              <select v-model="filters.dueDate" class="form-input">
                <option value="">All Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="week">Due This Week</option>
                <option value="month">Due This Month</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                @click="resetFilters"
                class="btn-outline w-full"
              >
                <XMarkIcon class="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>

          <!-- Quick Filters -->
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-for="quickFilter in quickFilters"
              :key="quickFilter.key"
              @click="applyQuickFilter(quickFilter)"
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                isQuickFilterActive(quickFilter)
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              ]"
            >
              {{ quickFilter.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tasks List -->
      <div class="card">
        <div class="card-body">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="spinner h-8 w-8"></div>
          </div>
          <div v-else-if="filteredTasks.length === 0" class="text-center py-8">
            <ClipboardDocumentListIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">No tasks found</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="task in filteredTasks"
              :key="task.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    {{ task.title }}
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 mt-1">
                    {{ task.description }}
                  </p>
                  <div class="flex items-center space-x-4 mt-3">
                    <span
                      class="badge"
                      :class="getStatusBadgeClass(task.status)"
                    >
                      {{ task.status }}
                    </span>
                    <span
                      class="badge"
                      :class="getPriorityBadgeClass(task.priority)"
                    >
                      {{ task.priority }}
                    </span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      Due: {{ formatDate(task.deadline) }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center space-x-2 ml-4">
                  <button
                    @click="viewTask(task)"
                    class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="View task"
                  >
                    <EyeIcon class="h-5 w-5" />
                  </button>
                  <button
                    v-if="canEditTask(task)"
                    @click="editTask(task)"
                    class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Edit task"
                  >
                    <PencilIcon class="h-5 w-5" />
                  </button>
                  <button
                    v-if="canDeleteTask(task)"
                    @click="deleteTask(task)"
                    class="p-2 text-gray-400 hover:text-red-600"
                    title="Delete task"
                  >
                    <TrashIcon class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <!-- TODO: Implement create task modal -->
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { format } from 'date-fns'
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { usePermissions } from '@/utils/permissions'
import { useTasksStore } from '@/stores/tasks'
import taskService from '@/services/tasks'
import userService from '@/services/users'
import { withErrorHandling } from '@/utils/errorHandler'

// Composables
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const tasksStore = useTasksStore()
const { hasPermission, canPerformTaskAction } = usePermissions()

// Reactive state
const loading = ref(true)
const viewMode = ref('cards')
const searchQuery = ref('')
const tasks = ref([])
const availableUsers = ref([])

const filters = reactive({
  status: '',
  priority: '',
  assignedTo: '',
  dueDate: ''
})

const quickFilters = [
  { key: 'my-tasks', label: 'My Tasks', filter: { assignedTo: 'me' } },
  { key: 'overdue', label: 'Overdue', filter: { dueDate: 'overdue' } },
  { key: 'high-priority', label: 'High Priority', filter: { priority: 'high' } },
  { key: 'urgent', label: 'Urgent', filter: { priority: 'urgent' } },
  { key: 'in-progress', label: 'In Progress', filter: { status: 'in_progress' } },
  { key: 'completed', label: 'Completed', filter: { status: 'completed' } }
]

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.assignedToName?.toLowerCase().includes(query) ||
      task.createdByName?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(task => task.status === filters.status)
  }

  // Priority filter
  if (filters.priority) {
    filtered = filtered.filter(task => task.priority === filters.priority)
  }

  // Assignment filter
  if (filters.assignedTo === 'me') {
    filtered = filtered.filter(task =>
      task.assignedUsers?.includes(authStore.user?.id)
    )
  } else if (filters.assignedTo) {
    filtered = filtered.filter(task =>
      task.assignedUsers?.includes(parseInt(filters.assignedTo))
    )
  }

  // Due date filter
  if (filters.dueDate) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    filtered = filtered.filter(task => {
      if (!task.deadline) return false

      const deadline = new Date(task.deadline)
      const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())

      switch (filters.dueDate) {
        case 'overdue':
          return deadlineDate < today && task.status !== 'completed'
        case 'today':
          return deadlineDate.getTime() === today.getTime()
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          return deadlineDate >= today && deadlineDate <= weekFromNow
        case 'month':
          const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          return deadlineDate >= today && deadlineDate <= monthFromNow
        default:
          return true
      }
    })
  }

  return filtered
})

// Methods
const formatDate = (date) => {
  if (!date) return 'No deadline'
  return format(new Date(date), 'MMM dd, yyyy')
}

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'badge-success'
    case 'in_progress':
      return 'badge-info'
    case 'cancelled':
      return 'badge-error'
    default:
      return 'badge-secondary'
  }
}

const getPriorityBadgeClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return 'badge-error'
    case 'high':
      return 'badge-warning'
    case 'medium':
      return 'badge-info'
    default:
      return 'badge-secondary'
  }
}



const resetFilters = () => {
  searchQuery.value = ''
  filters.status = ''
  filters.priority = ''
  filters.assignedTo = ''
  filters.dueDate = ''
}

const applyQuickFilter = (quickFilter) => {
  // Reset current filters
  resetFilters()

  // Apply quick filter
  Object.assign(filters, quickFilter.filter)
}

const isQuickFilterActive = (quickFilter) => {
  return Object.entries(quickFilter.filter).every(([key, value]) => {
    return filters[key] === value
  })
}

const createTask = () => {
  if (!hasPermission('tasks.create')) {
    toast.warning('You do not have permission to create tasks')
    return
  }
  router.push({ name: 'task-create' })
}

const canEditTask = (task) => {
  return canPerformTaskAction(task, 'update', authStore.user)
}

const canDeleteTask = (task) => {
  return canPerformTaskAction(task, 'delete', authStore.user)
}

const loadUsers = withErrorHandling(async () => {
  try {
    const users = await userService.getUsersForAssignment()
    availableUsers.value = users
  } catch (error) {
    console.warn('Could not load users for assignment filter')
  }
}, { context: 'Loading users', showToast: false })

const viewTask = (task) => {
  router.push(`/tasks/${task.id}`)
}

const editTask = (task) => {
  if (!canEditTask(task)) {
    toast.warning('You do not have permission to edit this task')
    return
  }
  router.push({ name: 'task-edit', params: { id: task.id } })
}

const deleteTask = withErrorHandling(async (task) => {
  if (!canDeleteTask(task)) {
    toast.warning('You do not have permission to delete this task')
    return
  }

  if (confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
    await taskService.deleteTask(task.id)

    // Remove from local list
    tasks.value = tasks.value.filter(t => t.id !== task.id)

    toast.success('Task deleted successfully')
  }
}, { context: 'Deleting task' })

const fetchTasks = withErrorHandling(async () => {
  loading.value = true

  try {
    // Use the tasks store to load tasks
    await tasksStore.loadTasks({
      page: currentPage.value,
      limit: pageSize.value,
      status: selectedStatus.value,
      priority: selectedPriority.value,
      search: searchQuery.value
    })
    tasks.value = tasksStore.tasks
    totalTasks.value = tasksStore.totalTasks
  } catch (error) {
    console.error('Failed to load tasks:', error)
    toast.error('Failed to load tasks')
  }
}, { context: 'Loading tasks' })

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchTasks(),
    loadUsers()
  ])
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <!-- Header -->
      <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6 sm:mb-8">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
            Tasks
          </h1>
          <p class="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage and track your tasks
          </p>
        </div>
        <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <button
            v-permission="'tasks.create'"
            @click="createTask"
            class="btn-primary flex-1 sm:flex-none"
          >
            <PlusIcon class="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span class="hidden sm:inline">Create Task</span>
            <span class="sm:hidden">Create</span>
          </button>

          <!-- View toggle -->
          <div class="hidden sm:flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
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

      <!-- Mobile View Toggle -->
      <div class="sm:hidden mb-4">
        <div class="flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
          <button
            @click="viewMode = 'list'"
            :class="[
              'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
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
              'flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              viewMode === 'cards'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            ]"
          >
            Cards
          </button>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div class="p-4 sm:p-6">
          <!-- Search Bar -->
          <div class="mb-4 sm:mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Tasks
            </label>
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by title, description, or assignee..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Filters -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-4 sm:mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select v-model="filters.status" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select v-model="filters.priority" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned To
              </label>
              <select v-model="filters.assignedTo" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <select v-model="filters.dueDate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="week">Due This Week</option>
                <option value="month">Due This Month</option>
              </select>
            </div>
            <div class="flex items-end sm:col-span-2 lg:col-span-1">
              <button
                @click="resetFilters"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 flex items-center justify-center"
              >
                <XMarkIcon class="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>

          <!-- Quick Filters -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="quickFilter in quickFilters"
              :key="quickFilter.key"
              @click="applyQuickFilter(quickFilter)"
              :class="[
                'px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200',
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
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="p-4 sm:p-6">
          <div v-if="loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <div v-else-if="filteredTasks.length === 0" class="text-center py-12">
            <ClipboardDocumentListIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400 text-lg">No tasks found</p>
            <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters or create a new task</p>
          </div>
          <div v-else>
            <!-- View Mode: Cards -->
            <div v-if="viewMode === 'cards'" class="space-y-4">
              <div
                v-for="task in filteredTasks"
                :key="task.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800"
              >
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex-1 min-w-0">
                    <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2 break-words">
                      {{ task.title }}
                    </h3>
                    <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {{ task.description }}
                    </p>
                    <div class="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getStatusBadgeClass(task.status)"
                      >
                        {{ task.status }}
                      </span>
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getPriorityBadgeClass(task.priority)"
                      >
                        {{ task.priority }}
                      </span>
                      <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Due: {{ formatDate(task.deadline) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-1 sm:space-x-2 mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
                    <button
                      @click="viewTask(task)"
                      class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                      title="View task"
                    >
                      <EyeIcon class="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                   <button
                      v-if="canEditTask(task)"
                      @click="handleTaskNavigation(task, 'edit')"
                      :disabled="loading"
                      class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Edit task"
                    >
                      <PencilIcon class="h-4 w-4" />
                      </button>
                    <button
                      v-if="canDeleteTask(task)"
                      @click="deleteTask(task)"
                      class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                      title="Delete task"
                    >
                      <TrashIcon class="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- View Mode: List -->
            <div v-else class="overflow-hidden">
              <!-- Mobile List View -->
              <div class="sm:hidden space-y-3">
                <div
                  v-for="task in filteredTasks"
                  :key="task.id"
                  class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-medium text-gray-900 dark:text-white text-sm truncate flex-1 mr-2">
                      {{ task.title }}
                    </h3>
                    <div class="flex items-center space-x-1 flex-shrink-0">
                      <button
                        @click="viewTask(task)"
                        class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                        title="View task"
                      >
                        <EyeIcon class="h-4 w-4" />
                      </button>
                      <button
                        v-if="canEditTask(task)"
                        @click="editTask(task)"
                        class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                        title="Edit task"
                      >
                        <PencilIcon class="h-4 w-4" />
                      </button>
                      <button
                        v-if="canDeleteTask(task)"
                        @click="deleteTask(task)"
                        class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                        title="Delete task"
                      >
                        <TrashIcon class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="getStatusBadgeClass(task.status)"
                    >
                      {{ task.status }}
                    </span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="getPriorityBadgeClass(task.priority)"
                    >
                      {{ task.priority }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    Due: {{ formatDate(task.deadline) }}
                  </div>
                </div>
              </div>

              <!-- Desktop Table View -->
              <div class="hidden sm:block overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Title
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr
                      v-for="task in filteredTasks"
                      :key="task.id"
                      class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ task.title }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {{ task.description }}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getStatusBadgeClass(task.status)"
                        >
                          {{ task.status }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getPriorityBadgeClass(task.priority)"
                        >
                          {{ task.priority }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {{ formatDate(task.deadline) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex justify-end space-x-2">
                          <button
                            @click="viewTask(task)"
                            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                            title="View task"
                          >
                            <EyeIcon class="h-4 w-4" />
                          </button>
                          <button
                            v-if="canEditTask(task)"
                            @click="editTask(task)"
                            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
                            title="Edit task"
                          >
                            <PencilIcon class="h-4 w-4" />
                          </button>
                          <button
                            v-if="canDeleteTask(task)"
                            @click="deleteTask(task)"
                            class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                            title="Delete task"
                          >
                            <TrashIcon class="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalTasks > pageSize" class="flex justify-center sm:justify-end mt-6">
              <nav class="flex items-center justify-between w-full sm:w-auto">
                <div class="flex items-center space-x-2">
                  <button
                    class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    :disabled="currentPage === 1"
                    @click="changePage(currentPage - 1)"
                  >
                    Previous
                  </button>
                  <span class="px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                    Page {{ currentPage }} of {{ Math.ceil(totalTasks / pageSize) }}
                  </span>
                  <button
                    class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    :disabled="currentPage === Math.ceil(totalTasks / pageSize)"
                    @click="changePage(currentPage + 1)"
                  >
                    Next
                  </button>
                </div>
              </nav>
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
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
const route = useRoute()
const authStore = useAuthStore()
const tasksStore = useTasksStore()
const { hasPermission, canPerformTaskAction } = usePermissions()

// Reactive state
const loading = ref(true)
const viewMode = ref('cards')
const searchQuery = ref('')
const tasks = ref([])
const availableUsers = ref([])
const totalTasks = ref(0)

// Pagination and filter state for fetchTasks
const currentPage = ref(1)
const pageSize = ref(20)
const selectedStatus = ref('')
const selectedPriority = ref('')

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
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(task => task.status === filters.status)
  }

  // Priority filter
  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter(task => task.priority === filters.priority)
  }

  // Assignment filter
  if (filters.assignedTo && filters.assignedTo !== 'all') {
    if (filters.assignedTo === 'me') {
      filtered = filtered.filter(task =>
        task.assignedUsers?.some(u => u.id === authStore.user?.id)
      )
    } else {
      filtered = filtered.filter(task =>
        task.assignedUsers?.some(u => u.id === parseInt(filters.assignedTo))
      )
    }
  }

  // Due date filter
  if (filters.dueDate && filters.dueDate !== 'all') {
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

const changePage = (page) => {
  if (page < 1 || page > Math.ceil(totalTasks.value / pageSize.value)) return
  currentPage.value = page
  fetchTasks()
}

const refreshTasks = withErrorHandling(async () => {
  await fetchTasks()
}, { context: 'Refreshing tasks' })

watch(() => route.name, (newName, oldName) => {
  // If we're coming back to tasks view from task-edit or task-view
  if (newName === 'tasks' && (oldName === 'task-edit' || oldName === 'task-view')) {
    refreshTasks()
  }
})

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const getPriorityBadgeClass = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
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
  if (!task || !authStore.user) return false
  
  try {
    return canPerformTaskAction(task, 'update', authStore.user)
  } catch (error) {
    console.warn('Error checking edit permissions:', error)
    return false
  }
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
  // Double-check permissions with fresh data
  if (!canEditTask(task)) {
    toast.warning('You do not have permission to edit this task')
    return
  }
  
  // Navigate to edit page
  router.push({ 
    name: 'task-edit', 
    params: { id: task.id }
  })
}

watch(() => route.name, (newName, oldName) => {
  if (newName === 'tasks' && (oldName === 'task-edit' || oldName === 'task-view')) {
    fetchTasks()
  }
})

const handleTaskNavigation = (task, action) => {
  if (!task || !task.id) {
    toast.error('Invalid task data')
    return
  }
  
  switch (action) {
    case 'view':
      router.push(`/tasks/${task.id}`)
      break
    case 'edit':
      editTask(task)
      break
    default:
      console.warn('Unknown navigation action:', action)
  }
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

const safeCanEditTask = (task) => {
  try {
    return canEditTask(task)
  } catch (error) {
    console.error('Permission check failed:', error)
    return false
  }
}

const fetchTasks = withErrorHandling(async () => {
  loading.value = true

  try {
    // Clear previous tasks to avoid stale data
    tasks.value = []
    
    await tasksStore.loadTasks({
      page: currentPage.value,
      limit: pageSize.value,
      status: selectedStatus.value,
      priority: selectedPriority.value,
      search: searchQuery.value
    })
    
    tasks.value = tasksStore.tasks
    totalTasks.value = tasksStore.totalTasks
    
    // Force reactivity update
    await nextTick()
  } catch (error) {
    console.error('Failed to load tasks:', error)
    toast.error('Failed to load tasks')
    tasks.value = []
  } finally {
    loading.value = false
  }
}, { context: 'Loading tasks' })

const updateTaskInList = (updatedTask) => {
  const index = tasks.value.findIndex(t => t.id === updatedTask.id)
  if (index !== -1) {
    tasks.value[index] = { ...tasks.value[index], ...updatedTask }
  }
}

// Listen for task updates from the store
watch(() => tasksStore.tasks, (newTasks) => {
  if (newTasks && newTasks.length > 0) {
    tasks.value = newTasks
  }
}, { deep: true })

const preloadEditRoute = () => {
  // Preload the edit route component for faster navigation
  router.prefetch({ name: 'task-edit' })
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      fetchTasks(),
      loadUsers(),
      preloadEditRoute()
    ])
  } catch (error) {
    console.error('Error during component initialization:', error)
    toast.error('Failed to load tasks data')
  }
})

import { onBeforeRouteLeave } from 'vue-router'

onBeforeRouteLeave((to, from, next) => {
  // Clean up any pending operations
  loading.value = false
  next()
})

</script>

<style scoped>
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
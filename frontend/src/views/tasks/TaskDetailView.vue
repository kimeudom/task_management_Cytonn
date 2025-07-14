<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile Header -->
    <div class="lg:hidden bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div class="flex items-center justify-between px-4 py-3">
        <button
          @click="$router.go(-1)"
          class="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </button>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
          Task Details
        </h1>
        <div class="flex items-center space-x-2">
          <!-- Mobile Actions Menu -->
          <div class="relative" v-if="task && !loading">
            <button
              @click="showMobileMenu = !showMobileMenu"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <EllipsisVerticalIcon class="h-5 w-5" />
            </button>
            
            <!-- Mobile Menu Dropdown -->
            <div v-if="showMobileMenu" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <button
                v-if="canEditTask"
                @click="editTask(); showMobileMenu = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <PencilIcon class="h-4 w-4" />
                <span>Edit Task</span>
              </button>
              
              <button
                v-if="canUpdateStatus"
                @click="showStatusModal = true; showMobileMenu = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <CheckCircleIcon class="h-4 w-4" />
                <span>Update Status</span>
              </button>
              
              <button
                v-if="canDeleteTask"
                @click="confirmDelete(); showMobileMenu = false"
                class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
              >
                <TrashIcon class="h-4 w-4" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 lg:px-8 py-4 lg:py-8 max-w-7xl mx-auto">
      <!-- Desktop Header -->
      <div class="hidden lg:flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            @click="$router.go(-1)"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeftIcon class="h-6 w-6" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Task Details
            </h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Task ID: {{ $route.params.id }}
            </p>
          </div>
        </div>
        
        <!-- Desktop Actions -->
        <div v-if="task && !loading" class="flex items-center space-x-3">
          <button
            v-if="canUpdateStatus"
            @click="showStatusModal = true"
            class="btn-outline flex items-center space-x-2"
          >
            <CheckCircleIcon class="h-4 w-4" />
            <span>Update Status</span>
          </button>
          <button
            v-if="canEditTask"
            @click="editTask"
            class="btn-primary flex items-center space-x-2"
          >
            <PencilIcon class="h-4 w-4" />
            <span>Edit Task</span>
          </button>
          <button
            v-if="canDeleteTask"
            @click="confirmDelete"
            class="btn-danger flex items-center space-x-2"
          >
            <TrashIcon class="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
          <div v-if="loading" class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="text-gray-500 dark:text-gray-400">Loading task details...</p>
          </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-600 dark:text-red-400 mb-4">
          <ExclamationTriangleIcon class="w-12 h-12 mx-auto mb-2" />
          <h3 class="text-lg font-medium">{{ error }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Please try again or contact support if the problem persists.
          </p>
        </div>
        <button @click="fetchTask" class="btn-primary">
          Try Again
        </button>
      </div>

      <!-- Task Content -->
      <div v-else-if="task" class="space-y-6">
        <!-- Task Header Card -->
        <div class="card">
          <div class="card-body">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
              <div class="flex-1">
                <h2 class="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {{ task.title }}
                </h2>
                <p class="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
                  {{ task.description || 'No description provided' }}
                </p>
              </div>
              
              <!-- Status and Priority Badges -->
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge text-xs lg:text-sm" :class="getStatusBadgeClass(task.status)">
                  {{ getStatusDisplayText(task.status) }}
                </span>
                <span class="badge text-xs lg:text-sm" :class="getPriorityBadgeClass(task.priority)">
                  {{ getPriorityDisplayText(task.priority) }}
                </span>
                <span v-if="isOverdue" class="badge badge-error text-xs lg:text-sm">
                  <ClockIcon class="h-3 w-3 mr-1" />
                  Overdue
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Task Information Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Task Details -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title flex items-center space-x-2">
                <InformationCircleIcon class="h-5 w-5" />
                <span>Task Information</span>
              </h3>
            </div>
            <div class="card-body">
              <dl class="space-y-4">
                <div class="flex flex-col sm:flex-row sm:justify-between">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd class="mt-1 sm:mt-0">
                    <span class="badge text-xs" :class="getStatusBadgeClass(task.status)">
                      {{ getStatusDisplayText(task.status) }}
                    </span>
                  </dd>
                </div>
                
                <div class="flex flex-col sm:flex-row sm:justify-between">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</dt>
                  <dd class="mt-1 sm:mt-0">
                    <span class="badge text-xs" :class="getPriorityBadgeClass(task.priority)">
                      {{ getPriorityDisplayText(task.priority) }}
                    </span>
                  </dd>
                </div>
                
                <div class="flex flex-col sm:flex-row sm:justify-between">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline</dt>
                  <dd class="mt-1 sm:mt-0 text-sm text-gray-900 dark:text-white">
                    <div class="flex items-center space-x-2">
                      <CalendarIcon class="h-4 w-4 text-gray-400" />
                      <span>{{ formatDate(task.deadline) }}</span>
                      <span v-if="isOverdue" class="text-red-600 dark:text-red-400 text-xs">
                        ({{ getOverdueText() }})
                      </span>
                    </div>
                  </dd>
                </div>
                
                <div class="flex flex-col sm:flex-row sm:justify-between">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                  <dd class="mt-1 sm:mt-0 text-sm text-gray-900 dark:text-white">
                    <div class="flex items-center space-x-2">
                      <ClockIcon class="h-4 w-4 text-gray-400" />
                      <span>{{ formatDate(task.createdAt) }}</span>
                    </div>
                  </dd>
                </div>
                
                <div class="flex flex-col sm:flex-row sm:justify-between">
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                  <dd class="mt-1 sm:mt-0 text-sm text-gray-900 dark:text-white">
                    <div class="flex items-center space-x-2">
                      <ClockIcon class="h-4 w-4 text-gray-400" />
                      <span>{{ formatDate(task.updatedAt) }}</span>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Assignment Information -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title flex items-center space-x-2">
                <UserGroupIcon class="h-5 w-5" />
                <span>Assignment</span>
              </h3>
            </div>
            <div class="card-body">
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Created By</dt>
                  <dd class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span class="text-xs font-medium text-white">
                        {{ getUserInitials(task.createdByName) }}
                      </span>
                    </div>
                    <span class="text-sm text-gray-900 dark:text-white">
                      {{ task.createdByName || 'Unknown' }}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Assigned To</dt>
                  <dd>
                    <div v-if="task.assignedUsers && task.assignedUsers.length > 0" class="space-y-2">
                      <div 
                        v-for="user in task.assignedUsers" 
                        :key="user.id"
                        class="flex items-center space-x-3"
                      >
                        <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span class="text-xs font-medium text-white">
                            {{ getUserInitials(user.name) }}
                          </span>
                        </div>
                        <div>
                          <span class="text-sm text-gray-900 dark:text-white">{{ user.name }}</span>
                          <span class="text-xs text-gray-500 dark:text-gray-400 block">{{ user.email }}</span>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                      No one assigned
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <!-- Mobile Action Buttons -->
        <div class="lg:hidden card">
          <div class="card-body">
            <div class="flex flex-col space-y-3">
              <button
                v-if="canUpdateStatus"
                @click="showStatusModal = true"
                class="btn-outline w-full flex items-center justify-center space-x-2"
              >
                <CheckCircleIcon class="h-4 w-4" />
                <span>Update Status</span>
              </button>
              <button
                v-if="canEditTask"
                @click="editTask"
                class="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <PencilIcon class="h-4 w-4" />
                <span>Edit Task</span>
              </button>
              <button
                v-if="canDeleteTask"
                @click="confirmDelete"
                class="btn-danger w-full flex items-center justify-center space-x-2"
              >
                <TrashIcon class="h-4 w-4" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Update Modal -->
    <div v-if="showStatusModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Update Task Status
          </h3>
          
          <div class="space-y-3">
            <div
              v-for="status in availableStatuses"
              :key="status.value"
              class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900/20': selectedStatus === status.value }"
              @click="selectedStatus = status.value"
            >
              <input
                :id="status.value"
                v-model="selectedStatus"
                :value="status.value"
                type="radio"
                class="form-radio text-blue-600"
              />
              <label :for="status.value" class="flex-1 cursor-pointer">
                <div class="flex items-center space-x-2">
                  <span class="badge text-xs" :class="getStatusBadgeClass(status.value)">
                    {{ status.label }}
                  </span>
                </div>
              </label>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button
              @click="showStatusModal = false"
              class="btn-outline"
              :disabled="updatingStatus"
            >
              Cancel
            </button>
            <button
              @click="updateStatus"
              class="btn-primary"
              :disabled="updatingStatus || selectedStatus === task.status"
            >
              <div v-if="updatingStatus" class="flex items-center space-x-2">
                <div class="spinner h-4 w-4"></div>
                <span>Updating...</span>
              </div>
              <span v-else>Update Status</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <div class="flex items-center space-x-3 mb-4">
            <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Delete Task
            </h3>
          </div>
          
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete "<strong>{{ task?.title }}</strong>"? This action cannot be undone.
          </p>
          
          <div class="flex justify-end space-x-3">
            <button
              @click="showDeleteModal = false"
              class="btn-outline"
              :disabled="deleting"
            >
              Cancel
            </button>
            <button
              @click="deleteTask"
              class="btn-danger"
              :disabled="deleting"
            >
              <div v-if="deleting" class="flex items-center space-x-2">
                <div class="spinner h-4 w-4"></div>
                <span>Deleting...</span>
              </div>
              <span v-else>Delete Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Click outside handler for mobile menu -->
    <div v-if="showMobileMenu" @click="showMobileMenu = false" class="fixed inset-0 z-10"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from 'vue-toastification'
import { format, formatDistanceToNow } from 'date-fns'
import taskService from '@/services/tasks'
import {
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  InformationCircleIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'

// Composables
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tasksStore = useTasksStore()
const toast = useToast()

// Reactive state
const loading = ref(true)
const task = ref(null)
const error = ref(null)
const showMobileMenu = ref(false)
const showStatusModal = ref(false)
const showDeleteModal = ref(false)
const selectedStatus = ref('')
const updatingStatus = ref(false)
const deleting = ref(false)

// Available status options
const availableStatuses = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

// Computed properties
const canEditTask = computed(() => {
  if (!task.value) return false
  return authStore.isManagerOrAdmin || task.value.createdBy === authStore.user?.id
})

const canDeleteTask = computed(() => {
  if (!task.value) return false
  return authStore.isManagerOrAdmin || task.value.createdBy === authStore.user?.id
})

const canUpdateStatus = computed(() => {
  if (!task.value) return false
  return authStore.user && (
    authStore.isManagerOrAdmin ||
    task.value.createdBy === authStore.user.id ||
    task.value.assignedUsers?.some(user => user.id === authStore.user.id)
  )
})

const isOverdue = computed(() => {
  if (!task.value?.deadline) return false
  return new Date(task.value.deadline) < new Date() && task.value.status !== 'completed'
})

// Methods
const formatDate = (date) => {
  if (!date) return 'Not set'
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

const getOverdueText = () => {
  if (!task.value?.deadline) return ''
  return formatDistanceToNow(new Date(task.value.deadline), { addSuffix: true })
}

const getUserInitials = (name) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'badge-success'
    case 'in_progress':
      return 'badge-info'
    case 'cancelled':
      return 'badge-error'
    case 'pending':
      return 'badge-warning'
    default:
      return 'badge-secondary'
  }
}

const getStatusDisplayText = (status) => {
  switch (status?.toLowerCase()) {
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    case 'pending':
      return 'Pending'
    default:
      return status
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
    case 'low':
      return 'badge-secondary'
    default:
      return 'badge-secondary'
  }
}

const getPriorityDisplayText = (priority) => {
  return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Not set'
}

const editTask = () => {
  router.push({ name: 'task-edit', params: { id: task.value.id } })
}

const confirmDelete = () => {
  showDeleteModal.value = true
}

const deleteTask = async () => {
  try {
    deleting.value = true
    await taskService.deleteTask(task.value.id)
    toast.success('Task deleted successfully!')
    router.push({ name: 'tasks' })
  } catch (err) {
    console.error('Error deleting task:', err)
    toast.error(err.message || 'Failed to delete task')
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

const updateStatus = async () => {
  try {
    updatingStatus.value = true
    await taskService.updateTaskStatus(task.value.id, selectedStatus.value)
    
    // Update local task data
    task.value.status = selectedStatus.value
    
    toast.success('Task status updated successfully!')
    showStatusModal.value = false
    
    // Refresh task data to get latest info
    await fetchTask()
  } catch (err) {
    console.error('Error updating task status:', err)
    toast.error(err.message || 'Failed to update task status')
  } finally {
    updatingStatus.value = false
  }
}

const fetchTask = async () => {
  try {
    loading.value = true
    error.value = null
    const taskId = route.params.id

    const taskData = await taskService.getTaskById(taskId)
    task.value = taskData
    selectedStatus.value = taskData.status

    // Update tasks store for consistency
    tasksStore.currentTask = taskData
  } catch (err) {
    console.error('Error fetching task:', err)
    error.value = err.message || 'Failed to load task details'
    
    // If task not found, redirect to tasks list
    if (err.message?.includes('not found')) {
      setTimeout(() => router.push({ name: 'tasks' }), 2000)
    }
  } finally {
    loading.value = false
  }
}

// Close mobile menu when clicking outside
const handleClickOutside = (event) => {
  if (showMobileMenu.value && !event.target.closest('.relative')) {
    showMobileMenu.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchTask()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-outline {
  @apply border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.card {
  @apply bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700;
}

.card-header {
  @apply px-6 py-4 border-b border-gray-200 dark:border-gray-700;
}

.card-body {
  @apply px-6 py-4;
}

.card-title {
  @apply text-lg font-medium text-gray-900 dark:text-white;
}

.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-success {
  @apply bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400;
}

.badge-info {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400;
}

.badge-warning {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400;
}

.badge-error {
  @apply bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400;
}

.badge-secondary {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300;
}

.form-radio {
  @apply h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700;
}

@media (max-width: 768px) {
  .mobile-padding {
    @apply px-4;
  }
}
</style>
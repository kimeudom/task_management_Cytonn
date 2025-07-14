<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile Header -->
    <div class="lg:hidden bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-4 py-3">
        <button
          @click="goBack"
          class="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeftIcon class="h-5 w-5" />
        </button>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {{ task?.title || 'Task Details' }}
        </h1>
        <div class="flex items-center space-x-2">
          <!-- Mobile Actions Menu -->
          <div class="relative" v-if="task && !loading">
            <button
              ref="mobileMenuButton"
              @click="toggleMobileMenu"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <EllipsisVerticalIcon class="h-5 w-5" />
            </button>
            
            <!-- Mobile Menu Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div v-if="showMobileMenu" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div class="py-1">
                  <button
                    v-if="canUpdateStatus"
                    @click="openStatusModal"
                    class="mobile-menu-item"
                  >
                    <CheckCircleIcon class="h-4 w-4" />
                    <span>Update Status</span>
                  </button>
                  
                  <button
                    v-if="canEditTask"
                    @click="editTask"
                    class="mobile-menu-item"
                  >
                    <PencilIcon class="h-4 w-4" />
                    <span>Edit Task</span>
                  </button>
                  
                  <button
                    v-if="canAssignTask"
                    @click="openAssignModal"
                    class="mobile-menu-item"
                  >
                    <UserPlusIcon class="h-4 w-4" />
                    <span>Assign Users</span>
                  </button>
                  
                  <button
                    v-if="canDeleteTask"
                    @click="confirmDelete"
                    class="mobile-menu-item text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon class="h-4 w-4" />
                    <span>Delete Task</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <div class="px-4 lg:px-8 py-4 lg:py-8 max-w-7xl mx-auto">
      <!-- Desktop Header -->
      <div class="hidden lg:flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            @click="goBack"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon class="h-6 w-6" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ task?.title || 'Task Details' }}
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
            @click="openStatusModal"
            class="btn-outline flex items-center space-x-2"
          >
            <CheckCircleIcon class="h-4 w-4" />
            <span>Update Status</span>
          </button>
          <button
            v-if="canAssignTask"
            @click="openAssignModal"
            class="btn-outline flex items-center space-x-2"
          >
            <UserPlusIcon class="h-4 w-4" />
            <span>Assign Users</span>
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
        <div class="flex flex-col items-center space-y-4">
          <div class="spinner h-8 w-8"></div>
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
        <button @click="retryFetch" class="btn-primary">
          Try Again
        </button>
      </div>

      <!-- Task Content -->
      <div v-else-if="task" class="space-y-6">
        <!-- Task Header Card -->
        <div class="card">
          <div class="card-body">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
              <div class="flex-1 min-w-0">
                <h2 class="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                  {{ task.title }}
                </h2>
                <p class="text-gray-600 dark:text-gray-400 text-sm lg:text-base whitespace-pre-wrap">
                  {{ task.description || 'No description provided' }}
                </p>
              </div>
              
              <!-- Status and Priority Badges -->
              <div class="flex flex-wrap items-center gap-2 lg:ml-6">
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
                <div class="detail-item">
                  <dt class="detail-label">Status</dt>
                  <dd class="detail-value">
                    <span class="badge text-xs" :class="getStatusBadgeClass(task.status)">
                      {{ getStatusDisplayText(task.status) }}
                    </span>
                  </dd>
                </div>
                
                <div class="detail-item">
                  <dt class="detail-label">Priority</dt>
                  <dd class="detail-value">
                    <span class="badge text-xs" :class="getPriorityBadgeClass(task.priority)">
                      {{ getPriorityDisplayText(task.priority) }}
                    </span>
                  </dd>
                </div>
                
                <div class="detail-item">
                  <dt class="detail-label">Deadline</dt>
                  <dd class="detail-value">
                    <div class="flex items-center space-x-2">
                      <CalendarIcon class="h-4 w-4 text-gray-400" />
                      <span>{{ formatDate(task.deadline) }}</span>
                      <span v-if="isOverdue" class="text-red-600 dark:text-red-400 text-xs">
                        ({{ getOverdueText() }})
                      </span>
                    </div>
                  </dd>
                </div>
                
                <div class="detail-item">
                  <dt class="detail-label">Created</dt>
                  <dd class="detail-value">
                    <div class="flex items-center space-x-2">
                      <ClockIcon class="h-4 w-4 text-gray-400" />
                      <span>{{ formatDate(task.createdAt) }}</span>
                    </div>
                  </dd>
                </div>
                
                <div class="detail-item">
                  <dt class="detail-label">Last Updated</dt>
                  <dd class="detail-value">
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
                  <dt class="detail-label mb-2">Created By</dt>
                  <dd class="flex items-center space-x-3">
                    <div class="user-avatar bg-blue-600">
                      <span class="text-xs font-medium text-white">
                        {{ getUserInitials(task.createdByName) }}
                      </span>
                    </div>
                    <div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ task.createdByName || 'Unknown' }}
                      </span>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Created {{ formatRelativeTime(task.createdAt) }}
                      </p>
                    </div>
                  </dd>
                </div>
                
                <div>
                  <dt class="detail-label mb-2">Assigned To</dt>
                  <dd>
                    <div v-if="task.assignedUsers && task.assignedUsers.length > 0" class="space-y-3">
                      <div 
                        v-for="user in task.assignedUsers" 
                        :key="user.id"
                        class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div class="user-avatar bg-green-600">
                          <span class="text-xs font-medium text-white">
                            {{ getUserInitials(user.name) }}
                          </span>
                        </div>
                        <div class="flex-1 min-w-0">
                          <span class="text-sm font-medium text-gray-900 dark:text-white block truncate">
                            {{ user.name }}
                          </span>
                          <span class="text-xs text-gray-500 dark:text-gray-400 block truncate">
                            {{ user.email }}
                          </span>
                        </div>
                        <button
                          v-if="canAssignTask"
                          @click="unassignUser(user.id)"
                          class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          :title="`Remove ${user.name} from task`"
                        >
                          <XMarkIcon class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray-500 dark:text-gray-400 italic">
                      No one assigned to this task
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <!-- Task Stats (if available) -->
        <div v-if="taskStats" class="card">
          <div class="card-header">
            <h3 class="card-title flex items-center space-x-2">
              <ChartBarIcon class="h-5 w-5" />
              <span>Task Statistics</span>
            </h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="stat-card">
                <div class="stat-value">{{ taskStats.totalTasks || 0 }}</div>
                <div class="stat-label">Total Tasks</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ taskStats.completedTasks || 0 }}</div>
                <div class="stat-label">Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ taskStats.pendingTasks || 0 }}</div>
                <div class="stat-label">Pending</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ taskStats.overdueTasks || 0 }}</div>
                <div class="stat-label">Overdue</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Quick Actions -->
        <div class="lg:hidden">
          <div class="card">
            <div class="card-body">
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-if="canUpdateStatus"
                  @click="openStatusModal"
                  class="btn-outline w-full flex items-center justify-center space-x-2"
                >
                  <CheckCircleIcon class="h-4 w-4" />
                  <span>Update Status</span>
                </button>
                <button
                  v-if="canAssignTask"
                  @click="openAssignModal"
                  class="btn-outline w-full flex items-center justify-center space-x-2"
                >
                  <UserPlusIcon class="h-4 w-4" />
                  <span>Assign Users</span>
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
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status Update Modal -->
    <BaseModal v-model="showStatusModal" title="Update Task Status">
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="status in availableStatuses"
            :key="status.value"
            class="status-option"
            :class="{ 'selected': selectedStatus === status.value }"
            @click="selectedStatus = status.value"
          >
            <input
              :id="status.value"
              v-model="selectedStatus"
              :value="status.value"
              type="radio"
              class="form-radio"
            />
            <label :for="status.value" class="status-label">
              <div class="flex items-center space-x-3">
                <span class="badge text-xs" :class="getStatusBadgeClass(status.value)">
                  {{ status.label }}
                </span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ status.description }}
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
      
      <template #footer>
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
      </template>
    </BaseModal>

    <!-- User Assignment Modal -->
    <BaseModal v-model="showAssignModal" title="Assign Users to Task">
      <div v-if="loadingUsers" class="flex justify-center py-8">
        <div class="spinner h-6 w-6"></div>
      </div>
      <div v-else class="space-y-3 max-h-96 overflow-y-auto">
        <div
          v-for="user in availableUsers"
          :key="user.id"
          class="user-option"
          :class="{ 'selected': selectedUsers.includes(user.id) }"
          @click="toggleUserSelection(user.id)"
        >
          <input
            :id="`assign-user-${user.id}`"
            v-model="selectedUsers"
            :value="user.id"
            type="checkbox"
            class="form-checkbox"
          />
          <label :for="`assign-user-${user.id}`" class="user-label">
            <div class="flex items-center space-x-3">
              <div class="user-avatar bg-blue-600">
                <span class="text-xs font-medium text-white">
                  {{ getUserInitials(user.name) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ user.name }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ user.email }} • {{ user.role }}
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
      
      <template #footer>
        <button
          @click="showAssignModal = false"
          class="btn-outline"
          :disabled="assigning"
        >
          Cancel
        </button>
        <button
          @click="assignUsers"
          class="btn-primary"
          :disabled="assigning"
        >
          <div v-if="assigning" class="flex items-center space-x-2">
            <div class="spinner h-4 w-4"></div>
            <span>Assigning...</span>
          </div>
          <span v-else>Assign Users</span>
        </button>
      </template>
    </BaseModal>

    <!-- Delete Confirmation Modal -->
    <BaseModal v-model="showDeleteModal" title="Delete Task">
      <div class="flex items-center space-x-3 mb-4">
        <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
        <div>
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete "<strong>{{ task?.title }}</strong>"?
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">
            This action cannot be undone.
          </p>
        </div>
      </div>
      
      <template #footer>
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
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from 'vue-toastification'
import { format, formatDistanceToNow } from 'date-fns'
import taskService from '@/services/tasks'
import userService from '@/services/users'
import BaseModal from '@/components/ui/BaseModal.vue'
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
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
  ChartBarIcon
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
const taskStats = ref(null)
const availableUsers = ref([])
const loadingUsers = ref(false)

// UI state
const showMobileMenu = ref(false)
const showStatusModal = ref(false)
const showAssignModal = ref(false)
const showDeleteModal = ref(false)
const mobileMenuButton = ref(null)

// Form state
const selectedStatus = ref('')
const selectedUsers = ref([])
const updatingStatus = ref(false)
const assigning = ref(false)
const deleting = ref(false)

// Available status options with descriptions
const availableStatuses = [
  { value: 'pending', label: 'Pending', description: 'Task is waiting to be started' },
  { value: 'in_progress', label: 'In Progress', description: 'Task is currently being worked on' },
  { value: 'completed', label: 'Completed', description: 'Task has been finished' },
  { value: 'cancelled', label: 'Cancelled', description: 'Task has been cancelled' }
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

const canAssignTask = computed(() => {
  if (!task.value) return false
  return authStore.isManagerOrAdmin || task.value.createdBy === authStore.user?.id
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

const formatRelativeTime = (date) => {
  if (!date) return 'Unknown'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
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

const goBack = () => {
  router.go(-1)
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const editTask = () => {
  showMobileMenu.value = false
  router.push({ name: 'task-edit', params: { id: task.value.id } })
}

const confirmDelete = () => {
  showMobileMenu.value = false
  showDeleteModal.value = true
}

const openStatusModal = () => {
  showMobileMenu.value = false
  selectedStatus.value = task.value.status
  showStatusModal.value = true
}

const openAssignModal = () => {
  showMobileMenu.value = false
  selectedUsers.value = task.value.assignedUsers?.map(user => user.id) || []
  loadUsersForAssignment()
  showAssignModal.value = true
}

const toggleUserSelection = (userId) => {
  const index = selectedUsers.value.indexOf(userId)
  if (index > -1) {
    selectedUsers.value.splice(index, 1)
  } else {
    selectedUsers.value.push(userId)
  }
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
    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating status:', error);
    toast.error(error.message || 'Failed to update status');
  } finally {
    updatingStatus.value = false;
    showStatusModal.value = false;
  }
}

const assignUsers = async () => {
  try {
    assigning.value = true;
    await taskService.updateTaskAssignments(task.value.id, selectedUsers.value, authStore.user.id);

    // Update the task's assigned users
    task.value.assignedUsers = selectedUsers.value;
    toast.success('Users assigned to task successfully!');
  } catch (error) {
    console.error('Error assigning users:', error);
    toast.error(error.message || 'Failed to assign users');
  } finally {
    assigning.value = false;
    showAssignModal.value = false;
  }
}

</script>

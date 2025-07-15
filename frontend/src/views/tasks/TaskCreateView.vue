<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div class="mb-6 lg:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
              Create Task
            </h1>
            <p class="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Create a new task and assign it to team members
            </p>
          </div>
          <div class="flex-shrink-0">
            <button
              @click="goBack"
              class="btn-outline w-full sm:w-auto"
            >
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              Back to Tasks
            </button>
          </div>
        </div>
      </div>

      <div class="max-w-4xl mx-auto">
        <BaseCard>
          <form @submit.prevent="createTask" class="space-y-6">
              <div>
                <label class="form-label required">Task Title</label>
                <input
                  v-model="form.title"
                  type="text"
                  class="form-input"
                  :class="{ 'border-red-500': errors.title }"
                  placeholder="Enter task title..."
                  maxlength="255"
                  required
                />
                <div v-if="errors.title" class="form-error">{{ errors.title }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ form.title.length }}/255 characters
                </div>
              </div>

              <div>
                <label class="form-label">Description</label>
                <textarea
                  v-model="form.description"
                  rows="4"
                  class="form-input resize-none"
                  :class="{ 'border-red-500': errors.description }"
                  placeholder="Enter task description..."
                  maxlength="2000"
                ></textarea>
                <div v-if="errors.description" class="form-error">{{ errors.description }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ form.description.length }}/2000 characters
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label class="form-label required">Priority</label>
                  <select
                    v-model="form.priority"
                    class="form-input"
                    :class="{ 'border-red-500': errors.priority }"
                    required
                  >
                    <option value="">Select Priority</option>
                    <option value="low">泙 Low</option>
                    <option value="medium">泯 Medium</option>
                    <option value="high">泛 High</option>
                    <option value="urgent">閥 Urgent</option>
                  </select>
                  <div v-if="errors.priority" class="form-error">{{ errors.priority }}</div>
                </div>

                <div>
                  <label class="form-label">Deadline</label>
                  <input
                    v-model="form.deadline"
                    type="datetime-local"
                    class="form-input"
                    :class="{ 'border-red-500': errors.deadline }"
                    :min="minDateTime"
                  />
                  <div v-if="errors.deadline" class="form-error">{{ errors.deadline }}</div>
                </div>
              </div>

              <div>
                <label class="form-label">Assign To</label>
                
                <div v-if="loading" class="flex justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>

                <div v-else-if="availableUsers.length > 0" class="space-y-4">
                  <div class="relative">
                    <input
                      v-model="userSearch"
                      type="text"
                      class="form-input pl-10"
                      placeholder="Search users..."
                    />
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                  </div>

                  <div v-if="form.assignedUsers.length > 0" class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Selected Users ({{ form.assignedUsers.length }})
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="userId in form.assignedUsers"
                        :key="userId"
                        class="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                      >
                        {{ getUserById(userId)?.name || 'Unknown' }}
                        <button
                          @click="removeUser(userId)"
                          class="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                        >
                          <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    </div>
                  </div>

                  <div class="max-h-64 overflow-y-auto border rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                    <div
                      v-for="user in filteredUsers"
                      :key="user.id"
                      class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      @click="toggleUser(user.id)"
                    >
                      <input
                        :id="`user-${user.id}`"
                        v-model="form.assignedUsers"
                        :value="user.id"
                        type="checkbox"
                        class="form-checkbox"
                        @click.stop
                      />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-3">
                          <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span class="text-xs font-medium text-white">
                              {{ getUserInitials(user) }}
                            </span>
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {{ user.name }}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {{ user.email }}
                            </div>
                            <div v-if="user.role" class="text-xs text-gray-400 dark:text-gray-500 capitalize">
                              {{ user.role }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="filteredUsers.length === 0 && userSearch" class="text-center py-6 text-gray-500">
                    No users found matching "{{ userSearch }}"
                  </div>
                </div>

                <div v-else-if="!loadingUsers && availableUsers.length === 0" class="text-center py-8 text-gray-500">
                  <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <p class="mt-2">No users available for assignment</p>
                </div>

                <div v-if="errors.assignedUsers" class="form-error">{{ errors.assignedUsers }}</div>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  @click="goBack"
                  class="btn-outline w-full sm:w-auto order-2 sm:order-1"
                  :disabled="submitting"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn-primary w-full sm:w-auto order-1 sm:order-2"
                  :disabled="submitting || !isFormValid"
                >
                  <div v-if="submitting" class="flex items-center justify-center space-x-2">
                    <div class="spinner h-4 w-4"></div>
                    <span>Creating...</span>
                  </div>
                  <span v-else>Create Task</span>
                </button>
              </div>
            </form>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { BaseCard } from '@/components/ui'
import { usePermissions } from '@/utils/permissions'
import taskService from '@/services/tasks'
import userService from '@/services/users'
import { withErrorHandling } from '@/utils/errorHandler'

const router = useRouter()
const toast = useToast()
const { hasPermission } = usePermissions()

console.log('TaskCreateView: Component loaded. Checking permission (tasks.create):', hasPermission('tasks.create')); // Debug Log

// Check permission on component load
if (!hasPermission('tasks.create')) {
  console.warn('TaskCreateView: User does not have tasks.create permission. Redirecting to /unauthorized.') // Debug Log
  router.push('/unauthorized')
}

// Reactive state
const submitting = ref(false)
const loadingUsers = ref(false)
const availableUsers = ref([])
const userSearch = ref('')

// Form data - matches backend API structure
const form = reactive({
  title: '',
  description: '',
  priority: '',
  deadline: '',
  assignedUsers: []
})

// Form validation errors
const errors = reactive({
  title: '',
  description: '',
  priority: '',
  deadline: '',
  assignedUsers: ''
})

// Computed properties
const minDateTime = computed(() => {
  const now = new Date()
  // Set minimum to current time + 1 hour
  now.setHours(now.getHours() + 1)
  return now.toISOString().slice(0, 16)
})

const filteredUsers = computed(() => {
  if (!userSearch.value) return availableUsers.value
  
  const search = userSearch.value.toLowerCase()
  return availableUsers.value.filter(user => 
    user.name.toLowerCase().includes(search) ||
    user.email.toLowerCase().includes(search) ||
    (user.role && user.role.toLowerCase().includes(search))
  )
})

const isFormValid = computed(() => {
  return form.title.trim().length >= 3 && 
         form.priority && 
         !Object.values(errors).some(error => error)
})

// Utility functions
const getUserInitials = (user) => {
  if (!user) return 'U'
  const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

const getUserById = (id) => {
  return availableUsers.value.find(user => user.id === id)
}

const toggleUser = (userId) => {
  const index = form.assignedUsers.indexOf(userId)
  if (index > -1) {
    form.assignedUsers.splice(index, 1)
  } else {
    form.assignedUsers.push(userId)
  }
}

const removeUser = (userId) => {
  const index = form.assignedUsers.indexOf(userId)
  if (index > -1) {
    form.assignedUsers.splice(index, 1)
  }
}

// Form validation
const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  let isValid = true

  // Title validation
  if (!form.title.trim()) {
    errors.title = 'Task title is required'
    isValid = false
  } else if (form.title.trim().length < 3) {
    errors.title = 'Task title must be at least 3 characters'
    isValid = false
  } else if (form.title.length > 255) {
    errors.title = 'Task title must be less than 255 characters'
    isValid = false
  }

  // Description validation
  if (form.description.length > 2000) {
    errors.description = 'Task description must be less than 2000 characters'
    isValid = false
  }

  // Priority validation
  if (!form.priority) {
    errors.priority = 'Priority is required'
    isValid = false
  } else if (!['low', 'medium', 'high', 'urgent'].includes(form.priority)) {
    errors.priority = 'Please select a valid priority'
    isValid = false
  }

  // Deadline validation
  if (form.deadline) {
    const deadline = new Date(form.deadline)
    const now = new Date()
    
    if (isNaN(deadline.getTime())) {
      errors.deadline = 'Please enter a valid deadline'
      isValid = false
    } else if (deadline <= now) {
      errors.deadline = 'Deadline must be in the future'
      isValid = false
    }
  }

  // Assigned users validation
  if (form.assignedUsers.length > 0) {
    const invalidUsers = form.assignedUsers.filter(id => !Number.isInteger(id) || id <= 0)
    if (invalidUsers.length > 0) {
      errors.assignedUsers = 'Invalid user selection'
      isValid = false
    }
  }

  return isValid
}

// Main form submission
const createTask = withErrorHandling(async () => {
  if (!validateForm()) {
    toast.error('Please fix the errors in the form')
    return
  }

  submitting.value = true

  try {
    // Prepare task data for backend API
    const taskData = {
      title: form.title.trim(),
      description: form.description.trim() || '',
      priority: form.priority,
      deadline: form.deadline || null,
      assignedUsers: form.assignedUsers // Backend expects array of user IDs
    }

    // Use the service validation
    const validation = taskService.validateTaskData(taskData)
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error))
      return
    }

    const newTask = await taskService.createTask(taskData)
    
    toast.success('Task created successfully!')
    router.push({ name: 'task-detail', params: { id: newTask.id } })
  } catch (error) {
    console.error('Error creating task:', error)
    toast.error(error.message || 'Failed to create task')
  } finally {
    submitting.value = false
  }
}, { context: 'Creating task' })

// Load users for assignment
const loadUsers = withErrorHandling(async () => {
  loadingUsers.value = true
  
  try {
    // Get all users or use specific endpoint if available
    const response = await userService.getUsers({ limit: 100 })
    
    // Filter out inactive users and current user if needed
    availableUsers.value = response.users.filter(user => 
      user.status !== 'inactive' && user.status !== 'suspended'
    )
  } catch (error) {
    console.error('Error loading users:', error)
    toast.error('Failed to load users for assignment')
    availableUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}, { context: 'Loading users' })

const goBack = () => {
  router.push({ name: 'tasks' })
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-error {
  @apply text-sm text-red-600 dark:text-red-400 mt-1;
}

.form-checkbox {
  @apply h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-outline {
  @apply border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.spinner {
  @apply animate-spin rounded-full border-2 border-transparent border-t-current;
}

/* Mobile-specific optimizations */
@media (max-width: 640px) {
  .form-input {
    @apply text-base; /* Prevents zoom on iOS */
  }
}
</style>
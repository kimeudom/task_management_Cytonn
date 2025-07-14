<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Task
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Update task details and assignments
          </p>
        </div>
        <button
          @click="goBack"
          class="btn-outline"
        >
          <ArrowLeftIcon class="w-4 h-4 mr-2" />
          Back to Task
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="spinner h-8 w-8"></div>
      </div>

      <!-- Edit Task Form -->
      <div v-else-if="task" class="max-w-4xl">
        <BaseCard>
          <template #body>
            <form @submit.prevent="updateTask" class="space-y-6">
              <!-- Basic Information -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="lg:col-span-2">
                  <label class="form-label required">Task Title</label>
                  <input
                    v-model="form.title"
                    type="text"
                    class="form-input"
                    placeholder="Enter task title..."
                    required
                  />
                  <div v-if="errors.title" class="form-error">{{ errors.title }}</div>
                </div>

                <div class="lg:col-span-2">
                  <label class="form-label">Description</label>
                  <textarea
                    v-model="form.description"
                    rows="4"
                    class="form-input"
                    placeholder="Enter task description..."
                  ></textarea>
                  <div v-if="errors.description" class="form-error">{{ errors.description }}</div>
                </div>

                <div>
                  <label class="form-label required">Status</label>
                  <select v-model="form.status" class="form-input" required>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div v-if="errors.status" class="form-error">{{ errors.status }}</div>
                </div>

                <div>
                  <label class="form-label required">Priority</label>
                  <select v-model="form.priority" class="form-input" required>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div v-if="errors.priority" class="form-error">{{ errors.priority }}</div>
                </div>

                <div class="lg:col-span-2">
                  <label class="form-label">Deadline</label>
                  <input
                    v-model="form.deadline"
                    type="datetime-local"
                    class="form-input"
                  />
                  <div v-if="errors.deadline" class="form-error">{{ errors.deadline }}</div>
                </div>
              </div>

              <!-- Assignment -->
              <div>
                <label class="form-label">Assign To</label>
                <div v-if="loadingUsers" class="flex items-center space-x-2">
                  <div class="spinner h-4 w-4"></div>
                  <span class="text-sm text-gray-600">Loading users...</span>
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="user in availableUsers"
                    :key="user.id"
                    class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <input
                      :id="`user-${user.id}`"
                      v-model="form.assignedUsers"
                      :value="user.id"
                      type="checkbox"
                      class="form-checkbox"
                    />
                    <label :for="`user-${user.id}`" class="flex-1 cursor-pointer">
                      <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span class="text-xs font-medium text-white">
                            {{ getUserInitials(user) }}
                          </span>
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ user.name }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">
                            {{ user.email }}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                <div v-if="errors.assignedUsers" class="form-error">{{ errors.assignedUsers }}</div>
              </div>

              <!-- Form Actions -->
              <div class="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  @click="goBack"
                  class="btn-outline"
                  :disabled="submitting"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn-primary"
                  :disabled="submitting"
                >
                  <div v-if="submitting" class="flex items-center space-x-2">
                    <div class="spinner h-4 w-4"></div>
                    <span>Updating...</span>
                  </div>
                  <span v-else>Update Task</span>
                </button>
              </div>
            </form>
          </template>
        </BaseCard>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <div class="text-red-600 mb-4">
          <ExclamationTriangleIcon class="w-12 h-12 mx-auto mb-2" />
          <h3 class="text-lg font-medium">Task Not Found</h3>
          <p class="text-sm">The task you're looking for doesn't exist or you don't have permission to edit it.</p>
        </div>
        <button @click="goBack" class="btn-primary">
          Back to Tasks
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { BaseCard } from '@/components/ui'
import { usePermissions } from '@/utils/permissions'
import taskService from '@/services/tasks'
import userService from '@/services/users'
import { withErrorHandling } from '@/utils/errorHandler'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission, canPerformTaskAction } = usePermissions()

const taskId = route.params.id
const loading = ref(true)
const submitting = ref(false)
const loadingUsers = ref(false)
const task = ref(null)
const availableUsers = ref([])

const form = reactive({
  title: '',
  description: '',
  status: '',
  priority: '',
  deadline: '',
  assignedUsers: []
})

const errors = reactive({
  title: '',
  description: '',
  status: '',
  priority: '',
  deadline: '',
  assignedUsers: ''
})

const getUserInitials = (user) => {
  const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().slice(0, 16)
}

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
  } else if (form.title.length < 3) {
    errors.title = 'Task title must be at least 3 characters'
    isValid = false
  }

  // Status validation
  if (!form.status) {
    errors.status = 'Status is required'
    isValid = false
  }

  // Priority validation
  if (!form.priority) {
    errors.priority = 'Priority is required'
    isValid = false
  }

  // Deadline validation
  if (form.deadline) {
    const deadline = new Date(form.deadline)
    if (isNaN(deadline.getTime())) {
      errors.deadline = 'Invalid deadline format'
      isValid = false
    }
  }

  return isValid
}

const loadTask = withErrorHandling(async () => {
  loading.value = true
  
  try {
    const taskData = await taskService.getTaskById(taskId)
    task.value = taskData
    
    // Check permission to edit this task
    if (!canPerformTaskAction(taskData, 'update')) {
      router.push('/unauthorized')
      return
    }
    
    // Populate form
    form.title = taskData.title
    form.description = taskData.description || ''
    form.status = taskData.status
    form.priority = taskData.priority
    form.deadline = formatDateForInput(taskData.deadline)
    form.assignedUsers = taskData.assignedUsers || []
  } finally {
    loading.value = false
  }
}, { context: 'Loading task' })

const loadUsers = withErrorHandling(async () => {
  loadingUsers.value = true
  
  try {
    const users = await userService.getUsersForAssignment()
    availableUsers.value = users
  } finally {
    loadingUsers.value = false
  }
}, { context: 'Loading users' })

const updateTask = withErrorHandling(async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true

  try {
    const taskData = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      deadline: form.deadline || null,
      assignedUsers: form.assignedUsers
    }

    await taskService.updateTask(taskId, taskData)
    
    toast.success('Task updated successfully!')
    router.push({ name: 'task-detail', params: { id: taskId } })
  } finally {
    submitting.value = false
  }
}, { context: 'Updating task' })

const goBack = () => {
  router.push({ name: 'task-detail', params: { id: taskId } })
}

onMounted(async () => {
  await Promise.all([
    loadTask(),
    loadUsers()
  ])
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #ef4444;
}

.form-checkbox {
  @apply h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}

.form-error {
  @apply text-sm text-red-600 mt-1;
}

.spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
}
</style>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Create Task
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Create a new task and assign it to team members
          </p>
        </div>
        <button
          @click="goBack"
          class="btn-outline"
        >
          <ArrowLeftIcon class="w-4 h-4 mr-2" />
          Back to Tasks
        </button>
      </div>

      <!-- Create Task Form -->
      <div class="max-w-4xl">
        <BaseCard>
          <template #body>
            <form @submit.prevent="createTask" class="space-y-6">
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
                  <label class="form-label required">Priority</label>
                  <select v-model="form.priority" class="form-input" required>
                    <option value="">Select Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div v-if="errors.priority" class="form-error">{{ errors.priority }}</div>
                </div>

                <div>
                  <label class="form-label">Deadline</label>
                  <input
                    v-model="form.deadline"
                    type="date"
                    class="form-input"
                    :max="parentTaskDeadline || null"
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
                  <div v-if="availableUsers.length === 0" class="text-center py-4 text-gray-500">
                    No users available for assignment
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
                    <span>Creating...</span>
                  </div>
                  <span v-else>Create Task</span>
                </button>
              </div>
            </form>
          </template>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
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

// Check permission
if (!hasPermission('tasks.create')) {
  router.push('/unauthorized')
}

const submitting = ref(false)
const loadingUsers = ref(false)
const availableUsers = ref([])

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  deadline: '',
  assignedUsers: []
})

const errors = reactive({
  title: '',
  description: '',
  priority: '',
  deadline: '',
  assignedUsers: ''
})

const getUserInitials = (user) => {
  const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
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

  // Priority validation
  if (!form.priority) {
    errors.priority = 'Priority is required'
    isValid = false
  }

  // Deadline validation
  if (form.deadline) {
    const deadline = new Date(form.deadline)
    const now = new Date()
    if (deadline <= now) {
      errors.deadline = 'Deadline must be in the future'
      isValid = false
    }
  }

  return isValid
}

const createTask = withErrorHandling(async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true

  try {
    const taskData = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      deadline: form.deadline || null,
      assignedUsers: form.assignedUsers
    }

    const newTask = await taskService.createTask(taskData)
    
    toast.success('Task created successfully!')
    router.push({ name: 'task-detail', params: { id: newTask.id } })
  } finally {
    submitting.value = false
  }
}, { context: 'Creating task' })

const loadUsers = withErrorHandling(async () => {
  loadingUsers.value = true
  
  try {
    const users = await userService.getUsersForAssignment()
    availableUsers.value = users
  } finally {
    loadingUsers.value = false
  }
}, { context: 'Loading users' })

const goBack = () => {
  router.push({ name: 'tasks' })
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #ef4444;
}
</style>

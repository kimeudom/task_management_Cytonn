<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            @click="$router.go(-1)"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeftIcon class="h-6 w-6" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Task Details
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Task ID: {{ $route.params.id }}
            </p>
          </div>
        </div>
      </div>

      <!-- Task Details Card -->
      <div class="card">
        <div class="card-body">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="spinner h-8 w-8"></div>
          </div>
          <div v-else-if="!task" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">Task not found</p>
          </div>
          <div v-else>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {{ task.title }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              {{ task.description }}
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Task Information
                </h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd class="mt-1">
                      <span class="badge" :class="getStatusBadgeClass(task.status)">
                        {{ task.status }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</dt>
                    <dd class="mt-1">
                      <span class="badge" :class="getPriorityBadgeClass(task.priority)">
                        {{ task.priority }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ formatDate(task.deadline) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ formatDate(task.createdAt) }}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Assignment
                </h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ task.createdByName || 'Unknown' }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ task.assignedToName || 'Unassigned' }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="task" class="card-footer">
          <div class="flex justify-end space-x-3">
            <button
              v-if="canEditTask"
              @click="editTask"
              class="btn-primary"
            >
              Edit Task
            </button>
            <button
              v-if="canDeleteTask"
              @click="deleteTask"
              class="btn-danger"
            >
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

// Composables
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tasksStore = useTasksStore()
const toast = useToast()

// Reactive state
const loading = ref(true)
const task = ref(null)

// Computed properties
const canEditTask = computed(() => {
  if (!task.value) return false
  return authStore.isManagerOrAdmin || task.value.assignedTo === authStore.user?.id
})

const canDeleteTask = computed(() => {
  return authStore.isManagerOrAdmin
})

// Methods
const formatDate = (date) => {
  if (!date) return 'Not set'
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

const editTask = () => {
  router.push({ name: 'task-edit', params: { id: task.value.id } })
}

const deleteTask = () => {
  // TODO: Implement delete task functionality
  console.log('Delete task:', task.value)
}

const fetchTask = async () => {
  try {
    loading.value = true
    const taskId = route.params.id

    // Use the tasks store to fetch task details
    await tasksStore.loadTask(taskId)
    task.value = tasksStore.currentTask

    if (!task.value) {
      throw new Error('Task not found')
    }
  } catch (error) {
    console.error('Error fetching task:', error)
    toast.error('Failed to load task details')
    router.push({ name: 'tasks' })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchTask()
})
</script>

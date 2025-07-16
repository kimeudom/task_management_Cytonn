<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="px-4 lg:px-8 py-4 lg:py-8 max-w-4xl mx-auto">
      <div class="flex items-center mb-6">
        <button @click="goBack" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeftIcon class="h-6 w-6" />
        </button>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white ml-4">
          Edit Task
        </h1>
      </div>

      <div v-if="loading" class="text-center py-12">
        <p>Loading task...</p>
      </div>
      <div v-else-if="error" class="text-center py-12 text-red-500">
        <p>{{ error }}</p>
      </div>
      <form v-else @submit.prevent="updateTask" class="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            id="title"
            v-model="task.title"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter task title..."
          />
        </div>
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            id="description"
            v-model="task.description"
            rows="4"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter task description..."
          ></textarea>
        </div>
        <div>
          <label for="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
          <select
            id="priority"
            v-model="task.priority"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option v-for="p in priorities" :key="p" :value="p">{{ getPriorityLabel(p) }}</option>
          </select>
        </div>
        <div>
          <label for="deadline" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
          <input
            type="datetime-local"
            id="deadline"
            v-model="task.deadline"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label for="assignedUsers" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Users</label>
          <select
            id="assignedUsers"
            v-model="task.assignedUsers"
            multiple
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
            size="5"
          >
            <option v-for="user in availableUsers" :key="user.id" :value="user.id">
              {{ getUserDisplayName(user) }}
            </option>
          </select>
          <div class="mt-2 text-sm text-gray-500">
            Hold Ctrl/Cmd to select multiple users
          </div>
        </div>
        <div class="flex justify-end space-x-4">
          <button
            type="button"
            @click="goBack"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Updating...' : 'Update Task' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import taskService from '@/services/tasks'
import userService from '@/services/users'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const loading = ref(true)
const task = reactive({
  title: '',
  description: '',
  priority: 'medium',
  deadline: '',
  assignedUsers: [],
})
const availableUsers = ref([])
const error = ref(null)
const isSubmitting = ref(false)

const priorities = ['low', 'medium', 'high', 'urgent']

const getPriorityLabel = (priority) => {
  const labels = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  }
  return labels[priority] || priority
}

const fetchTask = async () => {
  try {
    loading.value = true
    const taskId = route.params.id
    const fetchedTask = await taskService.getTaskById(taskId)

    if (!authStore.isManagerOrAdmin && fetchedTask.createdBy !== authStore.user?.id) {
      toast.error('You do not have permission to edit this task.')
      router.push({ name: 'tasks' })
      return
    }

    Object.assign(task, {
      ...fetchedTask,
      deadline: fetchedTask.deadline ? new Date(fetchedTask.deadline).toISOString().slice(0, 16) : '',
      assignedUsers: fetchedTask.assignedUsers ? fetchedTask.assignedUsers.map(u => u.id || u) : [],
    })

    console.log('TaskEditView: Loaded task:', {
      id: fetchedTask.id,
      title: fetchedTask.title,
      assignedUsers: task.assignedUsers
    })
  } catch (err) {
    error.value = err.message || 'Failed to load task details.'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const users = await userService.getUsersForAssignment()
    availableUsers.value = users.filter(user =>
      user.id &&
      user.name &&
      user.name !== 'Unknown User'
    )
    console.log('TaskEditView: Loaded users for assignment:', availableUsers.value.length)
  } catch (err) {
    console.error('TaskEditView: Failed to load users:', err)
    toast.error('Failed to load users.')
  }
}

const updateTask = async () => {
  isSubmitting.value = true
  try {
    const taskId = route.params.id

    // Prepare update data
    const updateData = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
      assignedUsers: task.assignedUsers
    }

    console.log('TaskEditView: Updating task with data:', updateData)

    await taskService.updateTask(taskId, updateData)
    toast.success('Task updated successfully!')
    router.push({ name: 'task-detail', params: { id: taskId } })
  } catch (err) {
    console.error('TaskEditView: Update failed:', err)
    toast.error(err.message || 'Failed to update task.')
  } finally {
    isSubmitting.value = false
  }
}

const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User'

  // Try different name combinations
  if (user.name && user.name !== 'Unknown User') {
    return user.name
  }

  const firstName = user.firstName || ''
  const lastName = user.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()

  if (fullName) {
    return fullName
  }

  return user.username || user.email || 'Unknown User'
}

const goBack = () => {
  router.go(-1)
}

onMounted(() => {
  fetchTask()
  fetchUsers()
})
</script>

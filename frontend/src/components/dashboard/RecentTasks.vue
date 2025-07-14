<template>
  <BaseCard>
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Recent Tasks</h3>
      
      <div class="flex items-center space-x-2">
        <!-- Filter dropdown -->
        <select
          v-model="selectedFilter"
          class="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Tasks</option>
          <option value="assigned">Assigned to Me</option>
          <option value="created">Created by Me</option>
          <option value="overdue">Overdue</option>
        </select>
        
        <!-- View all link -->
        <button
          @click="viewAllTasks"
          class="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View all →
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tasks list -->
    <div v-else-if="filteredTasks.length > 0" class="space-y-4">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        @click="navigateToTask(task.id)"
        class="group flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      >
        <!-- Status indicator -->
        <div class="flex-shrink-0">
          <div
            :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center',
              getStatusBgClass(task.status)
            ]"
          >
            <component
              :is="getStatusIcon(task.status)"
              :class="getStatusIconClass(task.status)"
              class="w-5 h-5"
            />
          </div>
        </div>

        <!-- Task info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {{ task.title }}
            </h4>
            <span class="text-xs text-gray-500 ml-2">
              {{ formatRelativeTime(task.updatedAt) }}
            </span>
          </div>
          
          <div class="flex items-center space-x-4 mt-1">
            <BaseBadge
              :variant="getStatusVariant(task.status)"
              size="xs"
            >
              {{ getStatusLabel(task.status) }}
            </BaseBadge>
            
            <BaseBadge
              :variant="getPriorityVariant(task.priority)"
              size="xs"
            >
              {{ getPriorityLabel(task.priority) }}
            </BaseBadge>
            
            <span v-if="task.deadline" class="text-xs text-gray-500">
              Due {{ formatDeadline(task.deadline) }}
            </span>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div class="flex items-center space-x-1">
            <button
              v-if="canUpdateTaskStatus(task)"
              @click.stop="quickStatusUpdate(task)"
              :class="getQuickActionClass(task.status)"
              class="p-1 rounded-full transition-colors"
              :title="getQuickActionTitle(task.status)"
            >
              <CheckIcon v-if="task.status !== 'completed'" class="w-4 h-4" />
              <ArrowPathIcon v-else class="w-4 h-4" />
            </button>
            
            <button
              @click.stop="navigateToTask(task.id)"
              class="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="View details"
            >
              <EyeIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <ClipboardDocumentListIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h4 class="text-lg font-medium text-gray-900 mb-2">No tasks found</h4>
      <p class="text-gray-600 mb-4">
        {{ getEmptyStateMessage() }}
      </p>
      <button
        v-if="canCreateTasks && selectedFilter === 'all'"
        @click="createTask"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        Create Task
      </button>
    </div>
  </BaseCard>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  CheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import { usePermissions } from '@/utils/permissions'
import { getStatusLabel, getPriorityLabel } from '@/utils/dataTransforms'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const router = useRouter()
const toast = useToast()
const tasksStore = useTasksStore()
const authStore = useAuthStore()
const { hasPermission, canPerformTaskAction } = usePermissions()

const loading = ref(false)
const selectedFilter = ref('all')
const recentTasks = ref([])

const canCreateTasks = computed(() => {
  return hasPermission('tasks.create')
})

const filteredTasks = computed(() => {
  let tasks = recentTasks.value

  switch (selectedFilter.value) {
    case 'assigned':
      tasks = tasks.filter(task => 
        task.assignedUsers?.includes(authStore.user?.id)
      )
      break
    case 'created':
      tasks = tasks.filter(task => 
        task.createdBy === authStore.user?.id
      )
      break
    case 'overdue':
      tasks = tasks.filter(task => {
        if (!task.deadline) return false
        return new Date(task.deadline) < new Date() && task.status !== 'completed'
      })
      break
  }

  return tasks.slice(0, 5) // Show only 5 most recent
})

const getStatusIcon = (status) => {
  const icons = {
    pending: ClockIcon,
    in_progress: ClockIcon,
    completed: CheckCircleIcon,
    cancelled: XCircleIcon
  }
  return icons[status] || ClockIcon
}

const getStatusBgClass = (status) => {
  const classes = {
    pending: 'bg-gray-100',
    in_progress: 'bg-blue-100',
    completed: 'bg-green-100',
    cancelled: 'bg-red-100'
  }
  return classes[status] || classes.pending
}

const getStatusIconClass = (status) => {
  const classes = {
    pending: 'text-gray-600',
    in_progress: 'text-blue-600',
    completed: 'text-green-600',
    cancelled: 'text-red-600'
  }
  return classes[status] || classes.pending
}

const getStatusVariant = (status) => {
  const variants = {
    pending: 'gray',
    in_progress: 'blue',
    completed: 'green',
    cancelled: 'red'
  }
  return variants[status] || 'gray'
}

const getPriorityVariant = (priority) => {
  const variants = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  }
  return variants[priority] || 'gray'
}

const getQuickActionClass = (status) => {
  if (status === 'completed') {
    return 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
  }
  return 'text-green-600 hover:text-green-700 hover:bg-green-50'
}

const getQuickActionTitle = (status) => {
  return status === 'completed' ? 'Mark as in progress' : 'Mark as completed'
}

const getEmptyStateMessage = () => {
  switch (selectedFilter.value) {
    case 'assigned':
      return 'No tasks are currently assigned to you.'
    case 'created':
      return 'You haven\'t created any tasks yet.'
    case 'overdue':
      return 'No overdue tasks. Great job!'
    default:
      return 'No recent tasks to display.'
  }
}

const canUpdateTaskStatus = (task) => {
  return canPerformTaskAction(task, 'update_status', authStore.user)
}

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const formatDeadline = (deadline) => {
  const date = new Date(deadline)
  const now = new Date()
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  return `in ${diffDays} days`
}

const loadRecentTasks = async () => {
  if (!hasPermission('tasks.view')) return

  loading.value = true
  
  try {
    await tasksStore.loadTasks({ 
      page: 1, 
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    })
    recentTasks.value = tasksStore.tasks
  } catch (error) {
    console.error('Failed to load recent tasks:', error)
  } finally {
    loading.value = false
  }
}

const navigateToTask = (taskId) => {
  router.push({
    name: 'task-detail',
    params: { id: taskId }
  })
}

const viewAllTasks = () => {
  const query = {}
  
  if (selectedFilter.value !== 'all') {
    switch (selectedFilter.value) {
      case 'assigned':
        query.assignedTo = authStore.user?.id
        break
      case 'created':
        query.createdBy = authStore.user?.id
        break
      case 'overdue':
        query.overdue = 'true'
        break
    }
  }

  router.push({
    name: 'tasks',
    query
  })
}

const createTask = () => {
  router.push({ name: 'task-create' })
}

const quickStatusUpdate = async (task) => {
  if (!canUpdateTaskStatus(task)) {
    toast.warning('You do not have permission to update this task status')
    return
  }

  try {
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed'
    await tasksStore.updateTaskStatus(task.id, newStatus)
    
    // Update local task
    const taskIndex = recentTasks.value.findIndex(t => t.id === task.id)
    if (taskIndex !== -1) {
      recentTasks.value[taskIndex].status = newStatus
    }
    
    toast.success(`Task marked as ${getStatusLabel(newStatus).toLowerCase()}`)
  } catch (error) {
    console.error('Failed to update task status:', error)
    toast.error('Failed to update task status')
  }
}

// Watch for filter changes
watch(selectedFilter, () => {
  // No need to reload, just filter existing data
})

onMounted(() => {
  loadRecentTasks()
})
</script>

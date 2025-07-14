<template>
  <BaseCard 
    :class="[
      'group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
      statusBorderClass,
      { 'opacity-75': task.status === 'completed' }
    ]"
    @click="navigateToTask"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {{ task.title }}
        </h3>
        <p v-if="task.description" class="text-sm text-gray-600 mt-1 line-clamp-2">
          {{ task.description }}
        </p>
      </div>
      
      <!-- Quick actions -->
      <div class="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          v-if="canUpdateStatus"
          @click.stop="toggleTaskStatus"
          :class="statusButtonClass"
          class="p-1 rounded-full transition-colors"
          :title="getStatusToggleTitle()"
        >
          <CheckIcon v-if="task.status !== 'completed'" class="w-4 h-4" />
          <ArrowPathIcon v-else class="w-4 h-4" />
        </button>
        
        <button
          v-if="canEdit"
          @click.stop="editTask"
          class="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="Edit task"
        >
          <PencilIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Status and Priority -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <BaseBadge 
          :variant="getStatusVariant(task.status)"
          size="sm"
        >
          {{ getStatusLabel(task.status) }}
        </BaseBadge>
        
        <BaseBadge 
          :variant="getPriorityVariant(task.priority)"
          size="sm"
        >
          {{ getPriorityLabel(task.priority) }}
        </BaseBadge>
      </div>
      
      <!-- Deadline -->
      <div v-if="task.deadline" class="flex items-center space-x-1 text-sm">
        <CalendarIcon class="w-4 h-4" :class="deadlineColorClass" />
        <span :class="deadlineColorClass">
          {{ formatDeadline(task.deadline) }}
        </span>
      </div>
    </div>

    <!-- Assignment and Creator -->
    <div class="flex items-center justify-between text-sm text-gray-600">
      <div class="flex items-center space-x-2">
        <UsersIcon class="w-4 h-4" />
        <span>
          {{ getAssignmentText() }}
        </span>
      </div>
      
      <div class="flex items-center space-x-1">
        <span>by {{ task.createdByName || 'Unknown' }}</span>
      </div>
    </div>

    <!-- Progress indicator for in-progress tasks -->
    <div v-if="task.status === 'in_progress'" class="mt-3">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: `${getProgressPercentage()}%` }"
        ></div>
      </div>
      <div class="text-xs text-gray-500 mt-1">
        {{ getProgressPercentage() }}% complete
      </div>
    </div>

    <!-- Loading overlay -->
    <div 
      v-if="updating"
      class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg"
    >
      <LoadingSpinner size="sm" />
    </div>
  </BaseCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  CheckIcon,
  PencilIcon,
  CalendarIcon,
  UsersIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import { usePermissions } from '@/utils/permissions'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import { getStatusLabel, getPriorityLabel } from '@/utils/dataTransforms'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'statusChanged'])

const router = useRouter()
const toast = useToast()
const { canPerformTaskAction } = usePermissions()
const tasksStore = useTasksStore()
const authStore = useAuthStore()

const updating = ref(false)

const canEdit = computed(() => {
  return canPerformTaskAction(props.task, 'update', authStore.user)
})

const canUpdateStatus = computed(() => {
  return canPerformTaskAction(props.task, 'update_status', authStore.user)
})

const statusBorderClass = computed(() => {
  const classes = {
    pending: 'border-l-4 border-gray-400',
    in_progress: 'border-l-4 border-blue-500',
    completed: 'border-l-4 border-green-500',
    cancelled: 'border-l-4 border-red-500'
  }
  return classes[props.task.status] || classes.pending
})

const statusButtonClass = computed(() => {
  if (props.task.status === 'completed') {
    return 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
  }
  return 'text-green-600 hover:text-green-700 hover:bg-green-50'
})

const deadlineColorClass = computed(() => {
  if (!props.task.deadline) return 'text-gray-500'
  
  const deadline = new Date(props.task.deadline)
  const now = new Date()
  const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'text-red-600' // Overdue
  if (diffDays <= 1) return 'text-orange-600' // Due soon
  if (diffDays <= 3) return 'text-yellow-600' // Due this week
  return 'text-gray-500' // Normal
})

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

const getAssignmentText = () => {
  if (!props.task.assignedUsers || props.task.assignedUsers.length === 0) {
    return 'Unassigned'
  }
  
  if (props.task.assignedUsers.length === 1) {
    return `Assigned to ${props.task.assignedToName || '1 user'}`
  }
  
  return `Assigned to ${props.task.assignedUsers.length} users`
}

const formatDeadline = (deadline) => {
  const date = new Date(deadline)
  const now = new Date()
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`
  } else if (diffDays === 0) {
    return 'Due today'
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return date.toLocaleDateString()
  }
}

const getProgressPercentage = () => {
  // This would typically be calculated based on subtasks or other criteria
  // For now, we'll use a simple time-based calculation
  if (!props.task.deadline) return 50
  
  const created = new Date(props.task.createdAt)
  const deadline = new Date(props.task.deadline)
  const now = new Date()
  
  const totalTime = deadline - created
  const elapsedTime = now - created
  
  return Math.min(Math.max(Math.round((elapsedTime / totalTime) * 100), 0), 100)
}

const getStatusToggleTitle = () => {
  return props.task.status === 'completed' ? 'Mark as in progress' : 'Mark as completed'
}

const navigateToTask = () => {
  router.push({
    name: 'task-detail',
    params: { id: props.task.id }
  })
}

const editTask = () => {
  emit('edit', props.task)
}

const toggleTaskStatus = async () => {
  if (!canUpdateStatus.value) {
    toast.warning('You do not have permission to update this task status')
    return
  }

  updating.value = true
  
  try {
    const newStatus = props.task.status === 'completed' ? 'in_progress' : 'completed'
    await tasksStore.updateTaskStatus(props.task.id, newStatus)
    
    emit('statusChanged', {
      taskId: props.task.id,
      oldStatus: props.task.status,
      newStatus
    })
    
    toast.success(`Task marked as ${getStatusLabel(newStatus).toLowerCase()}`)
  } catch (error) {
    console.error('Failed to update task status:', error)
    toast.error('Failed to update task status')
  } finally {
    updating.value = false
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

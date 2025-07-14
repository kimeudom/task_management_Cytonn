<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Total Tasks -->
    <DashboardStatCard
      title="Total Tasks"
      :value="stats.totalTasks"
      icon="DocumentTextIcon"
      color="blue"
      :loading="loading"
      @click="navigateToTasks()"
      class="cursor-pointer hover:shadow-lg transition-shadow"
    >
      <template #subtitle>
        <span class="text-sm text-gray-600">
          {{ getTasksGrowth() }}
        </span>
      </template>
    </DashboardStatCard>

    <!-- In Progress Tasks -->
    <DashboardStatCard
      title="In Progress"
      :value="stats.inProgressTasks"
      icon="ClockIcon"
      color="yellow"
      :loading="loading"
      @click="navigateToTasks({ status: 'in_progress' })"
      class="cursor-pointer hover:shadow-lg transition-shadow"
    >
      <template #subtitle>
        <span class="text-sm text-gray-600">
          Active tasks
        </span>
      </template>
    </DashboardStatCard>

    <!-- Completed Tasks -->
    <DashboardStatCard
      title="Completed"
      :value="stats.completedTasks"
      icon="CheckCircleIcon"
      color="green"
      :loading="loading"
      @click="navigateToTasks({ status: 'completed' })"
      class="cursor-pointer hover:shadow-lg transition-shadow"
    >
      <template #subtitle>
        <span class="text-sm text-gray-600">
          {{ getCompletionRate() }}% completion rate
        </span>
      </template>
    </DashboardStatCard>

    <!-- Overdue Tasks -->
    <DashboardStatCard
      title="Overdue"
      :value="stats.overdueTasks"
      icon="ExclamationTriangleIcon"
      color="red"
      :loading="loading"
      @click="navigateToTasks({ overdue: true })"
      class="cursor-pointer hover:shadow-lg transition-shadow"
    >
      <template #subtitle>
        <span class="text-sm text-gray-600">
          Need attention
        </span>
      </template>
    </DashboardStatCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { usePermissions } from '@/utils/permissions'
import DashboardStatCard from './DashboardStatCard.vue'

const router = useRouter()
const tasksStore = useTasksStore()
const { hasPermission } = usePermissions()

const loading = ref(false)
const stats = ref({
  totalTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  pendingTasks: 0
})

const getCompletionRate = computed(() => {
  if (stats.value.totalTasks === 0) return 0
  return Math.round((stats.value.completedTasks / stats.value.totalTasks) * 100)
})

const getTasksGrowth = computed(() => {
  // This would typically come from historical data
  // For now, we'll show a placeholder
  return '+12% from last month'
})

const navigateToTasks = (filters = {}) => {
  if (!hasPermission('tasks.view')) {
    return
  }

  const query = {}
  
  if (filters.status) {
    query.status = filters.status
  }
  
  if (filters.overdue) {
    query.overdue = 'true'
  }

  router.push({
    name: 'tasks',
    query
  })
}

const loadStats = async () => {
  if (!hasPermission('dashboard.view')) {
    return
  }

  loading.value = true
  
  try {
    await tasksStore.loadTaskStats()
    stats.value = tasksStore.stats
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})

// Refresh stats when tasks are updated
tasksStore.$subscribe((mutation, state) => {
  if (mutation.type === 'direct' && mutation.events.some(e => e.key === 'tasks')) {
    loadStats()
  }
})
</script>

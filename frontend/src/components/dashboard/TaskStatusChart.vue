<template>
  <BaseCard class="h-96">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Task Status Distribution</h3>
      
      <!-- Chart type selector -->
      <div class="flex items-center space-x-2">
        <button
          v-for="type in chartTypes"
          :key="type.value"
          @click="selectedChartType = type.value"
          :class="[
            'px-3 py-1 text-sm rounded-md transition-colors',
            selectedChartType === type.value
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          ]"
        >
          {{ type.label }}
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <LoadingSpinner />
    </div>

    <!-- Chart container -->
    <div v-else class="relative h-64">
      <canvas ref="chartCanvas"></canvas>
      
      <!-- No data state -->
      <div 
        v-if="!hasData"
        class="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg"
      >
        <div class="text-center">
          <ChartBarIcon class="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p class="text-gray-600">No task data available</p>
          <button
            v-if="canCreateTasks"
            @click="createTask"
            class="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Create your first task
          </button>
        </div>
      </div>
    </div>

    <!-- Legend with clickable items -->
    <div v-if="hasData" class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="(item, index) in legendItems"
        :key="item.label"
        @click="toggleDataset(index)"
        class="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
        :class="{ 'opacity-50': item.hidden }"
      >
        <div
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: item.color }"
        ></div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900">{{ item.value }}</div>
          <div class="text-xs text-gray-600 truncate">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <!-- Drill-down actions -->
    <div v-if="hasData" class="mt-4 flex items-center justify-between text-sm">
      <span class="text-gray-600">Click on chart segments to view tasks</span>
      <button
        @click="viewAllTasks"
        class="text-blue-600 hover:text-blue-700 font-medium"
      >
        View all tasks →
      </button>
    </div>
  </BaseCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'
import { ChartBarIcon } from '@heroicons/vue/24/outline'
import { useTasksStore } from '@/stores/tasks'
import { usePermissions } from '@/utils/permissions'
import { getStatusLabel } from '@/utils/dataTransforms'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

// Register Chart.js components
Chart.register(...registerables)

const router = useRouter()
const tasksStore = useTasksStore()
const { hasPermission } = usePermissions()

const chartCanvas = ref(null)
const chart = ref(null)
const loading = ref(false)
const selectedChartType = ref('doughnut')

const chartTypes = [
  { value: 'doughnut', label: 'Doughnut' },
  { value: 'pie', label: 'Pie' },
  { value: 'bar', label: 'Bar' }
]

const chartData = ref({
  pending: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0
})

const chartColors = {
  pending: '#6B7280',
  in_progress: '#3B82F6',
  completed: '#10B981',
  cancelled: '#EF4444'
}

const hasData = computed(() => {
  return Object.values(chartData.value).some(value => value > 0)
})

const canCreateTasks = computed(() => {
  return hasPermission('tasks.create')
})

const legendItems = computed(() => {
  return Object.entries(chartData.value).map(([status, value]) => ({
    label: getStatusLabel(status),
    value,
    color: chartColors[status],
    hidden: false
  }))
})

const createChartConfig = () => {
  const labels = Object.keys(chartData.value).map(status => getStatusLabel(status))
  const data = Object.values(chartData.value)
  const colors = Object.values(chartColors)

  const baseConfig = {
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color + '80'),
        borderWidth: 2,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // We'll use our custom legend
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.parsed || 0
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index
          const status = Object.keys(chartData.value)[index]
          navigateToTasksByStatus(status)
        }
      }
    }
  }

  // Chart type specific configurations
  if (selectedChartType.value === 'bar') {
    baseConfig.options.scales = {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  return baseConfig
}

const createChart = async () => {
  if (!chartCanvas.value || !hasData.value) return

  await nextTick()

  // Destroy existing chart
  if (chart.value) {
    chart.value.destroy()
  }

  const config = createChartConfig()
  config.type = selectedChartType.value

  chart.value = new Chart(chartCanvas.value, config)
}

const loadChartData = async () => {
  loading.value = true
  
  try {
    await tasksStore.loadTaskStats()
    
    chartData.value = {
      pending: tasksStore.stats.pendingTasks || 0,
      in_progress: tasksStore.stats.inProgressTasks || 0,
      completed: tasksStore.stats.completedTasks || 0,
      cancelled: tasksStore.stats.cancelledTasks || 0
    }
    
    await createChart()
  } catch (error) {
    console.error('Failed to load chart data:', error)
  } finally {
    loading.value = false
  }
}

const toggleDataset = (index) => {
  if (!chart.value) return

  const meta = chart.value.getDatasetMeta(0)
  meta.data[index].hidden = !meta.data[index].hidden
  chart.value.update()
}

const navigateToTasksByStatus = (status) => {
  if (!hasPermission('tasks.view')) return

  router.push({
    name: 'tasks',
    query: { status }
  })
}

const viewAllTasks = () => {
  if (!hasPermission('tasks.view')) return

  router.push({ name: 'tasks' })
}

const createTask = () => {
  if (!hasPermission('tasks.create')) return

  router.push({ name: 'task-create' })
}

// Watch for chart type changes
watch(selectedChartType, () => {
  if (hasData.value) {
    createChart()
  }
})

// Watch for data changes
watch(() => tasksStore.stats, () => {
  loadChartData()
}, { deep: true })

onMounted(() => {
  loadChartData()
})

onUnmounted(() => {
  if (chart.value) {
    chart.value.destroy()
  }
})
</script>

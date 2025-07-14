<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Gantt Chart
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Visualize project timeline and task dependencies
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card">
        <div class="card-body">
          <div class="flex justify-center py-8">
            <div class="spinner h-8 w-8"></div>
          </div>
        </div>
      </div>

      <!-- Gantt Chart Container -->
      <div v-else class="card">
        <div class="card-body">
          <!-- Chart Controls -->
          <div class="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div class="flex gap-2">
              <button
                @click="viewMode = 'days'"
                :class="[
                  'px-3 py-1 text-sm rounded',
                  viewMode === 'days'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]"
              >
                Days
              </button>
              <button
                @click="viewMode = 'weeks'"
                :class="[
                  'px-3 py-1 text-sm rounded',
                  viewMode === 'weeks'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]"
              >
                Weeks
              </button>
              <button
                @click="viewMode = 'months'"
                :class="[
                  'px-3 py-1 text-sm rounded',
                  viewMode === 'months'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                ]"
              >
                Months
              </button>
            </div>
            <div class="text-sm text-gray-500">
              {{ tasks.length }} tasks
            </div>
          </div>

          <!-- Simple Gantt Chart -->
          <div class="overflow-x-auto">
            <div class="min-w-full">
              <!-- Timeline Header -->
              <div class="flex border-b border-gray-200 dark:border-gray-700">
                <div class="w-64 p-3 font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                  Task
                </div>
                <div class="flex-1 flex">
                  <div
                    v-for="date in timelineHeaders"
                    :key="date.key"
                    class="flex-1 p-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700"
                  >
                    {{ date.label }}
                  </div>
                </div>
              </div>

              <!-- Task Rows -->
              <div
                v-for="task in tasks"
                :key="task.id"
                class="flex border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <!-- Task Info -->
                <div class="w-64 p-3 border-r border-gray-200 dark:border-gray-700">
                  <div class="font-medium text-gray-900 dark:text-white text-sm">
                    {{ task.title }}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ getStatusLabel(task.status) }}
                  </div>
                </div>

                <!-- Timeline -->
                <div class="flex-1 flex relative">
                  <div
                    v-for="(date, index) in timelineHeaders"
                    :key="date.key"
                    class="flex-1 p-2 border-r border-gray-100 dark:border-gray-800 relative"
                  >
                    <!-- Task Bar -->
                    <div
                      v-if="isTaskInTimeSlot(task, date)"
                      :class="[
                        'h-6 rounded-sm flex items-center justify-center text-xs text-white font-medium',
                        getTaskBarColor(task.status)
                      ]"
                      :style="getTaskBarStyle(task, date, index)"
                    >
                      {{ getTaskProgress(task) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="mt-6 flex flex-wrap gap-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-gray-400 rounded-sm"></div>
              <span class="text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <span class="text-gray-600 dark:text-gray-400">In Progress</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-500 rounded-sm"></div>
              <span class="text-gray-600 dark:text-gray-400">Completed</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-500 rounded-sm"></div>
              <span class="text-gray-600 dark:text-gray-400">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from 'vue-toastification'
import { format, addDays, addWeeks, addMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns'

// Composables
const tasksStore = useTasksStore()
const toast = useToast()

// Reactive state
const loading = ref(true)
const viewMode = ref('weeks')
const tasks = ref([])

// Computed properties
const timelineHeaders = computed(() => {
  const headers = []
  const today = new Date()
  const start = startOfDay(today)

  let count = 0
  let maxCount = 0
  let addFunction = null
  let formatString = ''

  switch (viewMode.value) {
    case 'days':
      maxCount = 14
      addFunction = addDays
      formatString = 'MMM dd'
      break
    case 'weeks':
      maxCount = 8
      addFunction = addWeeks
      formatString = 'MMM dd'
      break
    case 'months':
      maxCount = 6
      addFunction = addMonths
      formatString = 'MMM yyyy'
      break
  }

  while (count < maxCount) {
    const date = addFunction(start, count)
    headers.push({
      key: date.toISOString(),
      label: format(date, formatString),
      date: date
    })
    count++
  }

  return headers
})

// Methods
const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return labels[status] || status
}

const getTaskBarColor = (status) => {
  const colors = {
    pending: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500'
  }
  return colors[status] || 'bg-gray-400'
}

const getTaskProgress = (task) => {
  if (task.status === 'completed') return 100
  if (task.status === 'in_progress') return 50
  return 0
}

const isTaskInTimeSlot = (task, timeSlot) => {
  if (!task.deadline) return false

  const taskDate = new Date(task.deadline)
  const slotStart = startOfDay(timeSlot.date)
  const slotEnd = endOfDay(timeSlot.date)

  return isWithinInterval(taskDate, { start: slotStart, end: slotEnd })
}

const getTaskBarStyle = (task, timeSlot, index) => {
  // Simple styling for now
  return {
    position: 'relative',
    zIndex: 1
  }
}

const loadTasks = async () => {
  try {
    loading.value = true
    await tasksStore.loadTasks({ limit: 100 })
    tasks.value = tasksStore.tasks.filter(task => task.deadline)
  } catch (error) {
    console.error('Failed to load tasks for Gantt chart:', error)
    toast.error('Failed to load tasks')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadTasks()
})
</script>

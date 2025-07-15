<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-4 md:py-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Gantt Chart
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Visualize project timeline and task dependencies
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="card mb-6">
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Search -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tasks..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <!-- Status Filter -->
            <select
              v-model="statusFilter"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <!-- Priority Filter -->
            <select
              v-model="priorityFilter"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <!-- Assigned User Filter -->
            <select
              v-model="assignedFilter"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Assigned</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card">
        <div class="card-body">
          <div class="flex justify-center py-8">
            <div class="spinner h-8 w-8"></div>
          </div>
        </div>
      </div>

      <!-- No Tasks State -->
      <div v-else-if="filteredTasks.length === 0" class="card">
        <div class="card-body">
          <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No tasks found</h3>
            <p class="mt-2 text-gray-500 dark:text-gray-400">
              {{ tasks.length === 0 ? 'No tasks have been loaded yet.' : 'No tasks match your current filters.' }}
            </p>
            <div class="mt-6">
              <button
                v-if="tasks.length === 0"
                @click="loadTasks"
                class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Tasks
              </button>
              <button
                v-else
                @click="clearFilters"
                class="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-medium text-sm text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Gantt Chart Container -->
      <div v-else class="card">
        <div class="card-body p-0">
          <!-- Chart Controls -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div class="flex flex-wrap gap-2">
                <button
                  @click="setTimeScale('hours', 24)"
                  :class="getTimeScaleButtonClass('hours')"
                >
                  Hours
                </button>
                <button
                  @click="setTimeScale('days', 30)"
                  :class="getTimeScaleButtonClass('days')"
                >
                  Days
                </button>
                <button
                  @click="setTimeScale('weeks', 12)"
                  :class="getTimeScaleButtonClass('weeks')"
                >
                  Weeks
                </button>
                <button
                  @click="setTimeScale('months', 12)"
                  :class="getTimeScaleButtonClass('months')"
                >
                  Months
                </button>
                <button
                  @click="setTimeScale('quarters', 8)"
                  :class="getTimeScaleButtonClass('quarters')"
                >
                  Quarters
                </button>
              </div>
              
              <!-- Time Scale Controls -->
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-600 dark:text-gray-400">Zoom:</label>
                  <input
                    v-model="zoomLevel"
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    class="w-20"
                  />
                  <span class="text-sm text-gray-600 dark:text-gray-400">{{ Math.round(zoomLevel * 100) }}%</span>
                </div>
                
                <div class="text-sm text-gray-500">
                  {{ visibleTasks.length }} of {{ filteredTasks.length }} tasks
                </div>
              </div>
            </div>

            <!-- Virtualization Notice -->
            <div v-if="filteredTasks.length > maxVisibleTasks" class="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div class="flex items-center">
                <svg class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L4.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span class="text-sm text-yellow-800 dark:text-yellow-200">
                  Showing {{ maxVisibleTasks }} of {{ filteredTasks.length }} tasks for performance. 
                  <button 
                    @click="showAllTasks = !showAllTasks"
                    class="font-medium underline hover:no-underline"
                  >
                    {{ showAllTasks ? 'Show Less' : 'Show All' }}
                  </button>
                </span>
              </div>
            </div>
          </div>

          <!-- Gantt Chart -->
          <div class="relative">
            <div class="flex">
              <!-- Task List (Fixed Left Column) -->
              <div class="w-64 md:w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <!-- Header -->
                <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div class="font-medium text-gray-900 dark:text-white">Task</div>
                </div>
                
                <!-- Task Rows -->
                <div 
                  v-for="task in visibleTasks" 
                  :key="task.id"
                  class="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  @click="navigateToTask(task.id)"
                >
                  <div class="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {{ task.title }}
                  </div>
                  <div class="flex items-center gap-2 text-xs">
                    <span :class="getStatusBadgeClass(task.status)">
                      {{ getStatusLabel(task.status) }}
                    </span>
                    <span :class="getPriorityBadgeClass(task.priority)">
                      {{ task.priority }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Timeline Container (Scrollable) -->
              <div class="flex-1 overflow-hidden">
                <div 
                  ref="timelineContainer"
                  class="overflow-x-auto"
                  @scroll="handleTimelineScroll"
                >
                  <div :style="{ width: timelineWidth + 'px', minWidth: '100%' }">
                    <!-- Timeline Header -->
                    <div class="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
                      <div
                        v-for="(period, index) in timelinePeriods"
                        :key="period.key"
                        :style="{ width: columnWidth + 'px' }"
                        class="flex-shrink-0 p-2 text-center text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700"
                      >
                        {{ period.label }}
                      </div>
                    </div>

                    <!-- Timeline Rows -->
                    <div class="relative">
                      <!-- Current Time Indicator -->
                      <div
                        v-if="currentTimePosition >= 0"
                        :style="{ left: currentTimePosition + 'px' }"
                        class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                      >
                        <div class="absolute -top-2 -left-8 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Now
                        </div>
                      </div>

                      <!-- Task Rows -->
                      <div
                        v-for="task in visibleTasks"
                        :key="task.id"
                        class="flex border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 h-16"
                      >
                        <div
                          v-for="(period, index) in timelinePeriods"
                          :key="period.key"
                          :style="{ width: columnWidth + 'px' }"
                          class="flex-shrink-0 border-r border-gray-100 dark:border-gray-700 relative"
                        >
                          <!-- Task Bar -->
                          <div
                            v-if="getTaskBarForPeriod(task, period, index)"
                            :style="getTaskBarStyle(task, period, index)"
                            :class="[
                              'absolute top-2 bottom-2 rounded-sm flex items-center justify-center text-xs text-white font-medium cursor-pointer transition-all hover:opacity-80',
                              getTaskBarColor(task.status)
                            ]"
                            @click="navigateToTask(task.id)"
                            :title="task.title"
                          >
                            <!-- Remove task title from horizontal bars since it's shown on the left -->
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Horizontal Scroll Bar -->
                <div class="p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <input
                    v-model="scrollPosition"
                    type="range"
                    :min="0"
                    :max="maxScrollPosition"
                    class="w-full"
                    @input="handleScrollbarInput"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex flex-wrap gap-4 text-sm">
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
              <div class="flex items-center gap-2">
                <div class="w-0.5 h-4 bg-red-500"></div>
                <span class="text-gray-600 dark:text-gray-400">Current Time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { 
  format, 
  addHours, 
  addDays, 
  addWeeks, 
  addMonths, 
  addQuarters,
  startOfDay, 
  endOfDay, 
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  isWithinInterval,
  differenceInDays,
  differenceInHours,
  differenceInWeeks,
  differenceInMonths,
  getDaysInMonth
} from 'date-fns'

// Composables
const router = useRouter()
const tasksStore = useTasksStore()
const authStore = useAuthStore()
const toast = useToast()

// Refs
const timelineContainer = ref(null)
const loading = ref(true)
const tasks = ref([])

// Filter states
const searchQuery = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const assignedFilter = ref('')

// Time scale states
const timeScale = ref('weeks')
const timeScaleCount = ref(12)
const zoomLevel = ref(1)
const scrollPosition = ref(0)

// Virtualization states
const maxVisibleTasks = ref(100)
const showAllTasks = ref(false)

// Constants
const BASE_COLUMN_WIDTH = 120
const MOBILE_COLUMN_WIDTH = 80

// Computed properties
const columnWidth = computed(() => {
  const baseWidth = window.innerWidth < 768 ? MOBILE_COLUMN_WIDTH : BASE_COLUMN_WIDTH
  return baseWidth * zoomLevel.value
})

const timelineWidth = computed(() => {
  return timelinePeriods.value.length * columnWidth.value
})

const maxScrollPosition = computed(() => {
  if (!timelineContainer.value) return 0
  return Math.max(0, timelineWidth.value - timelineContainer.value.clientWidth)
})

const filteredTasks = computed(() => {
  let filtered = tasks.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(task => task.status === statusFilter.value)
  }

  // Priority filter
  if (priorityFilter.value) {
    filtered = filtered.filter(task => task.priority === priorityFilter.value)
  }

  // Assigned filter
  if (assignedFilter.value) {
    if (assignedFilter.value === 'me') {
      filtered = filtered.filter(task => 
        task.assignedUsers?.includes(authStore.user?.id)
      )
    } else if (assignedFilter.value === 'unassigned') {
      filtered = filtered.filter(task => 
        !task.assignedUsers || task.assignedUsers.length === 0
      )
    }
  }

  return filtered.filter(task => task.deadline) // Only show tasks with deadlines
})

const visibleTasks = computed(() => {
  if (showAllTasks.value) {
    return filteredTasks.value
  }
  return filteredTasks.value.slice(0, maxVisibleTasks.value)
})

const timelinePeriods = computed(() => {
  const periods = []
  const now = new Date()
  
  // Calculate start date to center current time
  const centerIndex = Math.floor(timeScaleCount.value / 2)
  let startDate

  switch (timeScale.value) {
    case 'hours':
      startDate = addHours(now, -centerIndex)
      break
    case 'days':
      startDate = addDays(now, -centerIndex)
      break
    case 'weeks':
      startDate = addWeeks(startOfWeek(now), -centerIndex)
      break
    case 'months':
      startDate = addMonths(startOfMonth(now), -centerIndex)
      break
    case 'quarters':
      startDate = addQuarters(startOfQuarter(now), -centerIndex)
      break
  }

  // Generate periods
  for (let i = 0; i < timeScaleCount.value; i++) {
    let periodDate
    let formatString
    let periodStart
    let periodEnd

    switch (timeScale.value) {
      case 'hours':
        periodDate = addHours(startDate, i)
        formatString = 'HH:mm'
        periodStart = periodDate
        periodEnd = addHours(periodDate, 1)
        break
      case 'days':
        periodDate = addDays(startDate, i)
        formatString = 'MMM dd'
        periodStart = startOfDay(periodDate)
        periodEnd = endOfDay(periodDate)
        break
      case 'weeks':
        periodDate = addWeeks(startDate, i)
        formatString = 'MMM dd'
        periodStart = startOfWeek(periodDate)
        periodEnd = endOfWeek(periodDate)
        break
      case 'months':
        periodDate = addMonths(startDate, i)
        formatString = 'MMM yyyy'
        periodStart = startOfMonth(periodDate)
        periodEnd = endOfMonth(periodDate)
        break
      case 'quarters':
        periodDate = addQuarters(startDate, i)
        formatString = 'QQQ yyyy'
        periodStart = startOfQuarter(periodDate)
        periodEnd = endOfQuarter(periodDate)
        break
    }

    periods.push({
      key: periodDate.toISOString(),
      label: format(periodDate, formatString),
      date: periodDate,
      start: periodStart,
      end: periodEnd
    })
  }

  return periods
})

const currentTimePosition = computed(() => {
  const now = new Date()
  const currentPeriodIndex = timelinePeriods.value.findIndex(period => 
    isWithinInterval(now, { start: period.start, end: period.end })
  )
  
  if (currentPeriodIndex === -1) return -1
  
  const currentPeriod = timelinePeriods.value[currentPeriodIndex]
  let positionInPeriod = 0
  
  switch (timeScale.value) {
    case 'hours':
      positionInPeriod = (now.getMinutes() / 60) * columnWidth.value
      break
    case 'days':
      positionInPeriod = (now.getHours() / 24) * columnWidth.value
      break
    case 'weeks':
      positionInPeriod = (differenceInDays(now, currentPeriod.start) / 7) * columnWidth.value
      break
    case 'months':
      positionInPeriod = (differenceInDays(now, currentPeriod.start) / getDaysInMonth(currentPeriod.date)) * columnWidth.value
      break
    case 'quarters':
      positionInPeriod = (differenceInDays(now, currentPeriod.start) / 90) * columnWidth.value
      break
  }
  
  return currentPeriodIndex * columnWidth.value + positionInPeriod
})

// Methods
const setTimeScale = (scale, count) => {
  timeScale.value = scale
  timeScaleCount.value = count
  nextTick(() => {
    centerCurrentTime()
  })
}

const getTimeScaleButtonClass = (scale) => {
  return [
    'px-3 py-1 text-sm rounded transition-colors',
    timeScale.value === scale
      ? 'bg-blue-500 text-white'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
  ]
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  priorityFilter.value = ''
  assignedFilter.value = ''
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }
  return labels[status] || status
}

const getStatusBadgeClass = (status) => {
  const classes = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-300'
  }
  return `px-2 py-1 rounded-full text-xs ${classes[status] || classes.pending}`
}

const getPriorityBadgeClass = (priority) => {
  const classes = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-300'
  }
  return `px-2 py-1 rounded-full text-xs ${classes[priority] || classes.medium}`
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

const getTaskBarForPeriod = (task, period, index) => {
  if (!task.deadline) return false
  
  const taskDate = new Date(task.deadline)
  return isWithinInterval(taskDate, { start: period.start, end: period.end })
}

const getTaskBarStyle = (task, period, index) => {
  const taskDate = new Date(task.deadline)
  let leftOffset = 0
  let width = columnWidth.value - 8 // 4px margin on each side
  
  // Calculate position within the period
  switch (timeScale.value) {
    case 'hours':
      leftOffset = (taskDate.getMinutes() / 60) * columnWidth.value
      width = Math.max(20, columnWidth.value * 0.8)
      break
    case 'days':
      leftOffset = (taskDate.getHours() / 24) * columnWidth.value
      width = Math.max(20, columnWidth.value * 0.8)
      break
    case 'weeks':
      leftOffset = (differenceInDays(taskDate, period.start) / 7) * columnWidth.value
      width = Math.max(20, columnWidth.value * 0.8)
      break
    case 'months':
      // Fixed calculation for monthly view
      const daysInMonth = getDaysInMonth(period.date)
      const dayOfMonth = taskDate.getDate()
      leftOffset = ((dayOfMonth - 1) / daysInMonth) * columnWidth.value
      width = Math.max(20, columnWidth.value * 0.8)
      break
    case 'quarters':
      leftOffset = (differenceInDays(taskDate, period.start) / 90) * columnWidth.value
      width = Math.max(20, columnWidth.value * 0.8)
      break
  }
  
  return {
    left: Math.max(4, leftOffset - width / 2) + 'px',
    width: width + 'px'
  }
}

const navigateToTask = (taskId) => {
  router.push(`/tasks/${taskId}`)
}

const handleTimelineScroll = () => {
  if (timelineContainer.value) {
    scrollPosition.value = timelineContainer.value.scrollLeft
  }
}

const handleScrollbarInput = () => {
  if (timelineContainer.value) {
    timelineContainer.value.scrollLeft = scrollPosition.value
  }
}

const centerCurrentTime = () => {
  if (timelineContainer.value && currentTimePosition.value >= 0) {
    // Wait for container to have proper dimensions
    if (timelineContainer.value.clientWidth === 0) {
      setTimeout(centerCurrentTime, 50)
      return
    }
    
    const containerWidth = timelineContainer.value.clientWidth
    const scrollLeft = Math.max(0, currentTimePosition.value - containerWidth / 2)
    timelineContainer.value.scrollLeft = scrollLeft
    scrollPosition.value = scrollLeft
  }
}

const loadTasks = async () => {
  try {
    loading.value = true
    
    // Load tasks in batches since API limit is 100 per request
    let allTasks = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      await tasksStore.loadTasks({ page: page, limit: 100 })
      const batchTasks = tasksStore.tasks
      
      if (batchTasks && batchTasks.length > 0) {
        allTasks = [...allTasks, ...batchTasks]
        hasMore = batchTasks.length === 100
        page++
      } else {
        hasMore = false
      }
    }
    
    tasks.value = allTasks
    
    // Center the timeline on current time after loading
    // Use multiple nextTick calls to ensure DOM is fully rendered
    await nextTick()
    await nextTick()
    setTimeout(() => {
      centerCurrentTime()
    }, 100)
  } catch (error) {
    console.error('Error loading tasks:', error)
    toast.error('Failed to load tasks: ' + error.message)
    tasks.value = []
  } finally {
    loading.value = false
  }
}

// Lifecycle hooks
onMounted(async () => {
  await loadTasks()
  
  // Set up window resize handler
  window.addEventListener('resize', centerCurrentTime)
  
  // Auto-refresh every 5 minutes
  const refreshInterval = setInterval(loadTasks, 5 * 60 * 1000)
  
  // Cleanup on unmount
  onBeforeUnmount(() => {
    window.removeEventListener('resize', centerCurrentTime)
    clearInterval(refreshInterval)
  })
})

// Watchers
watch(zoomLevel, () => {
  nextTick(() => {
    if (timelineContainer.value) {
      const currentScrollRatio = scrollPosition.value / maxScrollPosition.value
      const newScrollPosition = currentScrollRatio * maxScrollPosition.value
      timelineContainer.value.scrollLeft = newScrollPosition
      scrollPosition.value = newScrollPosition
    }
  })
})

watch([timeScale, timeScaleCount], () => {
  nextTick(() => {
    centerCurrentTime()
  })
})

// Expose methods for testing
defineExpose({
  loadTasks,
  setTimeScale,
  centerCurrentTime,
  clearFilters
})
</script>

<style scoped>
.mobile-padding {
  @apply px-4 md:px-6 lg:px-8;
}

.card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
}

.card-body {
  @apply p-4 md:p-6;
}

.spinner {
  @apply animate-spin rounded-full border-4 border-gray-200 border-t-blue-500;
}

/* Custom scrollbar styles */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700 rounded;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500;
}

/* Ensure proper text truncation */
.truncate-text {
  @apply overflow-hidden text-ellipsis whitespace-nowrap;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-body {
    @apply p-3;
  }
}
</style>
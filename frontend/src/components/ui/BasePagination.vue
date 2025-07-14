<template>
  <div class="flex items-center justify-between">
    <!-- Results info -->
    <div class="text-sm text-gray-700 dark:text-gray-300">
      Showing {{ startItem }} to {{ endItem }} of {{ totalItems }} results
    </div>

    <!-- Pagination controls -->
    <div class="flex items-center space-x-2">
      <!-- Previous button -->
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage <= 1"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-md transition-colors',
          currentPage <= 1
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700'
        ]"
      >
        <ChevronLeftIcon class="w-4 h-4" />
      </button>

      <!-- Page numbers -->
      <div class="flex items-center space-x-1">
        <!-- First page -->
        <button
          v-if="showFirstPage"
          @click="goToPage(1)"
          :class="pageButtonClass(1)"
        >
          1
        </button>

        <!-- First ellipsis -->
        <span v-if="showFirstEllipsis" class="px-2 text-gray-500">...</span>

        <!-- Visible page numbers -->
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="pageButtonClass(page)"
        >
          {{ page }}
        </button>

        <!-- Last ellipsis -->
        <span v-if="showLastEllipsis" class="px-2 text-gray-500">...</span>

        <!-- Last page -->
        <button
          v-if="showLastPage"
          @click="goToPage(totalPages)"
          :class="pageButtonClass(totalPages)"
        >
          {{ totalPages }}
        </button>
      </div>

      <!-- Next button -->
      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage >= totalPages"
        :class="[
          'px-3 py-2 text-sm font-medium rounded-md transition-colors',
          currentPage >= totalPages
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700'
        ]"
      >
        <ChevronRightIcon class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  itemsPerPage: {
    type: Number,
    required: true
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['page-change'])

const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage
  return Math.min(end, props.totalItems)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = props.maxVisiblePages
  const total = props.totalPages
  const current = props.currentPage

  if (total <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Calculate start and end of visible range
    let start = Math.max(1, current - Math.floor(maxVisible / 2))
    let end = Math.min(total, start + maxVisible - 1)

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    // Don't include first and last page in visible range if they'll be shown separately
    if (start === 1) {
      start = 2
    }
    if (end === total) {
      end = total - 1
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

const showFirstPage = computed(() => {
  return props.totalPages > props.maxVisiblePages && !visiblePages.value.includes(1)
})

const showLastPage = computed(() => {
  return props.totalPages > props.maxVisiblePages && !visiblePages.value.includes(props.totalPages)
})

const showFirstEllipsis = computed(() => {
  return showFirstPage.value && visiblePages.value[0] > 2
})

const showLastEllipsis = computed(() => {
  return showLastPage.value && visiblePages.value[visiblePages.value.length - 1] < props.totalPages - 1
})

const pageButtonClass = (page) => {
  const isActive = page === props.currentPage
  
  return [
    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700'
  ]
}

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

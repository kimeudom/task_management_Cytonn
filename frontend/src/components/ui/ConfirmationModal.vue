<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click="handleBackdropClick"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          ref="modalRef"
          class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ title }}
              </h3>
              <button
                @click="$emit('cancel')"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 py-4">
            <div class="flex items-start space-x-4">
              <!-- Icon -->
              <div class="flex-shrink-0">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    iconBgClass
                  ]"
                >
                  <component :is="iconComponent" :class="iconClass" class="w-6 h-6" />
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ message }}
                </p>
                
                <!-- Additional content slot -->
                <div v-if="$slots.default" class="mt-3">
                  <slot />
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
            <div class="flex items-center justify-end space-x-3">
              <button
                @click="$emit('cancel')"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {{ cancelText }}
              </button>
              <button
                @click="$emit('confirm')"
                :class="confirmButtonClass"
                class="px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmVariant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'danger', 'warning', 'success'].includes(value)
  },
  icon: {
    type: String,
    default: 'warning',
    validator: (value) => ['warning', 'info', 'success', 'error'].includes(value)
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const modalRef = ref(null)

const iconComponent = computed(() => {
  const icons = {
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    success: CheckCircleIcon,
    error: ExclamationCircleIcon
  }
  return icons[props.icon] || ExclamationTriangleIcon
})

const iconBgClass = computed(() => {
  const classes = {
    warning: 'bg-yellow-100 dark:bg-yellow-900',
    info: 'bg-blue-100 dark:bg-blue-900',
    success: 'bg-green-100 dark:bg-green-900',
    error: 'bg-red-100 dark:bg-red-900'
  }
  return classes[props.icon] || classes.warning
})

const iconClass = computed(() => {
  const classes = {
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400'
  }
  return classes[props.icon] || classes.warning
})

const confirmButtonClass = computed(() => {
  const classes = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    success: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
  }
  return classes[props.confirmVariant] || classes.primary
})

const handleBackdropClick = (event) => {
  if (event.target === event.currentTarget) {
    emit('cancel')
  }
}

const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && props.show) {
    emit('cancel')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})
</script>

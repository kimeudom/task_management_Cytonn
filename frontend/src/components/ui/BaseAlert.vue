<template>
  <Transition
    enter-active-class="transition-all duration-300"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition-all duration-300"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="visible"
      class="rounded-md p-4"
      :class="alertClasses"
      role="alert"
    >
      <div class="flex">
        <!-- Icon -->
        <div class="flex-shrink-0">
          <component
            :is="alertIcon"
            class="h-5 w-5"
            :class="iconClasses"
          />
        </div>
        
        <!-- Content -->
        <div class="ml-3 flex-1">
          <!-- Title -->
          <h3
            v-if="title"
            class="text-sm font-medium"
            :class="titleClasses"
          >
            {{ title }}
          </h3>
          
          <!-- Message -->
          <div
            class="text-sm"
            :class="[messageClasses, { 'mt-1': title }]"
          >
            <slot>{{ message }}</slot>
          </div>
          
          <!-- Actions -->
          <div
            v-if="$slots.actions"
            class="mt-3"
          >
            <slot name="actions"></slot>
          </div>
        </div>
        
        <!-- Close button -->
        <div
          v-if="closable"
          class="ml-auto pl-3"
        >
          <div class="-mx-1.5 -my-1.5">
            <button
              @click="close"
              class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="closeButtonClasses"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'warning', 'danger', 'info'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  closable: {
    type: Boolean,
    default: false
  },
  autoClose: {
    type: Boolean,
    default: false
  },
  autoCloseDelay: {
    type: Number,
    default: 5000
  },
  modelValue: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const visible = ref(props.modelValue)

const alertIcon = computed(() => {
  const icons = {
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    danger: XCircleIcon,
    info: InformationCircleIcon
  }
  return icons[props.variant]
})

const alertClasses = computed(() => {
  const variants = {
    success: 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700',
    warning: 'bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700',
    danger: 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700',
    info: 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700'
  }
  return variants[props.variant]
})

const iconClasses = computed(() => {
  const variants = {
    success: 'text-green-400 dark:text-green-300',
    warning: 'text-yellow-400 dark:text-yellow-300',
    danger: 'text-red-400 dark:text-red-300',
    info: 'text-blue-400 dark:text-blue-300'
  }
  return variants[props.variant]
})

const titleClasses = computed(() => {
  const variants = {
    success: 'text-green-800 dark:text-green-200',
    warning: 'text-yellow-800 dark:text-yellow-200',
    danger: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200'
  }
  return variants[props.variant]
})

const messageClasses = computed(() => {
  const variants = {
    success: 'text-green-700 dark:text-green-300',
    warning: 'text-yellow-700 dark:text-yellow-300',
    danger: 'text-red-700 dark:text-red-300',
    info: 'text-blue-700 dark:text-blue-300'
  }
  return variants[props.variant]
})

const closeButtonClasses = computed(() => {
  const variants = {
    success: 'text-green-500 hover:bg-green-100 dark:hover:bg-green-800 focus:ring-green-600',
    warning: 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800 focus:ring-yellow-600',
    danger: 'text-red-500 hover:bg-red-100 dark:hover:bg-red-800 focus:ring-red-600',
    info: 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800 focus:ring-blue-600'
  }
  return variants[props.variant]
})

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

// Auto close functionality
onMounted(() => {
  if (props.autoClose) {
    setTimeout(() => {
      close()
    }, props.autoCloseDelay)
  }
})

// Watch for modelValue changes
import { watch } from 'vue'
watch(() => props.modelValue, (newValue) => {
  visible.value = newValue
})
</script>

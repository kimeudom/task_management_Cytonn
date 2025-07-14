<template>
  <span
    class="inline-flex items-center font-medium"
    :class="badgeClasses"
  >
    <!-- Icon (left) -->
    <component
      v-if="iconLeft"
      :is="iconLeft"
      class="flex-shrink-0"
      :class="iconClasses"
    />
    
    <!-- Content -->
    <slot></slot>
    
    <!-- Icon (right) -->
    <component
      v-if="iconRight"
      :is="iconRight"
      class="flex-shrink-0"
      :class="iconClasses"
    />
    
    <!-- Close button -->
    <button
      v-if="closable"
      @click="$emit('close')"
      class="flex-shrink-0 ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-black hover:bg-opacity-20 focus:outline-none focus:bg-black focus:bg-opacity-20"
    >
      <XMarkIcon class="h-3 w-3" />
    </button>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => [
      'default',
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
      'info'
    ].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value)
  },
  rounded: {
    type: Boolean,
    default: false
  },
  outlined: {
    type: Boolean,
    default: false
  },
  closable: {
    type: Boolean,
    default: false
  },
  iconLeft: {
    type: [String, Object],
    default: null
  },
  iconRight: {
    type: [String, Object],
    default: null
  }
})

const emit = defineEmits(['close'])

const badgeClasses = computed(() => {
  const classes = []

  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  }
  classes.push(sizeClasses[props.size])

  // Shape classes
  if (props.rounded) {
    classes.push('rounded-full')
  } else {
    classes.push('rounded-md')
  }

  // Variant classes
  if (props.outlined) {
    const outlinedVariants = {
      default: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent',
      primary: 'border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-transparent',
      secondary: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent',
      success: 'border border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 bg-transparent',
      warning: 'border border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 bg-transparent',
      danger: 'border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 bg-transparent',
      info: 'border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-transparent'
    }
    classes.push(outlinedVariants[props.variant])
  } else {
    const solidVariants = {
      default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      primary: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      danger: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
    }
    classes.push(solidVariants[props.variant])
  }

  return classes.join(' ')
})

const iconClasses = computed(() => {
  const classes = []

  // Icon size based on badge size
  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4'
  }
  classes.push(iconSizes[props.size])

  // Icon spacing
  if (props.iconLeft) {
    classes.push('mr-1')
  }
  if (props.iconRight) {
    classes.push('ml-1')
  }

  return classes.join(' ')
})
</script>

<template>
  <div 
    class="flex items-center justify-center"
    :class="containerClass"
  >
    <div 
      class="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
      :class="spinnerClass"
    ></div>
    <span 
      v-if="text" 
      class="ml-3 text-gray-600 dark:text-gray-400"
      :class="textClass"
    >
      {{ text }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  fullscreen: {
    type: Boolean,
    default: false
  },
  overlay: {
    type: Boolean,
    default: false
  }
})

const spinnerClass = computed(() => {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }
  return sizes[props.size]
})

const textClass = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }
  return sizes[props.size]
})

const containerClass = computed(() => {
  let classes = []
  
  if (props.fullscreen) {
    classes.push('fixed inset-0 z-50')
  }
  
  if (props.overlay) {
    classes.push('bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75')
  }
  
  return classes.join(' ')
})
</script>

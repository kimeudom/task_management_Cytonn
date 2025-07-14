<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :to="tag === 'router-link' ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <!-- Loading spinner -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
    </div>
    
    <!-- Content -->
    <div :class="{ 'opacity-0': loading }">
      <!-- Icon (left) -->
      <component
        v-if="iconLeft"
        :is="iconLeft"
        class="h-5 w-5"
        :class="{ 'mr-2': $slots.default }"
      />
      
      <!-- Default slot content -->
      <slot></slot>
      
      <!-- Icon (right) -->
      <component
        v-if="iconRight"
        :is="iconRight"
        class="h-5 w-5"
        :class="{ 'ml-2': $slots.default }"
      />
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
      'outline',
      'ghost',
      'link'
    ].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  tag: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'a', 'router-link'].includes(value)
  },
  to: {
    type: [String, Object],
    default: null
  },
  href: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  },
  rounded: {
    type: Boolean,
    default: false
  },
  iconLeft: {
    type: [String, Object, Function],
    default: null
  },
  iconRight: {
    type: [String, Object, Function],
    default: null
  }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
  const classes = [
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  ]

  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-base'
  }
  classes.push(sizeClasses[props.size])

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 border border-transparent',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 border border-transparent',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent',
    outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 border border-transparent',
    link: 'bg-transparent text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:ring-blue-500 border border-transparent p-0'
  }
  classes.push(variantClasses[props.variant])

  // Border radius
  if (props.rounded) {
    classes.push('rounded-full')
  } else {
    classes.push('rounded-md')
  }

  // Block (full width)
  if (props.block) {
    classes.push('w-full')
  }

  return classes.join(' ')
})

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

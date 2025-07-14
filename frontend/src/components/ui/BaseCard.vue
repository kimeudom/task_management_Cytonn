<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200"
    :class="cardClasses"
  >
    <!-- Header -->
    <div
      v-if="$slots.header || title"
      class="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
      :class="headerClasses"
    >
      <slot name="header">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ title }}
          </h3>
          <div v-if="$slots.actions" class="flex items-center space-x-2">
            <slot name="actions"></slot>
          </div>
        </div>
      </slot>
    </div>

    <!-- Body -->
    <div
      class="px-6 py-4"
      :class="bodyClasses"
    >
      <slot></slot>
    </div>

    <!-- Footer -->
    <div
      v-if="$slots.footer"
      class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg"
      :class="footerClasses"
    >
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'elevated', 'outlined', 'flat'].includes(value)
  },
  padding: {
    type: String,
    default: 'normal',
    validator: (value) => ['none', 'sm', 'normal', 'lg'].includes(value)
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const cardClasses = computed(() => {
  const classes = []

  // Variant classes
  switch (props.variant) {
    case 'elevated':
      classes.push('shadow-lg')
      break
    case 'outlined':
      classes.push('border-2')
      break
    case 'flat':
      classes.push('shadow-none border-0')
      break
    default:
      classes.push('shadow-sm')
  }

  // Interactive states
  if (props.hoverable) {
    classes.push('hover:shadow-md transition-shadow duration-200')
  }

  if (props.clickable) {
    classes.push('cursor-pointer hover:shadow-md transition-shadow duration-200')
  }

  return classes.join(' ')
})

const headerClasses = computed(() => {
  const classes = []

  // Padding classes for header
  switch (props.padding) {
    case 'none':
      classes.push('px-0 py-0')
      break
    case 'sm':
      classes.push('px-4 py-3')
      break
    case 'lg':
      classes.push('px-8 py-6')
      break
    default:
      classes.push('px-6 py-4')
  }

  return classes.join(' ')
})

const bodyClasses = computed(() => {
  const classes = []

  // Padding classes for body
  switch (props.padding) {
    case 'none':
      classes.push('px-0 py-0')
      break
    case 'sm':
      classes.push('px-4 py-3')
      break
    case 'lg':
      classes.push('px-8 py-6')
      break
    default:
      classes.push('px-6 py-4')
  }

  return classes.join(' ')
})

const footerClasses = computed(() => {
  const classes = []

  // Padding classes for footer
  switch (props.padding) {
    case 'none':
      classes.push('px-0 py-0')
      break
    case 'sm':
      classes.push('px-4 py-3')
      break
    case 'lg':
      classes.push('px-8 py-6')
      break
    default:
      classes.push('px-6 py-4')
  }

  return classes.join(' ')
})

const handleClick = (event) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

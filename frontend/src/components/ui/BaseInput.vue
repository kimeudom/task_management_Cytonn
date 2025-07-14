<template>
  <div class="w-full">
    <!-- Label -->
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      :class="{ 'text-red-600 dark:text-red-400': hasError }"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Icon (left) -->
      <div
        v-if="iconLeft"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <component
          :is="iconLeft"
          class="h-5 w-5 text-gray-400"
          :class="{ 'text-red-400': hasError }"
        />
      </div>

      <!-- Input element -->
      <component
        :is="inputComponent"
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :rows="rows"
        :cols="cols"
        :class="inputClasses"
        v-bind="$attrs"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- Icon (right) -->
      <div
        v-if="iconRight"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
        :class="{ 'pointer-events-none': !iconRightClickable }"
      >
        <component
          :is="iconRight"
          class="h-5 w-5 text-gray-400 cursor-pointer"
          :class="{ 'text-red-400': hasError, 'hover:text-gray-600 dark:hover:text-gray-300': iconRightClickable }"
          @click="iconRightClickable && $emit('icon-right-click')"
        />
      </div>
    </div>

    <!-- Help text -->
    <p
      v-if="helpText && !hasError"
      class="mt-1 text-sm text-gray-500 dark:text-gray-400"
    >
      {{ helpText }}
    </p>

    <!-- Error message -->
    <p
      v-if="hasError"
      class="mt-1 text-sm text-red-600 dark:text-red-400"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text',
    validator: (value) => [
      'text',
      'email',
      'password',
      'number',
      'tel',
      'url',
      'search',
      'date',
      'datetime-local',
      'time'
    ].includes(value)
  },
  variant: {
    type: String,
    default: 'input',
    validator: (value) => ['input', 'textarea'].includes(value)
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  helpText: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  autocomplete: {
    type: String,
    default: ''
  },
  iconLeft: {
    type: [String, Object],
    default: null
  },
  iconRight: {
    type: [String, Object],
    default: null
  },
  iconRightClickable: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  // Textarea specific props
  rows: {
    type: Number,
    default: 3
  },
  cols: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'icon-right-click'])

const attrs = useAttrs()

const inputId = computed(() => attrs.id || `input-${uuidv4()}`)

const inputComponent = computed(() => {
  return props.variant === 'textarea' ? 'textarea' : 'input'
})

const hasError = computed(() => !!props.errorMessage)

const inputClasses = computed(() => {
  const classes = [
    'block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm',
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400',
    'transition-colors duration-200'
  ]

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }
  classes.push(sizeClasses[props.size])

  // Icon padding
  if (props.iconLeft) {
    classes.push('pl-10')
  }
  if (props.iconRight) {
    classes.push('pr-10')
  }

  // Error state
  if (hasError.value) {
    classes.push('border-red-500 focus:border-red-500 focus:ring-red-500')
  }

  // Disabled state
  if (props.disabled) {
    classes.push('opacity-50 cursor-not-allowed')
  }

  return classes.join(' ')
})

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleBlur = (event) => {
  emit('blur', event)
}

const handleFocus = (event) => {
  emit('focus', event)
}
</script>

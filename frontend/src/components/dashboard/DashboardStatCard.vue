<template>
  <BaseCard 
    :class="[
      'relative overflow-hidden transition-all duration-200',
      colorClasses,
      { 'cursor-pointer hover:scale-105': $attrs.onClick }
    ]"
    @click="$emit('click')"
  >
    <!-- Background decoration -->
    <div class="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
      <component 
        :is="iconComponent" 
        class="w-24 h-24"
      />
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div :class="iconBgClasses" class="p-2 rounded-lg">
            <component 
              :is="iconComponent" 
              :class="iconClasses"
              class="w-6 h-6"
            />
          </div>
          <h3 class="text-sm font-medium text-gray-600">
            {{ title }}
          </h3>
        </div>
        
        <!-- Action indicator -->
        <ChevronRightIcon 
          v-if="$attrs.onClick"
          class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      <!-- Value -->
      <div class="mb-2">
        <div v-if="loading" class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div v-else class="text-3xl font-bold text-gray-900">
          {{ formattedValue }}
        </div>
      </div>

      <!-- Subtitle -->
      <div class="text-sm">
        <slot name="subtitle">
          <span class="text-gray-500">{{ subtitle }}</span>
        </slot>
      </div>

      <!-- Trend indicator -->
      <div v-if="trend" class="mt-2 flex items-center space-x-1">
        <component 
          :is="trendIcon"
          :class="trendColorClasses"
          class="w-4 h-4"
        />
        <span :class="trendColorClasses" class="text-sm font-medium">
          {{ trend }}
        </span>
      </div>
    </div>

    <!-- Loading overlay -->
    <div 
      v-if="loading"
      class="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center"
    >
      <LoadingSpinner size="sm" />
    </div>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import BaseCard from '@/components/ui/BaseCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'DocumentTextIcon'
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) => ['blue', 'green', 'yellow', 'red', 'purple', 'indigo'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  },
  trend: {
    type: String,
    default: ''
  },
  trendDirection: {
    type: String,
    default: 'up',
    validator: (value) => ['up', 'down'].includes(value)
  }
})

defineEmits(['click'])

const iconComponents = {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ChartBarIcon
}

const iconComponent = computed(() => {
  return iconComponents[props.icon] || DocumentTextIcon
})

const trendIcon = computed(() => {
  return props.trendDirection === 'up' ? TrendingUpIcon : TrendingDownIcon
})

const colorClasses = computed(() => {
  const colors = {
    blue: 'border-l-4 border-blue-500 hover:border-blue-600',
    green: 'border-l-4 border-green-500 hover:border-green-600',
    yellow: 'border-l-4 border-yellow-500 hover:border-yellow-600',
    red: 'border-l-4 border-red-500 hover:border-red-600',
    purple: 'border-l-4 border-purple-500 hover:border-purple-600',
    indigo: 'border-l-4 border-indigo-500 hover:border-indigo-600'
  }
  return colors[props.color] || colors.blue
})

const iconBgClasses = computed(() => {
  const colors = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    indigo: 'bg-indigo-100'
  }
  return colors[props.color] || colors.blue
})

const iconClasses = computed(() => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  }
  return colors[props.color] || colors.blue
})

const trendColorClasses = computed(() => {
  return props.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})
</script>

<style scoped>
.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
</style>

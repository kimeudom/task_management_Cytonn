<template>
  <div class="space-y-4">
    <!-- Verification Required Alert -->
    <div v-if="!isVerified && showAlert" class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400 mt-0.5" />
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Email Verification Required
          </h3>
          <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>{{ message || 'Please verify your email address to access all features.' }}</p>
          </div>
          <div class="mt-4 flex space-x-3">
            <button
              @click="handleResendEmail"
              :disabled="isResending || cooldownActive"
              class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isResending" class="flex items-center">
                <div class="animate-spin -ml-1 mr-1 h-3 w-3 border border-yellow-600 border-t-transparent rounded-full"></div>
                Sending...
              </span>
              <span v-else-if="cooldownActive">
                Resend in {{ cooldownTime }}s
              </span>
              <span v-else>
                Resend Verification Email
              </span>
            </button>
            <router-link
              v-if="email"
              :to="{ name: 'check-email', query: { email } }"
              class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Check Email Instructions
            </router-link>
            <button
              v-if="dismissible"
              @click="$emit('dismiss')"
              class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="resendSuccess" class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-4">
      <div class="flex">
        <CheckCircleIcon class="h-5 w-5 text-green-400" />
        <div class="ml-3">
          <p class="text-sm text-green-800 dark:text-green-200">
            {{ resendMessage }}
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="resendError" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <p class="text-sm text-red-800 dark:text-red-200">
            {{ resendError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon 
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  email: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  showAlert: {
    type: Boolean,
    default: true
  },
  dismissible: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['dismiss'])

// Composables
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const resendSuccess = ref(false)
const resendError = ref('')
const resendMessage = ref('')
const cooldownTime = ref(0)
let cooldownInterval = null

// Computed properties
const isVerified = computed(() => authStore.isEmailVerified)
const isResending = computed(() => authStore.isEmailVerificationLoading)
const cooldownActive = computed(() => cooldownTime.value > 0)

// Methods
const handleResendEmail = async () => {
  if (!props.email || cooldownActive.value) return

  try {
    resendError.value = ''
    resendSuccess.value = false

    const result = await authStore.resendVerificationEmail(props.email)
    
    resendSuccess.value = true
    resendMessage.value = result.message
    
    // Start cooldown
    startCooldown()
    
    toast.success('Verification email sent successfully!')
  } catch (error) {
    resendError.value = error.message
    toast.error('Failed to send verification email')
  }
}

const startCooldown = () => {
  cooldownTime.value = 60 // 60 seconds cooldown
  
  cooldownInterval = setInterval(() => {
    cooldownTime.value--
    if (cooldownTime.value <= 0) {
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

// Cleanup
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

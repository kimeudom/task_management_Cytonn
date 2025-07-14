<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <EnvelopeIcon class="h-10 w-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Check Your Email
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          We've sent a verification link to
          <span class="font-medium text-gray-900 dark:text-white">{{ email }}</span>
        </p>
      </div>

      <!-- Instructions -->
      <div class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-4">
        <div class="flex">
          <InformationCircleIcon class="h-5 w-5 text-blue-400 mt-0.5" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
              Next Steps
            </h3>
            <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ol class="list-decimal list-inside space-y-1">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here to sign in to your account</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Resend Email Section -->
      <div class="space-y-4">
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Didn't receive the email?
          </p>
        </div>

        <!-- Resend Success Message -->
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

        <!-- Resend Error Message -->
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

        <!-- Resend Button -->
        <div class="text-center">
          <button
            @click="handleResendEmail"
            :disabled="isResending || resendCooldown > 0"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span v-if="isResending" class="flex items-center">
              <div class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
              Sending...
            </span>
            <span v-else-if="resendCooldown > 0">
              Resend in {{ resendCooldown }}s
            </span>
            <span v-else>
              Resend Verification Email
            </span>
          </button>
        </div>
      </div>

      <!-- Action Links -->
      <div class="space-y-4">
        <div class="text-center">
          <router-link
            to="/login"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            I've Verified My Email - Sign In
          </router-link>
        </div>
        
        <div class="text-center">
          <router-link
            to="/register"
            class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            Use a different email address
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { 
  EnvelopeIcon, 
  InformationCircleIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/vue/24/outline'

// Composables
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const resendSuccess = ref(false)
const resendError = ref('')
const resendMessage = ref('')
const resendCooldown = ref(0)
let cooldownInterval = null

// Computed properties
const email = computed(() => {
  return route.query.email || authStore.pendingVerificationEmail || 'your email'
})
const isResending = computed(() => authStore.isEmailVerificationLoading)

// Methods
const handleResendEmail = async () => {
  if (resendCooldown.value > 0) return

  try {
    resendError.value = ''
    resendSuccess.value = false

    const result = await authStore.resendVerificationEmail(email.value)
    
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
  resendCooldown.value = 60 // 60 seconds cooldown
  
  cooldownInterval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

// Lifecycle
onMounted(() => {
  // Clear any previous email verification state
  authStore.clearEmailVerification()
})

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

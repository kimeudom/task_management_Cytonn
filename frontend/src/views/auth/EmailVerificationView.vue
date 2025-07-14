<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <EnvelopeIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          {{ isVerifying ? 'Verifying Email' : 'Email Verification' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ getSubtitleText() }}
        </p>
      </div>

      <!-- Verification Status -->
      <div class="mt-8">
        <!-- Loading State -->
        <div v-if="isVerifying" class="text-center">
          <div class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-200">
            <div class="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            Verifying your email address...
          </div>
        </div>

        <!-- Success State -->
        <div v-else-if="verificationSuccess" class="text-center">
          <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircleIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Email Verified Successfully!
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {{ verificationMessage }}
          </p>
          <router-link
            to="/login"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Continue to Login
          </router-link>
        </div>

        <!-- Error State -->
        <div v-else-if="verificationError" class="text-center">
          <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <ExclamationTriangleIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Verification Failed
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {{ verificationError }}
          </p>
          
          <!-- Resend Email Section -->
          <div class="space-y-4">
            <div v-if="!showResendForm">
              <button
                @click="showResendForm = true"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Request New Verification Email
              </button>
            </div>

            <!-- Resend Form -->
            <div v-else class="space-y-4">
              <div>
                <label for="email" class="sr-only">Email address</label>
                <input
                  id="email"
                  v-model="resendEmail"
                  type="email"
                  autocomplete="email"
                  required
                  class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                />
              </div>
              <div class="flex space-x-3">
                <button
                  @click="handleResendEmail"
                  :disabled="isResending || !resendEmail"
                  class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <span v-if="isResending" class="flex items-center">
                    <div class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending...
                  </span>
                  <span v-else>Send Verification Email</span>
                </button>
                <button
                  @click="showResendForm = false"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No Token State -->
        <div v-else class="text-center">
          <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
            <ExclamationTriangleIcon class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Invalid Verification Link
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This verification link is invalid or has expired. Please request a new verification email.
          </p>
          <router-link
            to="/login"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Go to Login
          </router-link>
        </div>
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

      <!-- Back to Login -->
      <div class="text-center">
        <router-link
          to="/login"
          class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          ← Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/vue/24/outline'

// Composables
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const showResendForm = ref(false)
const resendEmail = ref('')
const resendSuccess = ref(false)
const resendError = ref('')
const resendMessage = ref('')

// Computed properties
const isVerifying = computed(() => authStore.isEmailVerificationLoading)
const verificationSuccess = computed(() => authStore.emailVerificationSuccess)
const verificationError = computed(() => authStore.emailVerificationError)
const verificationMessage = computed(() => authStore.emailVerificationMessage)
const isResending = computed(() => authStore.isEmailVerificationLoading)

// Methods
const getSubtitleText = () => {
  if (isVerifying.value) {
    return 'Please wait while we verify your email address...'
  } else if (verificationSuccess.value) {
    return 'Your email has been successfully verified.'
  } else if (verificationError.value) {
    return 'There was a problem verifying your email address.'
  } else {
    return 'Please check your email for a verification link.'
  }
}

const handleResendEmail = async () => {
  if (!resendEmail.value) return

  try {
    resendError.value = ''
    resendSuccess.value = false

    const result = await authStore.resendVerificationEmail(resendEmail.value)
    
    resendSuccess.value = true
    resendMessage.value = result.message
    showResendForm.value = false
    
    toast.success('Verification email sent successfully!')
  } catch (error) {
    resendError.value = error.message
    toast.error('Failed to send verification email')
  }
}

// Verify email on component mount
onMounted(async () => {
  const token = route.query.token
  console.log('EmailVerificationView mounted with token:', token)
  console.log('Full route query:', route.query)
  console.log('Full route path:', route.fullPath)

  if (token) {
    try {
      console.log('Attempting to verify email with token:', token)
      console.log('Auth store before verification:', {
        isAuthenticated: authStore.isAuthenticated,
        user: authStore.user,
        emailVerificationState: authStore.emailVerification
      })

      const result = await authStore.verifyEmail(token)
      console.log('Email verification result:', result)

      toast.success('Email verified successfully!')

      // Update user verification status in auth store if user is currently logged in
      if (authStore.isAuthenticated && authStore.user) {
        // Update the current user's verification status
        authStore.user.isVerified = true
        console.log('Updated user verification status in auth store')
      }

      // Redirect to appropriate page based on authentication status
      setTimeout(() => {
        if (authStore.isAuthenticated) {
          console.log('User is authenticated, redirecting to dashboard')
          router.push({ name: 'dashboard' })
        } else {
          console.log('User not authenticated, redirecting to login')
          router.push({ name: 'login', query: { verified: 'true' } })
        }
      }, 2000)
    } catch (error) {
      console.error('Email verification failed:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      })
      // Error is handled by the store and displayed in the template
    }
  } else {
    console.log('No token found in query parameters')
    console.log('Available query parameters:', Object.keys(route.query))
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Or
          <router-link
            to="/register"
            class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            create a new account
          </router-link>
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="form-label">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              required
              class="form-input"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.email }"
              placeholder="Enter your email"
            />
            <p v-if="errors.email" class="form-error">
              {{ errors.email }}
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="form-label">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="form-input pr-10"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.password }"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-400" />
                <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p v-if="errors.password" class="form-error">
              {{ errors.password }}
            </p>
          </div>
        </div>

        <!-- Remember Me -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Remember me
            </label>
          </div>

          <div class="text-sm">
            <a href="#" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Forgot your password?
            </a>
          </div>
        </div>

        <!-- Email Verification Error -->
        <div v-if="emailVerificationError" class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
          <div class="flex">
            <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400" />
            <div class="ml-3">
              <p class="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                {{ emailVerificationError }}
              </p>
              <div class="flex space-x-3">
                <button
                  @click="handleResendVerification"
                  :disabled="isResending"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isResending" class="flex items-center">
                    <div class="animate-spin -ml-1 mr-1 h-3 w-3 border border-yellow-600 border-t-transparent rounded-full"></div>
                    Sending...
                  </span>
                  <span v-else>Resend Verification Email</span>
                </button>
                <router-link
                  :to="{ name: 'check-email', query: { email: pendingEmail } }"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-800 hover:bg-yellow-200 dark:hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Check Email Instructions
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- General Error Message -->
        <div v-else-if="loginError" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
          <div class="flex">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            <div class="ml-3">
              <p class="text-sm text-red-800 dark:text-red-200">
                {{ loginError }}
              </p>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <div class="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </span>
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </button>
        </div>
      </form>

      <!-- Demo Accounts -->
      <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
          Demo accounts for testing:
        </p>
        <div class="grid grid-cols-1 gap-2 text-xs">
          <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded">
            <strong>Admin:</strong> admin@example.com / password123
          </div>
          <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded">
            <strong>Manager:</strong> manager@example.com / password123
          </div>
          <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded">
            <strong>User:</strong> user@example.com / password123
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// Composables
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const showPassword = ref(false)
const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  email: '',
  password: ''
})

// Computed properties
const isLoading = computed(() => authStore.loading)
const loginError = computed(() => authStore.error)
const emailVerificationError = computed(() => authStore.emailVerificationError)
const pendingEmail = computed(() => authStore.pendingVerificationEmail)
const isResending = computed(() => authStore.isEmailVerificationLoading)

// Methods
const validateForm = () => {
  // Reset errors
  errors.email = ''
  errors.password = ''

  let isValid = true

  // Email validation
  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }

  // Password validation
  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  // Prevent multiple rapid submissions
  if (isLoading.value) {
    return
  }

  try {
    await authStore.login(form.email, form.password)

    toast.success('Login successful!')

    // Redirect to intended page or dashboard
    const redirectTo = route.query.redirect || '/'
    router.push(redirectTo)
  } catch (error) {
    console.error('Login error:', error)
    // Error is handled by the store and displayed in the template
  }
}

const handleResendVerification = async () => {
  if (!pendingEmail.value) return

  try {
    await authStore.resendVerificationEmail(pendingEmail.value)
    toast.success('Verification email sent successfully!')
  } catch (error) {
    toast.error('Failed to send verification email')
  }
}

// Clear errors when user starts typing
const clearErrors = () => {
  authStore.clearError()
  errors.email = ''
  errors.password = ''
}

// Watch for form changes to clear errors
import { watch } from 'vue'
watch([() => form.email, () => form.password], clearErrors)
</script>

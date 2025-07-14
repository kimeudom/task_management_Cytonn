<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Or
          <router-link
            to="/login"
            class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            sign in to your existing account
          </router-link>
        </p>
      </div>

      <!-- Registration Form -->
      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
        <div class="space-y-4">
          <!-- First Name -->
          <div>
            <label for="firstName" class="form-label">
              First Name
            </label>
            <input
              id="firstName"
              v-model="form.firstName"
              type="text"
              autocomplete="given-name"
              required
              class="form-input"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.firstName }"
              placeholder="Enter your first name"
            />
            <p v-if="errors.firstName" class="form-error">
              {{ errors.firstName }}
            </p>
          </div>

          <!-- Last Name -->
          <div>
            <label for="lastName" class="form-label">
              Last Name
            </label>
            <input
              id="lastName"
              v-model="form.lastName"
              type="text"
              autocomplete="family-name"
              required
              class="form-input"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.lastName }"
              placeholder="Enter your last name"
            />
            <p v-if="errors.lastName" class="form-error">
              {{ errors.lastName }}
            </p>
          </div>

          <!-- Username -->
          <div>
            <label for="username" class="form-label">
              Username
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              required
              class="form-input"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.username }"
              placeholder="Choose a username"
            />
            <p v-if="errors.username" class="form-error">
              {{ errors.username }}
            </p>
          </div>

          <!-- Email -->
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

          <!-- Password -->
          <div>
            <label for="password" class="form-label">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                class="form-input pr-10"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.password }"
                placeholder="Create a password"
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
            <!-- Password strength indicator -->
            <div v-if="form.password" class="mt-2">
              <div class="flex space-x-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded"
                  :class="getPasswordStrengthColor(i)"
                ></div>
              </div>
              <p class="text-xs mt-1" :class="getPasswordStrengthTextColor()">
                {{ passwordStrengthText }}
              </p>
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="form-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              class="form-input"
              :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.confirmPassword }"
              placeholder="Confirm your password"
            />
            <p v-if="errors.confirmPassword" class="form-error">
              {{ errors.confirmPassword }}
            </p>
          </div>
        </div>

        <!-- Terms and Conditions -->
        <div class="flex items-center">
          <input
            id="terms"
            v-model="form.acceptTerms"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="terms" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            I agree to the
            <a href="#" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Terms and Conditions
            </a>
            and
            <a href="#" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Privacy Policy
            </a>
          </label>
        </div>
        <p v-if="errors.acceptTerms" class="form-error">
          {{ errors.acceptTerms }}
        </p>

        <!-- Error Message -->
        <div v-if="registerError" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
          <div class="flex">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            <div class="ml-3">
              <p class="text-sm text-red-800 dark:text-red-200">
                {{ registerError }}
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
            {{ isLoading ? 'Creating account...' : 'Create account' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const showPassword = ref(false)
const form = reactive({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const errors = reactive({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: ''
})

// Computed properties
const isLoading = computed(() => authStore.loading)
const registerError = computed(() => authStore.error)

// Password strength calculation
const passwordStrength = computed(() => {
  const password = form.password
  if (!password) return 0

  let score = 0

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Character variety checks
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  return Math.min(score, 4)
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength === 0) return 'Very weak'
  if (strength === 1) return 'Weak'
  if (strength === 2) return 'Fair'
  if (strength === 3) return 'Good'
  return 'Strong'
})

// Methods
const getPasswordStrengthColor = (index) => {
  const strength = passwordStrength.value
  if (index <= strength) {
    if (strength <= 1) return 'bg-red-500'
    if (strength === 2) return 'bg-yellow-500'
    if (strength === 3) return 'bg-blue-500'
    return 'bg-green-500'
  }
  return 'bg-gray-200 dark:bg-gray-700'
}

const getPasswordStrengthTextColor = () => {
  const strength = passwordStrength.value
  if (strength <= 1) return 'text-red-600 dark:text-red-400'
  if (strength === 2) return 'text-yellow-600 dark:text-yellow-400'
  if (strength === 3) return 'text-blue-600 dark:text-blue-400'
  return 'text-green-600 dark:text-green-400'
}

const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })

  let isValid = true

  // First name validation
  if (!form.firstName.trim()) {
    errors.firstName = 'First name is required'
    isValid = false
  } else if (form.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
    isValid = false
  }

  // Last name validation
  if (!form.lastName.trim()) {
    errors.lastName = 'Last name is required'
    isValid = false
  } else if (form.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
    isValid = false
  }

  // Username validation
  if (!form.username.trim()) {
    errors.username = 'Username is required'
    isValid = false
  } else if (form.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters'
    isValid = false
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores'
    isValid = false
  }

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
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    isValid = false
  }

  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  // Terms acceptance validation
  if (!form.acceptTerms) {
    errors.acceptTerms = 'You must accept the terms and conditions'
    isValid = false
  }

  return isValid
}

const handleRegister = async () => {
  if (!validateForm()) {
    return
  }

  try {
    const userData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password
    }

    const result = await authStore.register(userData)

    toast.success('Account created successfully! Please check your email to verify your account.')

    // Redirect to check email page with the email address
    router.push({
      name: 'check-email',
      query: { email: form.email.trim() }
    })
  } catch (error) {
    console.error('Registration error:', error)
    // Error is handled by the store and displayed in the template
  }
}

// Clear errors when user starts typing
const clearErrors = () => {
  authStore.clearError()
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

// Watch for form changes to clear errors
watch([
  () => form.firstName,
  () => form.lastName,
  () => form.username,
  () => form.email,
  () => form.password,
  () => form.confirmPassword
], clearErrors)
</script>

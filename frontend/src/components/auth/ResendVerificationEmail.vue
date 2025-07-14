<template>
  <div class="space-y-4">
    <!-- Resend Form -->
    <div v-if="!showSuccess" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email Address
        </label>
        <div class="mt-1">
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': emailError }"
            placeholder="Enter your email address"
          />
          <p v-if="emailError" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ emailError }}
          </p>
        </div>
      </div>

      <div class="flex space-x-3">
        <button
          @click="handleResendEmail"
          :disabled="isLoading || !isValidEmail || cooldownActive"
          class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <span v-if="isLoading" class="flex items-center">
            <div class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            Sending...
          </span>
          <span v-else-if="cooldownActive">
            Resend in {{ cooldownTime }}s
          </span>
          <span v-else>
            Send Verification Email
          </span>
        </button>
        <button
          v-if="showCancel"
          @click="$emit('cancel')"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Success State -->
    <div v-else class="text-center space-y-4">
      <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircleIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Email Sent Successfully!
        </h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {{ successMessage }}
        </p>
      </div>
      <div class="flex justify-center space-x-3">
        <router-link
          :to="{ name: 'check-email', query: { email } }"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Check Email Instructions
        </router-link>
        <button
          @click="resetForm"
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Send Another
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <p class="text-sm text-red-800 dark:text-red-200">
            {{ error }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  initialEmail: {
    type: String,
    default: ''
  },
  showCancel: {
    type: Boolean,
    default: true
  }
})

// Emits
defineEmits(['cancel', 'success'])

// Composables
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const email = ref(props.initialEmail)
const emailError = ref('')
const error = ref('')
const showSuccess = ref(false)
const successMessage = ref('')
const cooldownTime = ref(0)
let cooldownInterval = null

// Computed properties
const isLoading = computed(() => authStore.isEmailVerificationLoading)
const cooldownActive = computed(() => cooldownTime.value > 0)
const isValidEmail = computed(() => {
  return email.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
})

// Methods
const validateEmail = () => {
  emailError.value = ''
  
  if (!email.value) {
    emailError.value = 'Email is required'
    return false
  }
  
  if (!isValidEmail.value) {
    emailError.value = 'Please enter a valid email address'
    return false
  }
  
  return true
}

const handleResendEmail = async () => {
  if (!validateEmail() || cooldownActive.value) return

  try {
    error.value = ''

    const result = await authStore.resendVerificationEmail(email.value)
    
    showSuccess.value = true
    successMessage.value = result.message
    
    // Start cooldown
    startCooldown()
    
    toast.success('Verification email sent successfully!')
    
    // Emit success event
    emit('success', { email: email.value, message: result.message })
  } catch (err) {
    error.value = err.message
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

const resetForm = () => {
  showSuccess.value = false
  error.value = ''
  emailError.value = ''
  successMessage.value = ''
}

// Watch for email changes to clear errors
watch(email, () => {
  emailError.value = ''
  error.value = ''
})

// Cleanup
onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

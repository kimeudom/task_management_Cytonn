<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div class="max-w-md w-full mx-auto text-center">
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <!-- Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-6">
          <ExclamationTriangleIcon class="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <!-- Content -->
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h1>
        
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ getMessage() }}
        </p>

        <!-- Actions -->
        <div class="space-y-3">
          <button
            @click="goBack"
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeftIcon class="w-4 h-4 mr-2" />
            Go Back
          </button>
          
          <button
            @click="goToDashboard"
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <HomeIcon class="w-4 h-4 mr-2" />
            Go to Dashboard
          </button>

          <button
            v-if="showContactAdmin"
            @click="contactAdmin"
            class="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Contact Administrator
          </button>
        </div>

        <!-- Additional Info -->
        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>User: {{ currentUser?.email || 'Unknown' }}</div>
            <div>Role: {{ currentUser?.role || 'Unknown' }}</div>
            <div v-if="requestedPath">Requested: {{ requestedPath }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user)
const requestedPath = computed(() => route.query.from)

const showContactAdmin = computed(() => {
  // Show contact admin option for non-admin users
  return currentUser.value?.role !== 'admin'
})

const getMessage = () => {
  const userRole = currentUser.value?.role?.toLowerCase()
  
  if (!currentUser.value) {
    return 'You need to be logged in to access this page. Please log in and try again.'
  }

  switch (userRole) {
    case 'user':
      return 'You don\'t have sufficient permissions to access this page. This area is restricted to managers and administrators.'
    case 'manager':
      return 'This page requires administrator privileges. Please contact your system administrator if you need access.'
    case 'admin':
      return 'Access to this page is restricted. Please check the URL or contact support if you believe this is an error.'
    default:
      return 'You don\'t have permission to access this page. Please contact your administrator for assistance.'
  }
}

const goBack = () => {
  // Try to go back in history, fallback to dashboard
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goToDashboard()
  }
}

const goToDashboard = () => {
  router.push({ name: 'dashboard' })
}

const contactAdmin = () => {
  // In a real application, this could open a support ticket system
  // or mailto link to administrators
  const subject = encodeURIComponent('Access Request - Unauthorized Page')
  const body = encodeURIComponent(`
Hello Administrator,

I am requesting access to a page that I currently don't have permissions for.

User Details:
- Email: ${currentUser.value?.email || 'Unknown'}
- Role: ${currentUser.value?.role || 'Unknown'}
- Requested Page: ${requestedPath.value || 'Unknown'}

Please review my access permissions and grant access if appropriate.

Thank you,
${currentUser.value?.firstName || 'User'} ${currentUser.value?.lastName || ''}
  `.trim())

  // Try to open default email client
  window.location.href = `mailto:admin@company.com?subject=${subject}&body=${body}`
  
  toast.info('Opening email client to contact administrator...')
}
</script>

<style scoped>
/* Additional styles if needed */
</style>

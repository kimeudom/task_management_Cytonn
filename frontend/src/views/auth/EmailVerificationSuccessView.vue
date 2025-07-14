<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Success Icon -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <CheckCircleIcon class="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Email Verified!
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Your email address has been successfully verified. You can now sign in to your account.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="mt-8 space-y-4">
        <!-- Show different buttons based on authentication status -->
        <router-link
          v-if="!isAuthenticated"
          to="/login"
          class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Sign In to Your Account
        </router-link>

        <router-link
          v-else
          to="/dashboard"
          class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Go to Dashboard
        </router-link>

        <div v-if="!isAuthenticated" class="text-center">
          <router-link
            to="/register"
            class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            Need to create a different account?
          </router-link>
        </div>
      </div>

      <!-- Additional Information -->
      <div class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-4">
        <div class="flex">
          <InformationCircleIcon class="h-5 w-5 text-blue-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
              What's next?
            </h3>
            <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul class="list-disc list-inside space-y-1">
                <li>Sign in with your email and password</li>
                <li>Complete your profile setup</li>
                <li>Start managing your tasks</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

// Composables
const authStore = useAuthStore()

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
</script>

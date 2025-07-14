<template>
  <div id="app" :class="{ 'dark': isDarkMode }">
    <!-- Loading Screen -->
    <div v-if="isInitializing" class="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    </div>

    <!-- Main Application -->
    <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <!-- Navigation -->
      <AppNavigation v-if="isAuthenticated" />

      <!-- Main Content -->
      <main :class="{ 'ml-64': isAuthenticated && !isMobile }">
        <router-view />
      </main>
    </div>

    <!-- Theme Toggle Button (Fixed Position) -->
    <button
      @click="toggleTheme"
      class="fixed bottom-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 z-40"
      :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <SunIcon v-if="isDarkMode" class="h-5 w-5 text-yellow-500" />
      <MoonIcon v-else class="h-5 w-5 text-gray-600" />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useBreakpoints } from '@vueuse/core'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import AppNavigation from '@/components/layout/AppNavigation.vue'

// Stores
const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

// Reactive state
const isInitializing = ref(true)

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isDarkMode = computed(() => themeStore.isDarkMode)

// Responsive breakpoints
const breakpoints = useBreakpoints({
  mobile: 768,
  tablet: 1024,
  desktop: 1280
})

const isMobile = breakpoints.smaller('mobile')

// Methods
const toggleTheme = () => {
  themeStore.toggleTheme()
}

// Initialize application
onMounted(async () => {
  try {
    // Initialize theme
    themeStore.initializeTheme()

    // Initialize authentication
    await authStore.initialize()

    // Don't redirect here - let router guards handle navigation
    // This prevents race conditions between app initialization and router guards
  } catch (error) {
    console.error('App initialization error:', error)
  } finally {
    isInitializing.value = false
  }
})

// Watch for authentication changes
watch(isAuthenticated, (newValue, oldValue) => {
  // Only redirect if authentication actually changed from true to false
  // and we're not already on an auth page
  if (oldValue === true && newValue === false &&
      !['login', 'register', 'verify-email', 'check-email'].includes(router.currentRoute.value.name)) {
    router.push('/login')
  }
})
</script>

<style>
/* Global styles will be handled by Tailwind CSS */
</style>
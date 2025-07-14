<template>
  <div>
    <!-- Mobile menu button -->
    <div class="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-4 py-3">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Task Manager
        </h1>
        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Bars3Icon v-if="!isMobileMenuOpen" class="h-6 w-6" />
          <XMarkIcon v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Mobile menu overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- Sidebar -->
    <div
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0"
      :class="{ '-translate-x-full': !isMobileMenuOpen && isMobile, 'translate-x-0': isMobileMenuOpen || !isMobile }"
    >
      <!-- Logo -->
      <div class="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Task Manager
        </h1>
      </div>

      <!-- Navigation -->
      <nav class="mt-8 px-4 space-y-2">
        <!-- Dashboard -->
        <router-link
          to="/"
          class="nav-link"
          :class="$route.name === 'dashboard' ? 'nav-link-active' : 'nav-link-inactive'"
          @click="closeMobileMenu"
        >
          <HomeIcon class="h-5 w-5 mr-3" />
          Dashboard
        </router-link>

        <!-- Tasks -->
        <router-link
          to="/tasks"
          class="nav-link"
          :class="$route.name === 'tasks' ? 'nav-link-active' : 'nav-link-inactive'"
          @click="closeMobileMenu"
        >
          <ClipboardDocumentListIcon class="h-5 w-5 mr-3" />
          Tasks
        </router-link>

        <!-- Gantt Chart -->
        <router-link
          to="/gantt"
          class="nav-link"
          :class="$route.name === 'gantt-chart' ? 'nav-link-active' : 'nav-link-inactive'"
          @click="closeMobileMenu"
        >
          <ChartBarIcon class="h-5 w-5 mr-3" />
          Gantt Chart
        </router-link>

        <!-- User Management (Admin only) -->
        <router-link
          v-if="authStore.isAdmin"
          to="/users"
          class="nav-link"
          :class="$route.name === 'users' ? 'nav-link-active' : 'nav-link-inactive'"
          @click="closeMobileMenu"
        >
          <UsersIcon class="h-5 w-5 mr-3" />
          User Management
        </router-link>

        <!-- Profile -->
        <router-link
          to="/profile"
          class="nav-link"
          :class="$route.name === 'profile' ? 'nav-link-active' : 'nav-link-inactive'"
          @click="closeMobileMenu"
        >
          <UserIcon class="h-5 w-5 mr-3" />
          Profile
        </router-link>
      </nav>

      <!-- User info and logout -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-3 mb-3">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-white">
                {{ userInitials }}
              </span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ authStore.userFullName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ authStore.userRole }}
            </p>
          </div>
        </div>
        
        <button
          @click="handleLogout"
          class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
        >
          <ArrowRightOnRectangleIcon class="h-5 w-5 mr-3" />
          Sign out
        </button>
      </div>
    </div>

    <!-- Main content spacer for desktop -->
    <div class="hidden lg:block w-64 flex-shrink-0"></div>
    
    <!-- Mobile content spacer -->
    <div class="lg:hidden h-16"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBreakpoints } from '@vueuse/core'
import { useToast } from 'vue-toastification'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UsersIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Responsive breakpoints
const breakpoints = useBreakpoints({
  mobile: 768,
  tablet: 1024,
  desktop: 1280
})

const isMobile = breakpoints.smaller('mobile')

// Reactive state
const isMobileMenuOpen = ref(false)

// Computed properties
const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return 'U'
  
  const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || ''
  
  return firstInitial + lastInitial || 'U'
})

// Methods
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    toast.success('Logged out successfully')
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
    toast.error('Error logging out')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            @click="$router.go(-1)"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeftIcon class="h-6 w-6" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              User Details
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              User ID: {{ $route.params.id }}
            </p>
          </div>
        </div>
      </div>

      <!-- User Details Card -->
      <div class="card">
        <div class="card-body">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="spinner h-8 w-8"></div>
          </div>
          <div v-else-if="!user" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">User not found</p>
          </div>
          <div v-else>
            <div class="flex items-center space-x-6 mb-6">
              <div class="flex-shrink-0">
                <div class="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
                  <span class="text-2xl font-medium text-white">
                    {{ getUserInitials(user) }}
                  </span>
                </div>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ user.firstName }} {{ user.lastName }}
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ user.email }}
                </p>
                <div class="flex items-center space-x-3 mt-2">
                  <span class="badge" :class="getRoleBadgeClass(user.role)">
                    {{ user.role }}
                  </span>
                  <span class="badge" :class="getStatusBadgeClass(user.status)">
                    {{ user.status }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  User Information
                </h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Username</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ user.username }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ user.email }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                    <dd class="mt-1">
                      <span class="badge" :class="getRoleBadgeClass(user.role)">
                        {{ user.role }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd class="mt-1">
                      <span class="badge" :class="getStatusBadgeClass(user.status)">
                        {{ user.status }}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Account Details
                </h3>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ formatDate(user.createdAt) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ formatDate(user.updatedAt) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Assigned</dt>
                    <dd class="mt-1 text-sm text-gray-900 dark:text-white">
                      {{ user.tasksCount || 0 }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="user && user.id !== authStore.user?.id" class="card-footer">
          <div class="flex justify-end space-x-3">
            <button
              @click="editUser"
              class="btn-primary"
            >
              Edit User
            </button>
            <button
              @click="deleteUser"
              class="btn-danger"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { apiService } from '@/services/api'
import { transformUserFromBackend } from '@/utils/dataTransforms'

// Composables
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const loading = ref(true)
const user = ref(null)

// Methods
const formatDate = (date) => {
  if (!date) return 'Not set'
  return format(new Date(date), 'MMM dd, yyyy')
}

const getUserInitials = (user) => {
  const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || ''
  return firstInitial + lastInitial || 'U'
}

const getRoleBadgeClass = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'badge-error'
    case 'manager':
      return 'badge-warning'
    default:
      return 'badge-info'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'badge-success'
    case 'suspended':
      return 'badge-warning'
    case 'deleted':
      return 'badge-error'
    default:
      return 'badge-secondary'
  }
}

const editUser = () => {
  router.push({ name: 'user-edit', params: { id: user.value.id } })
}

const deleteUser = async () => {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return
  }

  try {
    await apiService.users.delete(user.value.id)
    toast.success('User deleted successfully')
    router.push({ name: 'users' })
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.error('Failed to delete user')
  }
}

const fetchUser = async () => {
  try {
    loading.value = true
    const userId = route.params.id

    // Use the API service to fetch user details
    const response = await apiService.users.getById(userId)
    user.value = transformUserFromBackend(response.data.data || response.data)
  } catch (error) {
    console.error('Error fetching user:', error)
    toast.error('Failed to load user details')
    router.push({ name: 'users' })
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchUser()
})
</script>

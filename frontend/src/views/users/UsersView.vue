<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile-optimized padding and spacing -->
    <div class="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <!-- Mobile-first header with better spacing -->
      <div class="mb-6 sm:mb-8">
        <div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p class="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Manage user accounts and permissions
            </p>
          </div>
          <div class="flex-shrink-0">
            <BaseButton
              v-permission="'users.create'"
              variant="primary"
              :icon-left="PlusIcon"
              @click="openCreateModal"
              class="w-full sm:w-auto"
            >
              <span class="sm:hidden">Add User</span>
              <span class="hidden sm:inline">Add User</span>
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Mobile-optimized search and filters -->
      <div class="mb-6 space-y-4 sm:space-y-0">
        <!-- Search bar - full width on mobile -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </div>
          <input
            v-model="search"
            type="text"
            class="block w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-800 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            placeholder="Search users..."
          />
        </div>

        <!-- Mobile-optimized filter buttons -->
        <div class="flex flex-wrap gap-2 sm:gap-3">
          <div class="flex-1 min-w-0 sm:flex-none sm:min-w-[120px]">
            <select
              v-model="filterRole"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
          </div>
          <div class="flex-1 min-w-0 sm:flex-none sm:min-w-[120px]">
            <select
              v-model="filterStatus"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Mobile-optimized user list -->
      <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <!-- Loading state -->
        <div v-if="loading" class="p-6 text-center">
          <div class="spinner h-8 w-8"></div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>

        <!-- Mobile-first user cards (stacked on mobile, table on desktop) -->
        <div v-else-if="users.length > 0">
          <!-- Mobile view (cards) -->
          <div class="block sm:hidden">
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div
                v-for="user in paginatedUsers"
                :key="user.id"
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="flex items-start space-x-3">
                  <!-- Avatar -->
                  <div class="flex-shrink-0">
                    <div class="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span class="text-sm font-medium text-white">
                        {{ getUserInitials(user) }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- User info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ user.firstName }} {{ user.lastName }}
                      </p>
                      <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              :class="getRoleBadgeClass(user.role)">
                          {{ user.role }}
                        </span>
                      </div>
                    </div>
                    
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ user.email }}
                    </p>
                    
                    <div class="flex items-center justify-between mt-2">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            :class="getStatusBadgeClass(user.status)">
                        {{ user.status }}
                      </span>
                      
                      <!-- Mobile actions -->
                      <div class="flex items-center space-x-2">
                        <button
                          @click="viewUser(user)"
                          class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="View user"
                        >
                          <EyeIcon class="h-4 w-4" />
                        </button>
                        <button
                          @click="editUser(user)"
                          class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                          title="Edit user"
                          v-permission="'users.edit'"
                        >
                          <PencilIcon class="h-4 w-4" />
                        </button>
                        <button
                          @click="deleteUser(user)"
                          class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Delete user"
                          v-permission="'users.delete'"
                        >
                          <TrashIcon class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop view (table) -->
          <div class="hidden sm:block">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="user in paginatedUsers"
                  :key="user.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span class="text-sm font-medium text-white">
                          {{ getUserInitials(user) }}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ user.firstName }} {{ user.lastName }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {{ user.email }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getRoleBadgeClass(user.role)">
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getStatusBadgeClass(user.status)">
                      {{ user.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(user.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        @click="viewUser(user)"
                        class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="View user"
                      >
                        <EyeIcon class="h-4 w-4" />
                      </button>
                      <button
                        @click="editUser(user)"
                        class="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                        title="Edit user"
                        v-permission="'users.edit'"
                      >
                        <PencilIcon class="h-4 w-4" />
                      </button>
                      <button
                        @click="deleteUser(user)"
                        class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete user"
                        v-permission="'users.delete'"
                      >
                        <TrashIcon class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-12">
          <UsersIcon class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ search || filterRole || filterStatus ? 'Try adjusting your filters' : 'Get started by adding a new user' }}
          </p>
          <div class="mt-6">
            <BaseButton
              v-if="!search && !filterRole && !filterStatus"
              v-permission="'users.create'"
              variant="primary"
              :icon-left="PlusIcon"
              @click="openCreateModal"
            >
              Add User
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- Mobile-optimized pagination -->
      <div v-if="pages > 1" class="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <!-- Mobile pagination info -->
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Showing {{ ((page - 1) * limit) + 1 }} to {{ Math.min(page * limit, total) }} of {{ total }} results
        </div>
        
        <!-- Mobile-friendly pagination buttons -->
        <div class="flex items-center space-x-2">
          <button
            @click="changePage(page - 1)"
            :disabled="page <= 1"
            class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronLeftIcon class="h-4 w-4" />
          </button>
          
          <!-- Page numbers (simplified for mobile) -->
          <div class="hidden sm:flex items-center space-x-1">
            <button
              v-for="pageNum in visiblePages"
              :key="pageNum"
              @click="changePage(pageNum)"
              :class="[
                'px-3 py-2 text-sm font-medium border',
                pageNum === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              ]"
            >
              {{ pageNum }}
            </button>
          </div>
          
          <!-- Mobile page indicator -->
          <div class="sm:hidden px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
            {{ page }} / {{ pages }}
          </div>
          
          <button
            @click="changePage(page + 1)"
            :disabled="page >= pages"
            class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ChevronRightIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <UserModal
      v-model="showUserModal"
      :user="selectedUser"
      @user-created="handleUserCreated"
      @user-updated="handleUserUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import {
  PlusIcon,
  UsersIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { BaseButton } from '@/components/ui'
import UserModal from '@/components/users/UserModal.vue'
import { usePermissions } from '@/utils/permissions'
import userService from '@/services/users'
import { withErrorHandling } from '@/utils/errorHandler'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const { hasPermission } = usePermissions()

// Reactive state
const loading = ref(true)
const showUserModal = ref(false)
const selectedUser = ref(null)
const users = ref([])
const search = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const pages = computed(() => Math.ceil(total.value / limit.value))

// Filtered and paginated users
const filteredUsers = computed(() => {
  let filtered = users.value
  if (search.value) {
    const s = search.value.toLowerCase()
    filtered = filtered.filter(u =>
      u.firstName?.toLowerCase().includes(s) ||
      u.lastName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.username?.toLowerCase().includes(s)
    )
  }
  if (filterRole.value) {
    filtered = filtered.filter(u => u.role?.toLowerCase() === filterRole.value)
  }
  if (filterStatus.value) {
    filtered = filtered.filter(u => u.status?.toLowerCase() === filterStatus.value)
  }
  total.value = filtered.length
  return filtered
})

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * limit.value
  const end = start + limit.value
  return filteredUsers.value.slice(start, end)
})

// Visible pages for pagination
const visiblePages = computed(() => {
  const totalPages = pages.value
  const current = page.value
  const delta = 2
  const range = []
  const rangeWithDots = []

  for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (current + delta < totalPages - 1) {
    rangeWithDots.push('...', totalPages)
  } else {
    rangeWithDots.push(totalPages)
  }

  return rangeWithDots.filter((item, index, array) => array.indexOf(item) === index && item !== 1 || index === 0)
})

// Methods
const formatDate = (date) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString()
}

const getUserInitials = (user) => {
  const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || ''
  return firstInitial + lastInitial || 'U'
}

const getRoleBadgeClass = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'manager':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'suspended':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'deleted':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const viewUser = (user) => {
  router.push(`/users/${user.id}`)
}

const openCreateModal = () => {
  selectedUser.value = null
  showUserModal.value = true
}

const editUser = (user) => {
  selectedUser.value = user
  showUserModal.value = true
}

const deleteUser = withErrorHandling(async (user) => {
  if (!hasPermission('users.delete')) {
    toast.warning('You do not have permission to delete users')
    return
  }

  if (user.id === authStore.user?.id) {
    toast.warning('You cannot delete your own account')
    return
  }

  if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
    await userService.deleteUser(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    toast.success('User deleted successfully!')
  }
}, { context: 'Deleting user' })

const handleUserCreated = (newUser) => {
  users.value.unshift(newUser)
}

const handleUserUpdated = (updatedUser) => {
  const index = users.value.findIndex(u => u.id === updatedUser.id)
  if (index !== -1) {
    users.value[index] = updatedUser
  }
}

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= pages.value) {
    page.value = newPage
  }
}

const fetchUsers = withErrorHandling(async () => {
  loading.value = true
  try {
    const { users: userList } = await userService.getUsers()
    users.value = userList
  } catch (error) {
    console.error('Failed to load users:', error)
    toast.error('Failed to load users')
  } finally {
    loading.value = false
  }
}, { context: 'Loading users' })

// Watchers
watch([search, filterRole, filterStatus], () => {
  page.value = 1
})

onMounted(() => {
  fetchUsers()
})
</script>
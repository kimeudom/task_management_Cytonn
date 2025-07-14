<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Manage user accounts and permissions
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <BaseButton
            v-permission="'users.create'"
            variant="primary"
            :icon-left="PlusIcon"
            @click="openCreateModal"
          >
            Add User
          </BaseButton>
        </div>
      </div>
      <!-- Filters -->
      <div class="flex flex-wrap gap-2 mb-4">
        <input
          v-model="search"
          placeholder="Search users..."
          class="input input-bordered w-64"
        />
        <select v-model="filterRole" class="select select-bordered">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
        <select v-model="filterStatus" class="select select-bordered">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>
      <!-- Users List -->
      <BaseCard>
        <template #body>
          <div v-if="loading" class="flex justify-center py-8">
            <LoadingSpinner size="lg" text="Loading users..." />
          </div>
          <div v-else-if="filteredUsers.length === 0" class="text-center py-8">
            <UsersIcon class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">No users found</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="user in filteredUsers"
                  :key="user.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span class="text-sm font-medium text-white">
                            {{ getUserInitials(user) }}
                          </span>
                        </div>
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
                    <BaseBadge
                      :variant="getRoleBadgeVariant(user.role)"
                    >
                      {{ user.role }}
                    </BaseBadge>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <BaseBadge
                      :variant="getStatusBadgeVariant(user.status)"
                    >
                      {{ user.status }}
                    </BaseBadge>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(user.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        v-permission="'users.view'"
                        @click="viewUser(user)"
                        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="View user"
                      >
                        <EyeIcon class="h-5 w-5" />
                      </button>
                      <button
                        v-permission="'users.edit'"
                        @click="editUser(user)"
                        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Edit user"
                      >
                        <PencilIcon class="h-5 w-5" />
                      </button>
                      <button
                        v-permission="'users.delete'"
                        v-if="user.id !== authStore.user?.id"
                        @click="deleteUser(user)"
                        class="p-2 text-gray-400 hover:text-red-600"
                        title="Delete user"
                      >
                        <TrashIcon class="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Pagination -->
            <BasePagination
              v-if="pages > 1"
              :page="page"
              :pages="pages"
              @change-page="(p) => { page = p }"
            />
          </div>
        </template>
      </BaseCard>
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
import { format } from 'date-fns'
import {
  PlusIcon,
  UsersIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { BaseCard, BaseButton, BaseBadge, LoadingSpinner } from '@/components/ui'
import UserModal from '@/components/users/UserModal.vue'
import { apiService } from '@/services/api'
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
  return filtered.slice((page.value - 1) * limit.value, page.value * limit.value)
})

// Methods
const formatDate = (date) => {
  if (!date) return 'Unknown'
  return format(new Date(date), 'MMM dd, yyyy')
}

const getUserInitials = (user) => {
  const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || ''
  return firstInitial + lastInitial || 'U'
}

const getRoleBadgeVariant = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'danger'
    case 'manager':
      return 'warning'
    default:
      return 'info'
  }
}

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success'
    case 'suspended':
      return 'warning'
    case 'deleted':
      return 'danger'
    default:
      return 'default'
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

const fetchUsers = withErrorHandling(async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      search: search.value,
      role: filterRole.value,
      status: filterStatus.value
    }
    const { users: userList, pagination: pag } = await userService.getUsers(params)
    users.value = userList
    total.value = pag.total
    page.value = pag.page
    limit.value = pag.limit
  } catch (error) {
    console.error('Failed to load users:', error)
    toast.error('Failed to load users')
  } finally {
    loading.value = false
  }
}, { context: 'Loading users' })

// Watchers for filters and pagination
watch([search, filterRole, filterStatus, page, limit], () => {
  fetchUsers()
})

onMounted(() => {
  fetchUsers()
})
</script>

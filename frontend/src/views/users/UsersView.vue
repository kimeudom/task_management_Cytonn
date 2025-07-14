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

      <!-- User Table Card -->
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Users
          </h3>
        </div>
        <div class="card-body">
          <UserTable
            :users="users"
            :loading="loading"
            :pagination="{ page: page, pages: pages, limit: limit, total: total }"
            :filters="{ search: search, role: filterRole, status: filterStatus }"
            @edit-user="editUser"
            @delete-user="deleteUser"
            @view-user="viewUser"
            @change-page="(p) => { page = p }"
            @change-filters="onTableFiltersChange"
            @create-user="openCreateModal"
          />
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
  TrashIcon
} from '@heroicons/vue/24/outline'
import { BaseCard, BaseButton, BaseBadge, LoadingSpinner } from '@/components/ui'
import UserModal from '@/components/users/UserModal.vue'
import UserTable from '@/components/users/UserTable.vue'
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

function onTableFiltersChange(newFilters) {
  search.value = newFilters.search || ''
  filterRole.value = newFilters.role || ''
  filterStatus.value = newFilters.status || ''
  page.value = 1
}

// Watchers for filters and pagination
watch([search, filterRole, filterStatus, page, limit], () => {
  fetchUsers()
})

onMounted(() => {
  fetchUsers()
})
</script>
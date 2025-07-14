<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Edit User
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Update user information and permissions
          </p>
        </div>
        <button
          @click="goBack"
          class="btn-outline"
        >
          <ArrowLeftIcon class="w-4 h-4 mr-2" />
          Back to User
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="spinner h-8 w-8"></div>
      </div>

      <!-- Edit User Form -->
      <div v-else-if="user" class="max-w-2xl">
        <BaseCard>
          <template #body>
            <form @submit.prevent="updateUser" class="space-y-6">
              <!-- Personal Information -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="form-label required">First Name</label>
                  <input
                    v-model="form.firstName"
                    type="text"
                    class="form-input"
                    placeholder="Enter first name..."
                    required
                  />
                  <div v-if="errors.firstName" class="form-error">{{ errors.firstName }}</div>
                </div>

                <div>
                  <label class="form-label required">Last Name</label>
                  <input
                    v-model="form.lastName"
                    type="text"
                    class="form-input"
                    placeholder="Enter last name..."
                    required
                  />
                  <div v-if="errors.lastName" class="form-error">{{ errors.lastName }}</div>
                </div>

                <div>
                  <label class="form-label">Middle Name</label>
                  <input
                    v-model="form.middleName"
                    type="text"
                    class="form-input"
                    placeholder="Enter middle name..."
                  />
                </div>

                <div>
                  <label class="form-label required">Username</label>
                  <input
                    v-model="form.username"
                    type="text"
                    class="form-input"
                    placeholder="Enter username..."
                    required
                  />
                  <div v-if="errors.username" class="form-error">{{ errors.username }}</div>
                </div>

                <div class="md:col-span-2">
                  <label class="form-label required">Email</label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="form-input"
                    placeholder="Enter email address..."
                    required
                  />
                  <div v-if="errors.email" class="form-error">{{ errors.email }}</div>
                </div>

                <div class="md:col-span-2">
                  <label class="form-label required">Role</label>
                  <select v-model="form.role" class="form-input" required>
                    <option value="">Select Role</option>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div v-if="errors.role" class="form-error">{{ errors.role }}</div>
                  <div class="text-xs text-gray-500 mt-1">
                    <div><strong>User:</strong> Can view and update assigned tasks</div>
                    <div><strong>Manager:</strong> Can create, assign, and manage tasks</div>
                    <div><strong>Admin:</strong> Full system access including user management</div>
                  </div>
                </div>
              </div>

              <!-- Password Change Section -->
              <div class="border-t pt-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                    Change Password
                  </h3>
                  <button
                    type="button"
                    @click="showPasswordFields = !showPasswordFields"
                    class="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {{ showPasswordFields ? 'Cancel' : 'Change Password' }}
                  </button>
                </div>

                <div v-if="showPasswordFields" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="form-label required">New Password</label>
                    <input
                      v-model="form.password"
                      type="password"
                      class="form-input"
                      placeholder="Enter new password..."
                    />
                    <div v-if="errors.password" class="form-error">{{ errors.password }}</div>
                    <div class="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters long
                    </div>
                  </div>

                  <div>
                    <label class="form-label required">Confirm Password</label>
                    <input
                      v-model="form.confirmPassword"
                      type="password"
                      class="form-input"
                      placeholder="Confirm new password..."
                    />
                    <div v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</div>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex items-center justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  @click="goBack"
                  class="btn-outline"
                  :disabled="submitting"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn-primary"
                  :disabled="submitting"
                >
                  <div v-if="submitting" class="flex items-center space-x-2">
                    <div class="spinner h-4 w-4"></div>
                    <span>Updating...</span>
                  </div>
                  <span v-else>Update User</span>
                </button>
              </div>
            </form>
          </template>
        </BaseCard>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <div class="text-red-600 mb-4">
          <ExclamationTriangleIcon class="w-12 h-12 mx-auto mb-2" />
          <h3 class="text-lg font-medium">User Not Found</h3>
          <p class="text-sm">The user you're looking for doesn't exist or you don't have permission to edit them.</p>
        </div>
        <button @click="goBack" class="btn-primary">
          Back to Users
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { BaseCard } from '@/components/ui'
import { usePermissions } from '@/utils/permissions'
import userService from '@/services/users'
import { withErrorHandling } from '@/utils/errorHandler'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { hasPermission } = usePermissions()

// Check permission
if (!hasPermission('users.edit')) {
  router.push('/unauthorized')
}

const userId = route.params.id
const loading = ref(true)
const submitting = ref(false)
const showPasswordFields = ref(false)
const user = ref(null)

const form = reactive({
  firstName: '',
  lastName: '',
  middleName: '',
  username: '',
  email: '',
  role: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  role: '',
  password: '',
  confirmPassword: ''
})

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
  } else if (form.firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
    isValid = false
  }

  // Last name validation
  if (!form.lastName.trim()) {
    errors.lastName = 'Last name is required'
    isValid = false
  } else if (form.lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
    isValid = false
  }

  // Username validation
  if (!form.username.trim()) {
    errors.username = 'Username is required'
    isValid = false
  } else if (form.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
    isValid = false
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!emailRegex.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }

  // Role validation
  if (!form.role) {
    errors.role = 'Role is required'
    isValid = false
  }

  // Password validation (only if changing password)
  if (showPasswordFields.value) {
    if (!form.password) {
      errors.password = 'Password is required'
      isValid = false
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
      isValid = false
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
      isValid = false
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
      isValid = false
    }
  }

  return isValid
}

const loadUser = withErrorHandling(async () => {
  loading.value = true
  
  try {
    const userData = await userService.getUserById(userId)
    user.value = userData
    
    // Populate form
    form.firstName = userData.firstName
    form.lastName = userData.lastName
    form.middleName = userData.middleName || ''
    form.username = userData.username
    form.email = userData.email
    form.role = userData.role
  } finally {
    loading.value = false
  }
}, { context: 'Loading user' })

const updateUser = withErrorHandling(async () => {
  if (!validateForm()) {
    return
  }

  submitting.value = true

  try {
    const userData = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim(),
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role
    }

    // Include password if changing
    if (showPasswordFields.value && form.password) {
      userData.password = form.password
    }

    await userService.updateUser(userId, userData)
    
    toast.success('User updated successfully!')
    router.push({ name: 'user-detail', params: { id: userId } })
  } finally {
    submitting.value = false
  }
}, { context: 'Updating user' })

const goBack = () => {
  router.push({ name: 'user-detail', params: { id: userId } })
}

onMounted(() => {
  loadUser()
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #ef4444;
}

.form-error {
  @apply text-sm text-red-600 mt-1;
}

.spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
}
</style>

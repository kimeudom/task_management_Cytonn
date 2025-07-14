<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Create User
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Add a new user to the system
          </p>
        </div>
        <button
          @click="goBack"
          class="btn-outline"
        >
          <ArrowLeftIcon class="w-4 h-4 mr-2" />
          Back to Users
        </button>
      </div>

      <!-- Create User Form -->
      <div class="max-w-2xl">
        <BaseCard>
          <template #body>
            <form @submit.prevent="createUser" class="space-y-6">
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

                <div>
                  <label class="form-label required">Password</label>
                  <input
                    v-model="form.password"
                    type="password"
                    class="form-input"
                    placeholder="Enter password..."
                    required
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
                    placeholder="Confirm password..."
                    required
                  />
                  <div v-if="errors.confirmPassword" class="form-error">{{ errors.confirmPassword }}</div>
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
                    <span>Creating...</span>
                  </div>
                  <span v-else>Create User</span>
                </button>
              </div>
            </form>
          </template>
        </BaseCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { BaseCard } from '@/components/ui'
import { usePermissions } from '@/utils/permissions'
import userService from '@/services/users'
import { withErrorHandling } from '@/utils/errorHandler'

const router = useRouter()
const toast = useToast()
const { hasPermission } = usePermissions()

// Check permission
if (!hasPermission('users.create')) {
  router.push('/unauthorized')
}

const submitting = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  middleName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ''
})

const errors = reactive({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ''
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

  // Password validation
  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    isValid = false
  }

  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  // Role validation
  if (!form.role) {
    errors.role = 'Role is required'
    isValid = false
  }

  return isValid
}

const createUser = withErrorHandling(async () => {
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
      password: form.password,
      role: form.role
    }

    const newUser = await userService.createUser(userData)
    
    toast.success('User created successfully!')
    router.push({ name: 'user-detail', params: { id: newUser.id } })
  } finally {
    submitting.value = false
  }
}, { context: 'Creating user' })

const goBack = () => {
  router.push({ name: 'users' })
}
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

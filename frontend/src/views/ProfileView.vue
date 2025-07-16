<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="mobile-padding py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <!-- Profile Information -->
      <div class="card mb-6">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Profile Information
          </h3>
        </div>
        <div class="card-body">
          <div class="flex items-center space-x-6 mb-6">
            <div class="flex-shrink-0">
              <div class="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center">
                <span class="text-2xl font-medium text-white">
                  {{ userInitials }}
                </span>
              </div>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ authStore.userFullName }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                {{ authStore.user?.email }}
              </p>
              <span class="badge mt-2" :class="getRoleBadgeClass(authStore.userRole)">
                {{ authStore.userRole }}
              </span>
            </div>
          </div>
          
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  v-model="profileForm.firstName"
                  type="text"
                  class="form-input"
                  required
                />
              </div>
              <div>
                <label for="lastName" class="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  v-model="profileForm.lastName"
                  type="text"
                  class="form-input"
                  required
                />
              </div>
            </div>
            
            <div>
              <label for="email" class="form-label">
                Email
              </label>
              <input
                id="email"
                v-model="profileForm.email"
                type="email"
                class="form-input"
                required
              />
            </div>
            
            <div>
              <label for="username" class="form-label">
                Username
              </label>
              <input
                id="username"
                v-model="profileForm.username"
                type="text"
                class="form-input"
                required
              />
            </div>
            
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="profileLoading"
                class="btn-primary"
              >
                {{ profileLoading ? 'Updating...' : 'Update Profile' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Change Password -->
      <div class="card mb-6">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Change Password
          </h3>
        </div>
        <div class="card-body">
          <form @submit.prevent="changePassword" class="space-y-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div class="flex items-center">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  No current password verification required. Simply enter your new password.
                </p>
              </div>
            </div>
            
            <div>
              <label for="newPassword" class="form-label">
                New Password
              </label>
              <input
                id="newPassword"
                v-model="passwordForm.newPassword"
                type="password"
                class="form-input"
                required
              />
              <div v-if="passwordForm.newPassword" class="mt-2">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Password strength:
                  <span :class="passwordStrengthClass">{{ passwordStrengthText }}</span>
                </div>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Requirements: 8+ characters, uppercase, lowercase, number, special character (@$!%*?&)
                </div>
              </div>
            </div>
            
            <div>
              <label for="confirmPassword" class="form-label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                v-model="passwordForm.confirmPassword"
                type="password"
                class="form-input"
                required
              />
            </div>
            
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="passwordLoading"
                class="btn-primary"
              >
                {{ passwordLoading ? 'Changing...' : 'Change Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Account Settings -->
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Account Settings
          </h3>
        </div>
        <div class="card-body">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Receive email notifications for task updates
                </p>
              </div>
              <input
                v-model="settings.emailNotifications"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                  Browser Notifications
                </h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Show browser notifications for important updates
                </p>
              </div>
              <input
                v-model="settings.browserNotifications"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div class="flex justify-end pt-4">
              <button
                @click="updateSettings"
                :disabled="settingsLoading"
                class="btn-primary"
              >
                {{ settingsLoading ? 'Saving...' : 'Save Settings' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { apiService } from '@/services/api'

// Composables
const authStore = useAuthStore()
const toast = useToast()

// Reactive state
const profileLoading = ref(false)
const passwordLoading = ref(false)
const settingsLoading = ref(false)

const profileForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  username: ''
})

const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

const settings = reactive({
  emailNotifications: true,
  browserNotifications: false
})

// Computed properties
const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return 'U'
  
  const firstInitial = user.firstName?.charAt(0)?.toUpperCase() || ''
  const lastInitial = user.lastName?.charAt(0)?.toUpperCase() || ''
  
  return firstInitial + lastInitial || 'U'
})

// Methods
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

async function updateProfile() {
  try {
    profileLoading.value = true;
    const userId = authStore.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Only check username if changed
    if (profileForm.username && profileForm.username !== authStore.user?.username) {
      const res = await apiService.users.isUsernameTaken(profileForm.username);
      if (res.data?.taken) {
        toast.error('Username is already taken');
        profileLoading.value = false;
        return;
      }
    }

    // Prepare update payload
    const updatePayload = {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      email: profileForm.email,
      username: profileForm.username
    };

    const response = await apiService.users.update(userId, updatePayload);
    if (response.data.success) {
      toast.success('Profile updated successfully!');
      // If email changed, trigger verification
      if (profileForm.email !== authStore.user?.email) {
        try {
          await apiService.auth.resendVerification(profileForm.email);
          toast.info('Please check your email to verify your new address.');
        } catch (emailError) {
          console.warn('Failed to send verification email:', emailError);
          toast.warning('Profile updated but verification email could not be sent. Please try again later.');
        }
      }
      await authStore.refreshUser();
      return response.data;
    }
    throw new Error(response.data.message || 'Profile update failed');
  } catch (error) {
    toast.error(error.message || 'Profile update error');
    console.error('Profile update error:', error);
    throw error;
  } finally {
    profileLoading.value = false;
  }
}

async function changePassword() {
  try {
    passwordLoading.value = true;

    // Frontend validation
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).');
      return;
    }

    const userId = authStore.user?.id;
    if (!userId) throw new Error('User ID not found');

    // Use the dedicated password change endpoint
    const response = await apiService.users.changePassword(userId, {
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    });

    if (response.data.success) {
      toast.success('Password changed successfully!');
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      return response.data;
    }
    throw new Error(response.data.message || 'Password update failed');
  } catch (error) {
    // Handle specific validation errors from backend
    if (error.response?.data?.code === 'VALIDATION_ERROR') {
      const details = error.response.data.details;
      if (Array.isArray(details) && details.length > 0) {
        toast.error(details[0]); // Show first validation error
      } else {
        toast.error('Password validation failed');
      }
    } else {
      toast.error(error.response?.data?.error || error.message || 'Password change error');
    }
    console.error('Password change error:', error);
    throw error;
  } finally {
    passwordLoading.value = false;
  }
}

// TODO: Backend logic to handle settings update
// TODO: Implement profile update API call
const updateSettings = async () => {
  try {
    settingsLoading.value = true

    // For now, just save to localStorage since there's no backend settings endpoint
    localStorage.setItem('userSettings', JSON.stringify(settingsForm))

    toast.success('Settings saved successfully!')
  } catch (error) {
    console.error('Error updating settings:', error)
    toast.error('Failed to save settings')
  } finally {
    settingsLoading.value = false
  }
}

const loadProfileData = () => {
  const user = authStore.user
  if (user) {
    profileForm.firstName = user.firstName || ''
    profileForm.lastName = user.lastName || ''
    profileForm.email = user.email || ''
    profileForm.username = user.username || ''
  }
}

// Password strength computation
const passwordStrength = computed(() => {
  const password = passwordForm.newPassword
  if (!password) return 0

  let score = 0

  // Length check
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // Character type checks
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[@$!%*?&]/.test(password)) score += 1

  return score
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'Weak'
  if (strength <= 4) return 'Medium'
  if (strength <= 5) return 'Strong'
  return 'Very Strong'
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'text-red-600 font-medium'
  if (strength <= 4) return 'text-yellow-600 font-medium'
  if (strength <= 5) return 'text-green-600 font-medium'
  return 'text-green-700 font-bold'
})

// Lifecycle
onMounted(() => {
  loadProfileData()
})
</script>

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
            <div>
              <label for="currentPassword" class="form-label">
                Current Password
              </label>
              <input
                id="currentPassword"
                v-model="passwordForm.currentPassword"
                type="password"
                class="form-input"
                required
              />
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
  currentPassword: '',
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
        await apiService.auth.verifyEmail(profileForm.email);
        toast.info('Please check your email to verify your new address.');
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
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('New password cannot be the same as the old password.');
      return;
    }
    const userId = authStore.user?.id;
    if (!userId) throw new Error('User ID not found');
    // Optionally, verify current password on backend if needed
    // Update password using PATCH /users/:id
    const response = await apiService.users.update(userId, { password: passwordForm.newPassword });
    if (response.data.success) {
      toast.success('Password changed successfully!');
      passwordForm.currentPassword = '';
      passwordForm.newPassword = '';
      passwordForm.confirmPassword = '';
      return response.data;
    }
    throw new Error(response.data.message || 'Password update failed');
  } catch (error) {
    toast.error(error.message || 'Password change error');
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

// Lifecycle
onMounted(() => {
  loadProfileData()
})
</script>

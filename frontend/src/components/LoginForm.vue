<template>
  <div class="login-form">
    <div class="form-container">
      <h2>Login to Task Management</h2>
      
      <form @submit.prevent="handleLogin">
        <!-- Email Field -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            :disabled="loading"
            placeholder="Enter your email"
          />
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            :disabled="loading"
            placeholder="Enter your password"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading || !isFormValid"
          class="login-button"
        >
          <span v-if="loading">Logging in...</span>
          <span v-else>Login</span>
        </button>
      </form>

      <!-- Register Link -->
      <div class="register-link">
        <p>Don't have an account? <router-link to="/register">Register here</router-link></p>
      </div>

      <!-- Test Credentials -->
      <div class="test-credentials">
        <h4>Test Credentials:</h4>
        <div class="credential-item">
          <strong>Admin:</strong> kimeudom02@gmail.com / pass1234
          <button @click="fillCredentials('admin')" type="button">Use</button>
        </div>
        <div class="credential-item">
          <strong>User:</strong> marynjeri@gmail.com / pass1234
          <button @click="fillCredentials('user')" type="button">Use</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

export default {
  name: 'LoginForm',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const authStore = useAuthStore();

    const form = ref({
      email: '',
      password: ''
    });

    const loading = ref(false);
    const error = ref('');

    const isFormValid = computed(() => {
      return form.value.email && form.value.password;
    });

    const handleLogin = async () => {
      if (!isFormValid.value) return;

      loading.value = true;
      error.value = '';

      try {
        await authStore.login(form.value.email, form.value.password);
        
        // Redirect to intended page or dashboard
        const redirectTo = route.query.redirect || '/dashboard';
        router.push(redirectTo);
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const fillCredentials = (type) => {
      if (type === 'admin') {
        form.value.email = 'kimeudom02@gmail.com';
        form.value.password = 'pass1234';
      } else if (type === 'user') {
        form.value.email = 'marynjeri@gmail.com';
        form.value.password = 'pass1234';
      }
    };

    return {
      form,
      loading,
      error,
      isFormValid,
      handleLogin,
      fillCredentials
    };
  }
};
</script>

<style scoped>
.login-form {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.form-container {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #007bff;
}

input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.login-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.register-link a {
  color: #007bff;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.test-credentials {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.test-credentials h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 0.9rem;
}

.credential-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.credential-item button {
  padding: 0.25rem 0.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.7rem;
}

.credential-item button:hover {
  background-color: #218838;
}
</style>

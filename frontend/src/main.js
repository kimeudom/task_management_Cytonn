/**
 * Main Vue.js Application Entry Point
 * Initializes the Vue app with all necessary plugins and configurations
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './components/App.vue'
import Toast from 'vue-toastification'

// Import CSS
import './assets/css/main.css'
import 'vue-toastification/dist/index.css'

// Import debug utilities in development
if (import.meta.env.DEV) {
  import('./utils/authDebug.js')
}

// Toast configuration
const toastOptions = {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
}

// Create Vue app
const app = createApp(App)

// Install plugins
app.use(createPinia())
app.use(router)
app.use(Toast, toastOptions)

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error)
  console.error('Component instance:', instance)
  console.error('Error info:', info)
}

// Mount the app
app.mount('#app')
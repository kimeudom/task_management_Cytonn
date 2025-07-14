/**
 * Pinia Theme Store
 * Manages theme state (dark/light mode) with system preference detection
 */

import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDarkMode: false,
    systemPreference: 'light'
  }),

  getters: {
    /**
     * Get current theme name
     */
    currentTheme: (state) => state.isDarkMode ? 'dark' : 'light',

    /**
     * Check if using system preference
     */
    isUsingSystemPreference: (state) => {
      const savedPreference = localStorage.getItem('theme-preference')
      return !savedPreference || savedPreference === 'system'
    }
  },

  actions: {
    /**
     * Initialize theme on app start
     */
    initializeTheme() {
      // Detect system preference first
      this.detectSystemPreference()

      // Get saved preference from localStorage
      const savedPreference = localStorage.getItem('theme-preference')

      if (savedPreference === 'dark') {
        this.isDarkMode = true
      } else if (savedPreference === 'light') {
        this.isDarkMode = false
      } else {
        // Use system preference (no saved preference)
        this.isDarkMode = this.systemPreference === 'dark'
      }

      // Apply the theme immediately
      this.applyTheme()

      // Listen for system preference changes
      this.setupSystemPreferenceListener()
    },

    /**
     * Detect system color scheme preference
     */
    detectSystemPreference() {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.systemPreference = 'dark'
      } else {
        this.systemPreference = 'light'
      }
    },

    /**
     * Setup listener for system preference changes
     */
    setupSystemPreferenceListener() {
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        
        mediaQuery.addEventListener('change', (e) => {
          this.systemPreference = e.matches ? 'dark' : 'light'
          
          // If using system preference, update theme
          if (this.isUsingSystemPreference) {
            this.setDarkMode(e.matches)
          }
        })
      }
    },

    /**
     * Set dark mode state
     */
    setDarkMode(isDark) {
      this.isDarkMode = isDark
      this.applyTheme()
    },

    /**
     * Toggle between dark and light mode
     */
    toggleTheme() {
      const newMode = !this.isDarkMode
      this.setDarkMode(newMode)
      
      // Save preference to localStorage
      localStorage.setItem('theme-preference', newMode ? 'dark' : 'light')
    },

    /**
     * Set theme to light mode
     */
    setLightMode() {
      this.isDarkMode = false
      this.applyTheme()
      localStorage.setItem('theme-preference', 'light')
    },

    /**
     * Set theme to dark mode
     */
    setDarkModeExplicit() {
      this.isDarkMode = true
      this.applyTheme()
      localStorage.setItem('theme-preference', 'dark')
    },

    /**
     * Use system preference
     */
    useSystemPreference() {
      localStorage.removeItem('theme-preference')
      this.setDarkMode(this.systemPreference === 'dark')
    },

    /**
     * Apply theme to DOM
     */
    applyTheme() {
      const html = document.documentElement
      
      if (this.isDarkMode) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }

      // Update meta theme-color for mobile browsers
      this.updateMetaThemeColor()
    },

    /**
     * Update meta theme-color for mobile browsers
     */
    updateMetaThemeColor() {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]')
      
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta')
        metaThemeColor.name = 'theme-color'
        document.head.appendChild(metaThemeColor)
      }

      // Set appropriate color based on theme
      metaThemeColor.content = this.isDarkMode ? '#111827' : '#ffffff'
    }
  }
})

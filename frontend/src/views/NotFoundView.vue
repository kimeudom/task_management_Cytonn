<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <h1 class="text-9xl font-bold text-gray-300 dark:text-gray-600">
          404
        </h1>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page not found
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for.
        </p>
      </div>
      
      <div class="space-y-4">
        <router-link
          to="/"
          class="btn-primary w-full"
        >
          Go back home
        </router-link>
        
        <button
          @click="$router.go(-1)"
          class="btn-outline w-full"
        >
          Go back
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// This is a simple 404 page component
</script>

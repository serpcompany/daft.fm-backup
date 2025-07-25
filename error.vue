<template>
  <UContainer class="py-16">
    <div class="text-center">
      <h1 class="text-6xl font-bold mb-4">{{ error?.statusCode || '500' }}</h1>
      <p class="text-2xl mb-8">
        {{ error?.statusMessage || 'Something went wrong' }}
      </p>
      
      <div class="space-y-4">
        <p class="text-gray-600">
          <template v-if="error?.statusCode === 404">
            The page you're looking for doesn't exist.
          </template>
          <template v-else>
            An error occurred while processing your request.
          </template>
        </p>
        
        <div class="flex gap-4 justify-center">
          <UButton @click="handleError" variant="outline">
            Try Again
          </UButton>
          <UButton to="/" color="primary">
            Go Home
          </UButton>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const props = defineProps({
  error: Object
})

// PREVENTION: Log errors in development for debugging
if (process.dev) {
  console.error('Error page rendered:', props.error)
}

const handleError = () => clearError({ redirect: '/' })
</script>
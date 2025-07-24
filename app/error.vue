<template>
  <UContainer class="py-8">
    <div class="text-center">
      <h1 class="text-6xl font-bold mb-4">{{ error.statusCode }}</h1>
      <h2 class="text-2xl mb-4">{{ error.statusMessage }}</h2>
      <p class="text-gray-600 mb-8">{{ error.message }}</p>
      <UButton @click="handleError" variant="solid">
        Go back home
      </UButton>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage: string
    message?: string
  }
}>()

const handleError = () => clearError({ redirect: '/' })
</script>
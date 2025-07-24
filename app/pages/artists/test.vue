<template>
  <UContainer>
    <div class="py-8">
      <h1 class="text-3xl font-bold mb-6">Artists Test</h1>
      
      <div v-if="pending" class="text-center">
        <p>Loading artists...</p>
      </div>
      
      <div v-else-if="error" class="text-red-600">
        <p>Error: {{ error }}</p>
      </div>
      
      <div v-else-if="data?.data?.artists" class="space-y-4">
        <p class="text-green-600">✅ Found {{ data.data.artists.length }} artists!</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard v-for="artist in data.data.artists" :key="artist.id">
            <h3 class="font-semibold">{{ artist.name }}</h3>
            <p class="text-sm text-gray-600">{{ artist.country }} • {{ artist.formedYear }}</p>
          </UCard>
        </div>
      </div>
      
      <div v-else>
        <p>No artists found</p>
      </div>
    </div>
  </UContainer>
</template>

<script setup>
const { data, pending, error } = await $fetch('/api/artists').then(
  response => ({ data: response, error: null, pending: false }),
  err => ({ data: null, error: err.message || 'Unknown error', pending: false })
)
</script>
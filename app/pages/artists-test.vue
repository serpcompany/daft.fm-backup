<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Artists Test</h1>
    
    <!-- API Test Results -->
    <div v-if="pending" class="text-center py-8">
      <p class="text-gray-600">Loading artists...</p>
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p><strong>Error:</strong> {{ error }}</p>
    </div>
    
    <div v-else-if="data?.data?.artists" class="space-y-4">
      <p class="text-green-600 font-semibold">✅ API is working! Found {{ data.data.artists.length }} artists:</p>
      
      <div 
        v-for="artist in data.data.artists" 
        :key="artist.id"
        class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <h2 class="text-xl font-semibold mb-2">{{ artist.name }}</h2>
        <div class="text-gray-600 text-sm space-y-1">
          <p><strong>Country:</strong> {{ artist.country }}</p>
          <p><strong>Formed:</strong> {{ artist.formedYear }}</p>
          <p><strong>ID:</strong> {{ artist.id }}</p>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-8">
      <p class="text-gray-600">No data received</p>
    </div>

    <!-- Debug Info -->
    <details class="mt-8 p-4 bg-gray-100 rounded">
      <summary class="cursor-pointer font-semibold">Raw API Response</summary>
      <pre class="mt-2 text-xs overflow-auto">{{ JSON.stringify(data, null, 2) }}</pre>
    </details>
  </div>
</template>

<script setup>
const { data, error, pending } = await $fetch('/api/artists').then(
  response => ({ data: response, error: null, pending: false }),
  err => ({ data: null, error: err.message || 'Unknown error', pending: false })
).catch(() => ({ data: null, error: 'Network error', pending: false }))
</script>
<template>
  <UContainer class="py-8">
    <div class="mb-12 text-center">
      <h1 class="text-5xl font-bold mb-4">Welcome to Daft.fm</h1>
      <p class="text-xl text-gray-600">Explore our comprehensive music database</p>
    </div>

    <div class="grid gap-8 md:grid-cols-3">
      <UCard>
        <h2 class="text-2xl font-semibold mb-3">Artists</h2>
        <p class="text-gray-600 mb-4">Discover talented musicians and bands from around the world</p>
        <UButton to="/artists" variant="soft" block>
          Browse Artists
        </UButton>
      </UCard>

      <UCard>
        <h2 class="text-2xl font-semibold mb-3">Albums</h2>
        <p class="text-gray-600 mb-4">Explore complete discographies and album collections</p>
        <UButton to="/albums" variant="soft" block>
          Browse Albums
        </UButton>
      </UCard>

      <UCard>
        <h2 class="text-2xl font-semibold mb-3">Songs</h2>
        <p class="text-gray-600 mb-4">Find your favorite tracks and discover new music</p>
        <UButton to="/songs" variant="soft" block>
          Browse Songs
        </UButton>
      </UCard>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
// SEO Meta tags
useSeoMeta({
  title: 'Daft.fm - Music Database',
  description: 'Explore a comprehensive music database featuring artists, albums, and songs. Discover new music and explore detailed information about your favorite artists.',
  ogTitle: 'Daft.fm - Music Database',
  ogDescription: 'Explore a comprehensive music database featuring artists, albums, and songs.',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>
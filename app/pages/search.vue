<template>
  <div class="py-8">
    <UPage>
      <UPageHeader 
        :title="`Search Results for \"${searchQuery}\"`"
        :description="`Found ${totalResults} results`"
      />

      <div v-if="pending" class="space-y-4">
        <USkeleton class="h-20 w-full" v-for="i in 5" :key="i" />
      </div>

      <div v-else-if="error">
        <UAlert 
          color="red"
          icon="i-heroicons-exclamation-triangle"
          title="Search failed"
          :description="error.message || 'Failed to perform search'"
        />
      </div>

      <div v-else-if="data && data.results" class="space-y-8">
        <!-- Artists Results -->
        <div v-if="data.results.artists.length > 0">
          <h2 class="text-2xl font-bold mb-4">Artists</h2>
          <div class="grid gap-4">
            <UCard 
              v-for="artist in data.results.artists" 
              :key="artist.id"
              :to="`/artists/${artist.slug}`"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="flex items-center gap-4">
                <div v-if="artist.images && JSON.parse(artist.images).length > 0" class="w-16 h-16 flex-shrink-0">
                  <img 
                    :src="JSON.parse(artist.images)[0]" 
                    :alt="artist.name"
                    class="w-full h-full object-cover rounded"
                  />
                </div>
                <div v-else class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
                <div>
                  <h3 class="font-semibold text-lg">{{ artist.name }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ artist.country }} • Formed {{ artist.formedYear }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Albums Results -->
        <div v-if="data.results.albums.length > 0">
          <h2 class="text-2xl font-bold mb-4">Albums</h2>
          <div class="grid gap-4">
            <UCard 
              v-for="album in data.results.albums" 
              :key="album.id"
              :to="`/albums/${album.artistSlug}-${album.slug}`"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="flex items-center gap-4">
                <div v-if="album.coverArt && JSON.parse(album.coverArt).length > 0" class="w-16 h-16 flex-shrink-0">
                  <img 
                    :src="JSON.parse(album.coverArt)[0]" 
                    :alt="album.title"
                    class="w-full h-full object-cover rounded"
                  />
                </div>
                <div v-else class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
                <div>
                  <h3 class="font-semibold text-lg">{{ album.title }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    by {{ album.artistName }} • {{ album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'Unknown' }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Songs Results -->
        <div v-if="data.results.songs.length > 0">
          <h2 class="text-2xl font-bold mb-4">Songs</h2>
          <div class="grid gap-4">
            <UCard 
              v-for="song in data.results.songs" 
              :key="song.id"
              :to="`/songs/${song.artistSlug}-${song.slug}`"
              class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-lg">{{ song.title }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    by {{ song.artistName }}
                    <span v-if="song.albumTitle"> • {{ song.albumTitle }}</span>
                  </p>
                </div>
                <div v-if="song.duration" class="text-sm text-gray-500">
                  {{ formatDuration(song.duration) }}
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- No Results -->
        <div v-if="totalResults === 0" class="text-center py-12">
          <Icon name="i-heroicons-magnifying-glass" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p class="text-xl text-gray-600 dark:text-gray-400">No results found for "{{ searchQuery }}"</p>
          <p class="text-gray-500 mt-2">Try searching with different keywords</p>
        </div>
      </div>
    </UPage>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// Get search query from URL
const searchQuery = computed(() => route.query.q as string || '')

// Redirect if no search query
if (!searchQuery.value) {
  router.push('/')
}

// Fetch search results
const { data, error, pending } = await useFetch('/api/search', {
  query: {
    q: searchQuery.value,
    type: 'all',
    limit: 20
  }
})

// Calculate total results
const totalResults = computed(() => {
  if (!data.value?.results) return 0
  return data.value.totalResults
})

// Format duration helper
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// SEO
useSeoMeta({
  title: `Search: ${searchQuery.value} - DAFT.FM`,
  description: `Search results for "${searchQuery.value}" on DAFT.FM`
})
</script>
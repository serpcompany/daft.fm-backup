<template>
  <UContainer class="py-8">
    <div v-if="pending">
      <USkeleton class="h-10 w-1/2 mb-4" />
      <USkeleton class="h-6 w-1/3 mb-8" />
      <USkeleton class="h-32 w-full mb-4" />
      <USkeleton class="h-64 w-full" />
    </div>

    <div v-else-if="error">
      <UAlert 
        color="red"
        icon="i-heroicons-exclamation-triangle"
        title="Error loading artist"
        :description="error.message || 'Failed to load artist details'"
      />
    </div>

    <div v-else-if="artist">
      <!-- Artist Header -->
      <div class="mb-8">
        <h1 class="text-5xl font-bold mb-4">{{ artist.name }}</h1>
        
        <div class="flex flex-wrap gap-4 text-lg text-gray-600">
          <span v-if="artist.country">{{ artist.country }}</span>
          <span v-if="artist.formedYear">Formed {{ artist.formedYear }}</span>
        </div>
        
        <div v-if="artistGenres.length > 0" class="mt-4 flex flex-wrap gap-2">
          <span 
            v-for="genre in artistGenres" 
            :key="genre"
            class="px-3 py-1 bg-gray-100 rounded-full text-sm"
          >
            {{ genre }}
          </span>
        </div>
      </div>

      <!-- Artist Details -->
      <div class="grid gap-6">
        <!-- Images -->
        <div v-if="artistImages.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <img 
            v-for="(image, index) in artistImages" 
            :key="index"
            :src="image"
            :alt="`${artist.name} photo ${index + 1}`"
            class="w-full h-48 object-cover rounded-lg"
          />
        </div>

        <!-- Bio -->
        <UCard v-if="artist.bio">
          <h2 class="text-2xl font-semibold mb-4">Biography</h2>
          <div class="prose max-w-none">{{ artist.bio }}</div>
        </UCard>

        <!-- Albums -->
        <UCard v-if="albums && albums.length > 0">
          <h2 class="text-2xl font-semibold mb-4">Albums ({{ albums.length }})</h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="album in albums"
              :key="album.id"
              :to="`/albums/${artist.slug}-${album.slug}`"
              class="p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 class="font-semibold">{{ album.title }}</h3>
              <p class="text-sm text-gray-600">
                {{ album.releaseDate ? formatYear(album.releaseDate) : 'Unknown year' }}
              </p>
              <p v-if="album.trackCount" class="text-sm text-gray-500">
                {{ album.trackCount }} tracks
              </p>
            </NuxtLink>
          </div>
        </UCard>

        <!-- Songs -->
        <UCard v-if="songs && songs.length > 0">
          <h2 class="text-2xl font-semibold mb-4">Songs ({{ songs.length }})</h2>
          <div class="divide-y divide-gray-200">
            <NuxtLink
              v-for="song in songs"
              :key="song.id"
              :to="`/songs/${artist.slug}-${song.slug}`"
              class="block py-3 px-1 hover:bg-gray-50 transition-colors"
            >
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-medium">{{ song.title }}</h3>
                  <p v-if="song.albumTitle" class="text-sm text-gray-600">
                    from {{ song.albumTitle }}
                  </p>
                </div>
                <span v-if="song.duration" class="text-sm text-gray-500">
                  {{ formatDuration(song.duration) }}
                </span>
              </div>
            </NuxtLink>
          </div>
        </UCard>

        <!-- External Links -->
        <UCard v-if="externalLinks.length > 0">
          <h2 class="text-2xl font-semibold mb-4">Find on</h2>
          <div class="flex flex-wrap gap-3">
            <UButton 
              v-for="link in externalLinks" 
              :key="link.service"
              :to="link.url"
              target="_blank"
              variant="outline"
              size="sm"
            >
              {{ link.service }}
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <div v-else>
      <UEmptyState 
        title="Artist not found"
        description="The artist you're looking for doesn't exist."
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { Artist, Album, Song } from '~/server/types'

const route = useRoute()
const slug = route.params.slug as string

// For now, we'll fetch by the slug directly
// In production with urlSlug, we'd use that instead
const { data, error, pending } = await useFetch(`/api/artists/${slug}`)

// Check for errors and throw with proper status code
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Artist not found',
    fatal: true
  })
}

const artist = computed(() => data.value?.data?.artist as Artist | undefined)
const albums = computed(() => data.value?.data?.albums as Album[] | undefined)
const songs = computed(() => data.value?.data?.songs as (Song & { albumTitle?: string })[] | undefined)

// Parse artist genres
const artistGenres = computed(() => {
  if (!artist.value?.genres) return []
  try {
    return JSON.parse(artist.value.genres)
  } catch (e) {
    return []
  }
})

// Parse artist images
const artistImages = computed(() => {
  if (!artist.value?.images) return []
  try {
    return JSON.parse(artist.value.images)
  } catch (e) {
    return []
  }
})

// Parse external IDs for links
const externalLinks = computed(() => {
  if (!artist.value?.externalIds) return []
  
  try {
    const ids = JSON.parse(artist.value.externalIds)
    const links = []
    
    if (ids.spotify_id) {
      links.push({ service: 'Spotify', url: `https://open.spotify.com/artist/${ids.spotify_id}` })
    }
    if (ids.apple_music_id) {
      links.push({ service: 'Apple Music', url: `https://music.apple.com/artist/${ids.apple_music_id}` })
    }
    if (ids.discogs_artist_id) {
      links.push({ service: 'Discogs', url: `https://www.discogs.com/artist/${ids.discogs_artist_id}` })
    }
    if (artist.value.id) {
      links.push({ service: 'MusicBrainz', url: `https://musicbrainz.org/artist/${artist.value.id}` })
    }
    
    return links
  } catch (e) {
    return []
  }
})

// Utility functions
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatYear(dateString: string | Date | number): string {
  const date = new Date(dateString)
  return date.getFullYear().toString()
}

// Set page meta
useHead({
  title: artist.value ? `${artist.value.name} - Artist` : 'Artist'
})
</script>
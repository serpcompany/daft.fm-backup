<template>
  <UContainer>
    <div v-if="pending">Loading artist...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="artist">
      <!-- Artist Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold">{{ artist.name }}</h1>
        <div class="mt-2 text-gray-600">
          <span v-if="artist.country">{{ artist.country }}</span>
          <span v-if="artist.formedYear"> • Founded {{ artist.formedYear }}</span>
        </div>
      </div>

      <!-- Albums Section -->
      <div v-if="albums?.length" class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Albums ({{ albums.length }})</h2>
        <ul class="space-y-2">
          <li v-for="album in albums" :key="album.id">
            <NuxtLink :to="`/albums/${artist.slug}-${album.slug}`" class="block hover:underline">
              {{ album.title }} 
              <span v-if="album.releaseDate" class="text-gray-500">
                ({{ new Date(album.releaseDate).getFullYear() }})
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Songs Section -->
      <div v-if="songs?.length">
        <h2 class="text-2xl font-semibold mb-4">Songs ({{ songs.length }})</h2>
        <ul class="space-y-1">
          <li v-for="song in songs" :key="song.id">
            <NuxtLink :to="`/songs/${artist.slug}-${song.slug}`" class="block hover:underline">
              {{ song.title }}
              <span v-if="song.duration" class="text-gray-500 text-sm">
                ({{ Math.floor(song.duration / 60) }}:{{ String(song.duration % 60).padStart(2, '0') }})
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
    <div v-else>Artist not found</div>
  </UContainer>
</template>

<script setup lang="ts">
import type { Artist, Album, Song } from '~/server/types'

const route = useRoute()
const slug = route.params.slug as string

// Fetch artist details by slug with short ID
const { data: artistResponse } = await useFetch<{success: boolean, data: Artist}>(`/api/artists/${slug}`)
const artist = computed(() => artistResponse.value?.data)

// Use the artist ID for additional queries
const artistId = computed(() => artist.value?.id)

// Fetch artist's albums
const { data: albumsResponse } = await useFetch<{success: boolean, data: {albums: Album[]}}>(`/api/albums`, {
  query: { artistId }
})
const albums = computed(() => albumsResponse.value?.data?.albums || [])

// Fetch artist's songs  
const { data: songsResponse } = await useFetch<{success: boolean, data: {songs: Song[]}}>(`/api/songs`, {
  query: { artistId }
})
const songs = computed(() => songsResponse.value?.data?.songs || [])

// Combine loading states
const pending = computed(() => !artistResponse.value || !albumsResponse.value || !songsResponse.value)
const error = computed(() => {
  if (!artistResponse.value?.success) return 'Failed to load artist'
  return null
})
</script>
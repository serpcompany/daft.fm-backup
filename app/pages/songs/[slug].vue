<template>
  <div class="py-8">
    <div v-if="pending">
      <USkeleton class="h-8 w-1/2 mb-4" />
      <USkeleton class="h-6 w-1/3 mb-8" />
      <USkeleton class="h-64 w-full" />
    </div>

    <div v-else-if="error">
      <UAlert 
        color="red"
        icon="i-heroicons-exclamation-triangle"
        title="Error loading song"
        :description="error.message || 'Failed to load song details'"
      />
    </div>

    <div v-else-if="song">
      <!-- Song Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">{{ song.title }}</h1>
        <div class="text-lg text-gray-600">
          <NuxtLink 
            v-if="artist" 
            :to="`/artists/${artist.slug}`"
            class="hover:underline"
          >
            {{ artist.name }}
          </NuxtLink>
          <span v-if="album"> • </span>
          <NuxtLink 
            v-if="album && artist" 
            :to="`/albums/${artist.slug}-${album.slug}`"
            class="hover:underline"
          >
            {{ album.title }}
          </NuxtLink>
        </div>
      </div>

      <!-- Song Details -->
      <div class="grid gap-6">
        <!-- Basic Info -->
        <UCard>
          <div class="grid gap-4">
            <div v-if="song.duration">
              <h3 class="font-semibold mb-1">Duration</h3>
              <p>{{ formatDuration(song.duration) }}</p>
            </div>
            
            <div v-if="song.releaseDate">
              <h3 class="font-semibold mb-1">Release Date</h3>
              <p>{{ formatDate(song.releaseDate) }}</p>
            </div>
          </div>
        </UCard>

        <!-- Artist Info -->
        <UCard v-if="artistGenres.length > 0 || artist?.country || artist?.formedYear">
          <h3 class="text-xl font-semibold mb-4">Artist Info</h3>
          <div class="grid gap-4">
            <div v-if="artistGenres.length > 0">
              <h4 class="font-semibold mb-1">Genres</h4>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="genre in artistGenres" 
                  :key="genre"
                  class="px-2 py-1 bg-gray-100 rounded text-sm"
                >
                  {{ genre }}
                </span>
              </div>
            </div>
            
            <div v-if="artist?.country">
              <h4 class="font-semibold mb-1">Country</h4>
              <p>{{ artist.country }}</p>
            </div>
            
            <div v-if="artist?.formedYear">
              <h4 class="font-semibold mb-1">Formed</h4>
              <p>{{ artist.formedYear }}</p>
            </div>
          </div>
        </UCard>

        <!-- Lyrics -->
        <UCard v-if="song.lyrics">
          <h3 class="text-xl font-semibold mb-4">Lyrics</h3>
          <div class="whitespace-pre-wrap">{{ song.lyrics }}</div>
        </UCard>

        <!-- Credits -->
        <UCard v-if="songCredits && songCredits.length > 0">
          <h3 class="text-xl font-semibold mb-4">Credits</h3>
          <div class="space-y-3">
            <div v-for="credit in songCredits" :key="`${credit.name}-${credit.roles.join('-')}`" class="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
              <span class="font-medium text-gray-900 sm:w-1/3">{{ credit.name }}</span>
              <span class="text-gray-600 sm:w-2/3">{{ credit.roles.join(', ') }}</span>
            </div>
          </div>
        </UCard>

        <!-- Annotations -->
        <UCard v-if="song.annotations">
          <h3 class="text-xl font-semibold mb-4">Annotations</h3>
          <div class="prose max-w-none" v-html="song.annotations"></div>
        </UCard>

        <!-- External Links -->
        <UCard v-if="externalLinks.length > 0">
          <h3 class="text-xl font-semibold mb-4">Listen On</h3>
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
      <UCard>
        <div class="text-center py-8">
          <p class="text-2xl font-semibold mb-2">Song not found</p>
          <p class="text-gray-500">The song you're looking for doesn't exist.</p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Song, Artist, Album } from '~/server/types'

// PREVENTION 1: Validate route parameters BEFORE any processing
definePageMeta({
  validate: async (route) => {
    const slug = route.params.slug
    // Ensure slug exists and is not 'undefined'
    if (!slug || slug === 'undefined' || typeof slug !== 'string') {
      return false // This will show 404 page
    }
    // Ensure slug has at least one hyphen (artist-song format)
    if (!slug.includes('-')) {
      return false
    }
    // Basic slug format validation
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return false
    }
    return true
  }
})

const route = useRoute()
const slug = route.params.slug as string

// PREVENTION 2: Validate data exists BEFORE using it
// Check if we even have a valid slug to work with
if (!slug || slug === 'undefined') {
  throw createError({
    statusCode: 404,
    statusMessage: 'Invalid song URL',
    fatal: true
  })
}

// PREVENTION 3: Use try-catch for API calls
const { data, error, pending } = await useFetch(`/api/songs/${slug}`, {
  // PREVENTION 4: Set default error behavior
  onResponseError({ response }) {
    // Handle API errors gracefully
    throw createError({
      statusCode: response.status || 404,
      statusMessage: 'Song not found',
      fatal: true
    })
  }
})

// PREVENTION 5: Check both error AND data validity
if (error.value || !data.value || !data.value.success) {
  throw createError({
    statusCode: error.value?.statusCode || 404,
    statusMessage: error.value?.statusMessage || 'Song not found',
    fatal: true
  })
}

// PREVENTION 6: Validate data structure before using
const song = computed(() => {
  const s = data.value?.data?.song
  if (!s || !s.id || !s.title) return undefined
  return s as Song
})

const artist = computed(() => {
  const a = data.value?.data?.artist
  if (!a || !a.id || !a.name) return undefined
  return a as Artist
})

const album = computed(() => {
  const a = data.value?.data?.album
  // Album is optional, so just check if it exists
  return a as Album | undefined
})

// PREVENTION 7: If critical data is missing, show 404
if (!song.value || !artist.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Song not found',
    fatal: true
  })
}

// Parse artist genres
const artistGenres = computed(() => {
  if (!artist.value?.genres) return []
  try {
    return JSON.parse(artist.value.genres)
  } catch (e) {
    return []
  }
})

// Parse song credits
const songCredits = computed(() => {
  if (!song.value?.credits) return []
  try {
    const parsed = JSON.parse(song.value.credits)
    // Handle both array format and object format for backwards compatibility
    if (Array.isArray(parsed)) {
      return parsed
    }
    // Convert object format to array format
    return Object.entries(parsed).map(([name, roles]) => ({
      name,
      roles: Array.isArray(roles) ? roles : [roles]
    }))
  } catch (e) {
    return []
  }
})

// Parse external IDs for links
const externalLinks = computed(() => {
  if (!song.value?.externalIds) return []
  
  try {
    const ids = JSON.parse(song.value.externalIds)
    const links = []
    
    if (ids.spotify_id) {
      links.push({ service: 'Spotify', url: `https://open.spotify.com/track/${ids.spotify_id}` })
    }
    if (ids.apple_music_id) {
      links.push({ service: 'Apple Music', url: `https://music.apple.com/song/${ids.apple_music_id}` })
    }
    if (ids.youtube_id) {
      links.push({ service: 'YouTube', url: `https://youtube.com/watch?v=${ids.youtube_id}` })
    }
    if (ids.genius_song_id) {
      links.push({ service: 'Genius', url: `https://genius.com/songs/${ids.genius_song_id}` })
    }
    if (song.value.id) {
      links.push({ service: 'MusicBrainz', url: `https://musicbrainz.org/recording/${song.value.id}` })
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

function formatDate(dateString: string | Date | number): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'item'
}

import { generateSeoMeta, buildCanonicalUrl } from '~/utils/seo'

// Dynamic SEO meta tags
const canonicalUrl = computed(() => buildCanonicalUrl(`/songs/${route.params.slug}`))
const albumCoverArt = computed(() => {
  if (!album.value?.coverArt) return []
  try {
    return JSON.parse(album.value.coverArt)
  } catch (e) {
    return []
  }
})

const seoMeta = computed(() => 
  generateSeoMeta('song', {
    title: song.value?.title,
    artistName: artist.value?.name,
    albumTitle: album.value?.title,
    year: song.value?.releaseDate ? new Date(song.value.releaseDate).getFullYear() : undefined,
    duration: song.value?.duration,
    images: albumCoverArt.value,
    path: `/songs/${route.params.slug}`
  })
)

useSeoMeta(seoMeta)

// Add canonical URL
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl
    }
  ]
})

// JSON-LD structured data
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!song.value || !artist.value) return ''
        
        const musicRecording = {
          '@context': 'https://schema.org',
          '@type': 'MusicRecording',
          '@id': canonicalUrl.value,
          name: song.value.title,
          url: canonicalUrl.value,
          ...(song.value.releaseDate && { datePublished: new Date(song.value.releaseDate).toISOString() }),
          ...(song.value.duration && { duration: `PT${Math.floor(song.value.duration / 60)}M${song.value.duration % 60}S` }),
          ...(song.value.isrc && { isrcCode: song.value.isrc }),
          byArtist: {
            '@type': 'MusicGroup',
            '@id': `https://daft.fm/artists/${artist.value.slug}`,
            name: artist.value.name,
            url: `https://daft.fm/artists/${artist.value.slug}`
          }
        }
        
        // Add album if available
        if (album.value) {
          musicRecording.inAlbum = {
            '@type': 'MusicAlbum',
            '@id': `https://daft.fm/albums/${artist.value.slug}-${album.value.slug}`,
            name: album.value.title,
            url: `https://daft.fm/albums/${artist.value.slug}-${album.value.slug}`
          }
        }
        
        // Add external links as sameAs
        const sameAs = []
        if (externalLinks.value.length > 0) {
          externalLinks.value.forEach(link => {
            sameAs.push(link.url)
          })
          musicRecording.sameAs = sameAs
        }
        
        // Add lyrics if available
        if (song.value.lyrics) {
          musicRecording.lyrics = {
            '@type': 'CreativeWork',
            text: song.value.lyrics
          }
        }
        
        return JSON.stringify(musicRecording, null, 2)
      }).value
    }
  ]
})
</script>
<template>
  <UContainer class="py-8">
    <div v-if="pending">
      <USkeleton class="h-10 w-2/3 mb-4" />
      <USkeleton class="h-6 w-1/3 mb-8" />
      <USkeleton class="h-64 w-full mb-4" />
      <USkeleton class="h-96 w-full" />
    </div>

    <div v-else-if="error">
      <UAlert 
        color="red"
        icon="i-heroicons-exclamation-triangle"
        title="Error loading song"
        :description="error.message || 'Failed to load song details'"
      />
    </div>

    <div v-else-if="song && artist">
      <!-- Song Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">{{ song.title }}</h1>
        <p class="text-xl text-gray-600">
          by 
          <NuxtLink 
            :to="`/artists/${artist.slug}`"
            class="hover:underline"
          >
            {{ artist.name }}
          </NuxtLink>
          <span v-if="album">
            on 
            <NuxtLink 
              :to="`/albums/${artist.slug}-${album.slug}`"
              class="hover:underline"
            >
              {{ album.title }}
            </NuxtLink>
          </span>
        </p>
      </div>

      <!-- Song Details Grid -->
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Basic Info -->
        <UCard>
          <h2 class="text-2xl font-semibold mb-4">Song Information</h2>
          <div class="space-y-4">
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
        <UCard>
          <h2 class="text-2xl font-semibold mb-4">Artist Information</h2>
          <div class="space-y-4">
            <div v-if="artist.country">
              <h3 class="font-semibold mb-1">Country</h3>
              <p>{{ artist.country }}</p>
            </div>
            
            <div v-if="artist.formedYear">
              <h3 class="font-semibold mb-1">Formed</h3>
              <p>{{ artist.formedYear }}</p>
            </div>
            
            <div v-if="artistGenres.length > 0">
              <h3 class="font-semibold mb-1">Genres</h3>
              <div class="flex flex-wrap gap-2 mt-2">
                <UBadge v-for="genre in artistGenres" :key="genre" variant="subtle">
                  {{ genre }}
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Lyrics -->
        <UCard v-if="song.lyrics" class="md:col-span-2">
          <h2 class="text-2xl font-semibold mb-4">Lyrics</h2>
          <div class="whitespace-pre-wrap">{{ song.lyrics }}</div>
        </UCard>

        <!-- Annotations -->
        <UCard v-if="song.annotations" class="md:col-span-2">
          <h2 class="text-2xl font-semibold mb-4">Song Annotations</h2>
          <div class="prose max-w-none" v-html="song.annotations"></div>
        </UCard>

        <!-- External Links -->
        <UCard v-if="externalLinks.length > 0" class="md:col-span-2">
          <h2 class="text-2xl font-semibold mb-4">Listen on</h2>
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
        title="Song not found"
        description="The song you're looking for doesn't exist."
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import type { Song, Artist, Album } from '~/server/types'

const route = useRoute()
const artistSlug = route.query.artist as string
const songSlug = route.query.song as string

if (!artistSlug || !songSlug) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Artist and song parameters are required',
    fatal: true
  })
}

// Fetch song data using query params
const { data, error, pending } = await useFetch('/api/songs/lookup', {
  query: {
    artist: artistSlug,
    song: songSlug
  }
})

// Check for errors and throw with proper status code
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Song not found',
    fatal: true
  })
}

const song = computed(() => data.value?.data?.song as Song | undefined)
const artist = computed(() => data.value?.data?.artist as Artist | undefined)
const album = computed(() => data.value?.data?.album as Album | undefined)

// Parse artist genres
const artistGenres = computed(() => {
  if (!artist.value?.genres) return []
  try {
    return JSON.parse(artist.value.genres)
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

// Dynamic SEO meta tags
const canonicalUrl = computed(() => {
  if (!artistSlug || !songSlug) return 'https://daft.fm/song'
  return `https://daft.fm/song?artist=${artistSlug}&song=${songSlug}`
})

const albumCoverArt = computed(() => {
  if (!album.value?.coverArt) return []
  try {
    return JSON.parse(album.value.coverArt)
  } catch (e) {
    return []
  }
})

useSeoMeta({
  title: () => song.value && artist.value ? `${song.value.title} by ${artist.value.name} | Daft.fm` : 'Song | Daft.fm',
  description: () => {
    if (!song.value || !artist.value) return 'Song information on Daft.fm'
    const albumText = album.value ? ` from ${album.value.title}` : ''
    const duration = song.value.duration ? ` (${formatDuration(song.value.duration)})` : ''
    const year = song.value.releaseDate ? ` (${new Date(song.value.releaseDate).getFullYear()})` : ''
    return `Listen to ${song.value.title} by ${artist.value.name}${albumText}${year}${duration}. Lyrics and details on Daft.fm.`.substring(0, 160)
  },
  ogTitle: () => song.value && artist.value ? `${song.value.title} by ${artist.value.name} | Daft.fm` : 'Song | Daft.fm',
  ogDescription: () => song.value && artist.value ? `Stream ${song.value.title} by ${artist.value.name} on Daft.fm` : 'Song information',
  ogImage: () => albumCoverArt.value[0] || '/og-image.png',
  ogUrl: canonicalUrl,
  ogType: 'music.song',
  twitterCard: 'summary_large_image',
  twitterTitle: () => song.value && artist.value ? `${song.value.title} by ${artist.value.name}` : 'Song',
  twitterDescription: () => song.value && artist.value ? `Listen on Daft.fm` : 'Song information',
  twitterImage: () => albumCoverArt.value[0] || '/og-image.png'
})

// Add canonical URL
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl
    }
  ]
})
</script>
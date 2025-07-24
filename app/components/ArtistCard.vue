<template>
  <UCard 
    :to="artistUrl"
    :ui="{
      base: 'overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg',
      background: 'bg-white dark:bg-gray-900',
      ring: 'ring-1 ring-gray-200 dark:ring-gray-800',
      rounded: 'rounded-lg',
      shadow: 'shadow-sm'
    }"
  >
    <!-- Artist Image Placeholder -->
    <template #header>
      <div class="aspect-square w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        <UIcon 
          name="i-heroicons-musical-note" 
          class="h-12 w-12 text-gray-400 dark:text-gray-500"
        />
      </div>
    </template>

    <!-- Artist Details -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 dark:text-white truncate">
        {{ artist.name }}
      </h3>
      
      <div class="mt-2 space-y-1">
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <UIcon name="i-heroicons-globe-alt" class="h-4 w-4 mr-1.5 flex-shrink-0" />
          <span class="truncate">{{ artist.country || 'Unknown' }}</span>
        </div>
        
        <div v-if="artist.formedYear" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <UIcon name="i-heroicons-calendar" class="h-4 w-4 mr-1.5 flex-shrink-0" />
          <span>Founded {{ artist.formedYear }}</span>
        </div>
      </div>

      <!-- Genres -->
      <div v-if="genres?.length" class="mt-3">
        <div class="flex flex-wrap gap-1">
          <UBadge 
            v-for="genre in genres.slice(0, 2)" 
            :key="genre"
            :label="genre"
            color="gray"
            variant="soft"
            size="xs"
          />
          <UBadge 
            v-if="genres.length > 2"
            :label="`+${genres.length - 2}`"
            color="gray"
            variant="soft"
            size="xs"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  artist: {
    id: string
    name: string
    slug: string
    country?: string
    formedYear?: number
    genres?: string
  }
}

const props = defineProps<Props>()

// Parse genres JSON
const genres = computed(() => {
  if (!props.artist.genres) return []
  try {
    return JSON.parse(props.artist.genres)
  } catch {
    return []
  }
})

// Generate artist URL using our URL utilities
const artistUrl = computed(() => {
  return `/artists/${props.artist.slug}-${props.artist.id}`
})
</script>
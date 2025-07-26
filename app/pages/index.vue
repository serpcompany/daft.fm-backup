<template>
  <div>
    <!-- Hero section -->
    <div class="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div class="px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 class="text-5xl md:text-6xl font-bold mb-6">Welcome to DAFT.FM</h1>
        <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Explore our comprehensive music database featuring thousands of artists, albums, and songs
        </p>
      </div>
    </div>
    <!-- Main content -->
    <div class="py-12">
      <div class="grid gap-8 md:grid-cols-3 mb-16">
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

      <!-- Featured section -->
      <div class="mt-16">
        <h2 class="text-3xl font-bold mb-8 text-center">Featured Artists</h2>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- This could be populated with featured artists from the database -->
          <div class="text-center text-gray-600 dark:text-gray-400 col-span-full py-8">
            <p>Featured artists coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { generateSeoMeta, buildCanonicalUrl } from '~/utils/seo'

// This page uses the default layout automatically
// The hero slot is not used on this page - the hero section is part of the main content

// Generate SEO meta tags using templates
const seoMeta = generateSeoMeta('home', {
  path: '/'
})

useSeoMeta(seoMeta)

// Add canonical URL
useHead({
  link: [
    {
      rel: 'canonical',
      href: buildCanonicalUrl('/')
    }
  ]
})

// JSON-LD structured data for the homepage
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://daft.fm/#website',
        url: 'https://daft.fm',
        name: 'DAFT.FM',
        description: 'A comprehensive music database featuring artists, albums, and songs',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://daft.fm/search?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      }, null, 2)
    }
  ]
})
</script>
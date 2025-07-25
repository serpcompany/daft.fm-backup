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
const canonicalUrl = 'https://daft.fm/'

useSeoMeta({
  title: 'Daft.fm - Music Database | Artists, Albums & Songs',
  description: 'Explore a comprehensive music database featuring artists, albums, and songs. Discover new music, browse complete discographies, and find detailed information.',
  ogTitle: 'Daft.fm - Music Database',
  ogDescription: 'Explore a comprehensive music database featuring artists, albums, and songs.',
  ogImage: '/og-image.png',
  ogUrl: canonicalUrl,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Daft.fm - Music Database',
  twitterDescription: 'Explore artists, albums, and songs',
  twitterImage: '/og-image.png'
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

// JSON-LD structured data for WebSite with SearchAction
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://daft.fm/#website',
        url: 'https://daft.fm',
        name: 'Daft.fm',
        description: 'A comprehensive music database featuring artists, albums, and songs',
        publisher: {
          '@type': 'Organization',
          name: 'Daft.fm',
          url: 'https://daft.fm'
        },
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
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  modules: [
    '@nuxt/ui-pro',
    '@nuxt/scripts'
  ],
  css: ['~/assets/css/main.css'],
  typescript: {
    typeCheck: true
  },
  uiPro: {
    license: process.env.NUXT_UI_PRO_LICENSE,
  },
  nitro: {
    modules: ['nitro-cloudflare-dev']
  },
  scripts: {
    registry: {
      googleTagManager: {
        id: 'GTM-NC8CG9R',
      },
      googleAdsense: {
        client: 'ca-pub-2343633734899216',
        autoAds: true,
      },
    },
  },
})

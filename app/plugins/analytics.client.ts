// Google Analytics and AdSense setup
export default defineNuxtPlugin(() => {
  // Only run on client side and in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Analytics disabled in development')
    return
  }

  // Google Analytics
  const { gtag, $script } = useScriptGoogleAnalytics({
    id: 'G-YEWX0MG05B'
  })

  // Track page views on route change
  const router = useRouter()
  router.afterEach((to) => {
    // Wait for script to load
    $script.then(() => {
      gtag('config', 'G-YEWX0MG05B', {
        page_path: to.fullPath
      })
    })
  })

  // Google AdSense
  useScriptGoogleAdsense({
    client: 'ca-pub-2343633734899216'
  })
})
export default defineAppConfig({
  // Site information (reactive)
  site: {
    name: 'DAFT FM',
    description: 'A comprehensive music database featuring artists, albums, and songs',
    url: 'https://daft.fm',
    defaultLocale: 'en',
    identity: {
      type: 'Organization'
    }
  },
  ui: {
    container: {
      constrained: 'max-w-[1200px]'
    }
  }
})
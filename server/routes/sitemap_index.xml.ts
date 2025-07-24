export default defineEventHandler(async (event) => {
  const baseUrl = process.env.NUXT_PUBLIC_URL || 'https://daft.fm'
  const today = new Date().toISOString()
  
  // Create sitemap index
  let sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n'
  sitemapIndex += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  // For now, we have one main sitemap
  // In the future, you could split this into:
  // - sitemap-static.xml (homepage, listing pages)
  // - sitemap-artists.xml
  // - sitemap-albums.xml
  // - sitemap-songs-1.xml, sitemap-songs-2.xml, etc.
  
  sitemapIndex += `  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>\n`

  sitemapIndex += '</sitemapindex>'

  // Set content type
  setHeader(event, 'content-type', 'text/xml; charset=utf-8')
  
  return sitemapIndex
})
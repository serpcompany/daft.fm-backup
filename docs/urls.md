# Daft.fm - Music Database

A comprehensive music database featuring artists, albums, and songs.

## URL Structure

The following URL patterns are used throughout the site:

| Page Type | Frontend URL | API Route | Description |
|-----------|--------------|-----------|-------------|
| **Homepage** | `/` | - | Main homepage |
| **Artist Listing** | `/artists` | `/api/artists` | Browse all artists with pagination |
| **Album Listing** | `/albums` | `/api/albums` | Browse all albums with pagination |
| **Song Listing** | `/songs` | `/api/songs` | Browse all songs with pagination |
| **Individual Artist** | `/artists/[artist-slug]` | `/api/artists/[slug]` | Individual artist page |
| | Example: `/artists/daft-punk` | Example: `/api/artists/daft-punk` | |
| **Individual Album** | `/albums/[artist-slug]-[album-slug]` | `/api/albums/[artist-slug]-[album-slug]` | Individual album page |
| | Example: `/albums/daft-punk-discovery` | Example: `/api/albums/daft-punk-discovery` | |
| **Individual Song** | `/songs/[artist-slug]-[song-slug]` | `/api/songs/[artist-slug]-[song-slug]` | Individual song page |
| | Example: `/songs/daft-punk-one-more-time` | Example: `/api/songs/daft-punk-one-more-time` | |

### Special Routes

| Route | Description |
|-------|-------------|
| `/sitemap.xml` | XML sitemap for search engines |
| `/sitemap_index.xml` | Sitemap index (for future expansion) |
| `/robots.txt` | Robots exclusion file |

### API Query Parameters

#### Listing Endpoints
All listing endpoints (`/api/artists`, `/api/albums`, `/api/songs`) support:
- `?page=1` - Page number (default: 1)
- `?limit=20` - Items per page (default: 20, max: 100)
- `?search=query` - Search filter

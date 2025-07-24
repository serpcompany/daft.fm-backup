// Comprehensive API testing to understand data structures and matching strategies

interface MusicBrainzArtist {
  id: string; // MBID - MusicBrainz ID (UUID)
  name: string;
  'sort-name': string;
  country?: string;
  area?: { id: string; name: string };
  isnis?: string[]; // International Standard Name Identifier
  aliases?: Array<{ name: string; locale?: string }>;
}

interface MusicBrainzRecording {
  id: string; // MBID
  title: string;
  length?: number; // milliseconds
  'artist-credit': Array<{
    name: string;
    artist: { id: string; name: string };
  }>;
}

interface MusicBrainzRelease {
  id: string; // MBID
  title: string;
  barcode?: string;
  date?: string;
  'release-group': { id: string; title: string };
}

// Test search for a specific example to see all available identifiers
async function testDetailedSearch() {
  console.log('=== Testing Detailed Search for Cross-Reference IDs ===\n');
  
  const headers = { 'User-Agent': 'DaftFM/1.0 (https://daft.fm)' };
  
  // Search for a well-known track with multiple data sources
  const track = 'Bohemian Rhapsody';
  const artist = 'Queen';
  
  // MusicBrainz recording search with includes
  const mbUrl = `https://musicbrainz.org/ws/2/recording?query=recording:"${track}" AND artist:"${artist}"&inc=artist-credits+isrcs+releases&fmt=json`;
  
  try {
    const mbResponse = await fetch(mbUrl, { headers });
    const mbData = await mbResponse.json();
    
    if (mbData.recordings && mbData.recordings.length > 0) {
      const recording = mbData.recordings[0];
      console.log('MusicBrainz Recording:', {
        mbid: recording.id,
        title: recording.title,
        length: recording.length,
        isrcs: recording.isrcs, // International Standard Recording Code
        artistCredit: recording['artist-credit']?.[0]?.artist,
        releaseCount: recording.releases?.length
      });
      
      // Get more details about the artist
      if (recording['artist-credit']?.[0]?.artist?.id) {
        const artistId = recording['artist-credit'][0].artist.id;
        const artistUrl = `https://musicbrainz.org/ws/2/artist/${artistId}?inc=url-rels&fmt=json`;
        const artistResponse = await fetch(artistUrl, { headers });
        const artistData = await artistResponse.json();
        
        console.log('\nMusicBrainz Artist URLs:');
        artistData.relations?.forEach((rel: any) => {
          if (rel.type === 'discogs' || rel.type === 'wikidata' || rel.type === 'spotify') {
            console.log(`- ${rel.type}: ${rel.url.resource}`);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test multiple APIs to understand matching
async function testMultipleAPIs() {
  console.log('\n\n=== Testing Multiple APIs for Same Artist ===\n');
  
  const testArtist = 'Daft Punk';
  const headers = { 'User-Agent': 'DaftFM/1.0' };
  
  // 1. MusicBrainz
  try {
    const mbResponse = await fetch(
      `https://musicbrainz.org/ws/2/artist?query=artist:"${testArtist}"&fmt=json`,
      { headers }
    );
    const mbData = await mbResponse.json();
    if (mbData.artists?.[0]) {
      console.log('MusicBrainz:', {
        mbid: mbData.artists[0].id,
        name: mbData.artists[0].name,
        country: mbData.artists[0].country,
        area: mbData.artists[0].area?.name
      });
    }
  } catch (e) {
    console.error('MusicBrainz error:', e);
  }
  
  // 2. Test Discogs search (no auth needed for search)
  try {
    const discogsUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(testArtist)}&type=artist&per_page=1`;
    const discogsResponse = await fetch(discogsUrl, { headers });
    const discogsData = await discogsResponse.json();
    
    if (discogsData.results?.[0]) {
      console.log('\nDiscogs:', {
        id: discogsData.results[0].id,
        uri: discogsData.results[0].uri,
        title: discogsData.results[0].title,
        resource_url: discogsData.results[0].resource_url
      });
    }
  } catch (e) {
    console.error('Discogs error:', e);
  }
}

// Main function
async function main() {
  await testDetailedSearch();
  await testMultipleAPIs();
  
  console.log('\n\n=== Key Insights for Data Matching ===');
  console.log('1. MusicBrainz uses MBIDs (UUIDs) as primary identifiers');
  console.log('2. ISRCs can link recordings across services');
  console.log('3. Barcodes (UPC/EAN) can link physical releases');
  console.log('4. MusicBrainz stores external URLs (Discogs, Spotify, etc.)');
  console.log('5. Artist names need fuzzy matching due to variations');
}

main().catch(console.error);
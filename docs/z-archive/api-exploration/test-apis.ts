// Test different music APIs to understand their data structures and identify matching fields

// MusicBrainz - Open API, no auth required for basic queries
async function testMusicBrainz() {
  console.log('\n=== Testing MusicBrainz API ===');
  
  try {
    // Search for an artist
    const artistSearch = await fetch('https://musicbrainz.org/ws/2/artist?query=artist:radiohead&fmt=json', {
      headers: { 'User-Agent': 'DaftFM/1.0 (https://daft.fm)' }
    });
    const artistData = await artistSearch.json();
    console.log('Artist search response:', artistData);
    if (artistData.artists && artistData.artists.length > 0) {
      console.log('\nFirst artist:', JSON.stringify(artistData.artists[0], null, 2));
    }
    
    // Search for a recording (song)
    const recordingSearch = await fetch('https://musicbrainz.org/ws/2/recording?query=recording:"karma police"&fmt=json', {
      headers: { 'User-Agent': 'DaftFM/1.0 (https://daft.fm)' }
    });
    const recordingData = await recordingSearch.json();
    if (recordingData.recordings && recordingData.recordings.length > 0) {
      console.log('\nFirst recording:', JSON.stringify(recordingData.recordings[0], null, 2));
    }
    
    // Search for a release (album)
    const releaseSearch = await fetch('https://musicbrainz.org/ws/2/release?query=release:"OK Computer"&fmt=json', {
      headers: { 'User-Agent': 'DaftFM/1.0 (https://daft.fm)' }
    });
    const releaseData = await releaseSearch.json();
    if (releaseData.releases && releaseData.releases.length > 0) {
      console.log('\nFirst release:', JSON.stringify(releaseData.releases[0], null, 2));
    }
  } catch (error) {
    console.error('MusicBrainz error:', error);
  }
}

// Discogs - Requires auth, but we can test public endpoints
async function testDiscogs() {
  console.log('\n\n=== Testing Discogs API ===');
  
  // Database search endpoint
  const searchUrl = 'https://api.discogs.com/database/search?q=Radiohead&type=artist';
  const headers = {
    'User-Agent': 'DaftFM/1.0'
  };
  
  try {
    const response = await fetch(searchUrl, { headers });
    const data = await response.json();
    console.log('Discogs artist search:', JSON.stringify(data.results[0], null, 2));
  } catch (error) {
    console.log('Discogs error:', error);
  }
}

// Run tests
async function runTests() {
  await testMusicBrainz();
  await testDiscogs();
}

runTests().catch(console.error);
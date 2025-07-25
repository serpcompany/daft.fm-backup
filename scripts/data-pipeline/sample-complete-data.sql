-- Sample data to test what "complete" pages look like
-- This includes all optional fields populated

-- Insert a sample artist with ALL fields populated
INSERT INTO artists (id, name, slug, url_slug, country, formed_year, genres, bio, images, wikidata_id, external_ids, created_at, updated_at) VALUES
('test-artist-001', 'Sample Artist', 'sample-artist', 'sample-artist', 'US', 2010, 
'["electronic", "indie", "experimental", "ambient"]', 
'Sample Artist is an electronic music producer known for blending ambient textures with experimental beats. Formed in 2010, they have released several critically acclaimed albums and performed at major festivals worldwide. Their unique sound combines analog synthesizers with field recordings and innovative production techniques.',
'["https://example.com/artist-photo-1.jpg", "https://example.com/artist-photo-2.jpg", "https://example.com/artist-photo-3.jpg"]',
'Q12345678',
'{"spotify_id": "1a2b3c4d5e", "apple_music_id": "123456789", "discogs_id": "12345", "lastfm_url": "https://last.fm/music/Sample+Artist", "bandcamp_url": "https://sampleartist.bandcamp.com", "soundcloud_url": "https://soundcloud.com/sampleartist", "youtube_channel": "UC1234567890", "instagram": "@sampleartist", "twitter": "@sampleartist"}',
1721826000, 1721826000);

-- Insert a sample album with ALL fields populated
INSERT INTO albums (id, title, slug, artist_id, release_date, track_count, cover_art, wikidata_id, external_ids, created_at, updated_at) VALUES
('test-album-001', 'Complete Album Example', 'complete-album-example', 'test-artist-001', 1609459200, 12,
'["https://example.com/album-cover-500.jpg", "https://example.com/album-cover-1000.jpg", "https://example.com/album-cover-thumbnail.jpg"]',
'Q87654321',
'{"spotify_album_id": "2b3c4d5e6f", "apple_music_album_id": "987654321", "discogs_release_id": "54321", "bandcamp_album_id": "1234567890", "youtube_playlist": "PL1234567890", "lastfm_album_url": "https://last.fm/music/Sample+Artist/Complete+Album+Example"}',
1721826000, 1721826000);

-- Insert a sample song with ALL fields populated
INSERT INTO songs (id, title, slug, duration, artist_id, album_id, release_date, lyrics, annotations, isrc, wikidata_id, external_ids, created_at, updated_at) VALUES
('test-song-001', 'Sample Song Title', 'sample-song-title', 245, 'test-artist-001', 'test-album-001', 1609459200,
'[Verse 1]
This is sample verse one
With multiple lines to show
How lyrics would appear
In our database

[Chorus]
This is the chorus section
It repeats throughout the song
Shows the structure clearly
For our display needs

[Verse 2]
Second verse continues here
With more lyrical content
To demonstrate formatting
And complete data storage

[Chorus]
This is the chorus section
It repeats throughout the song
Shows the structure clearly
For our display needs

[Bridge]
Bridge section shows variety
In the song structure
Different musical elements
Building to the end

[Outro]
Final section wraps it up
Fading out gradually',
'This song was written during a late-night studio session. The artist mentioned in an interview that the lyrics were inspired by their experiences touring Europe in 2019. The production features a vintage Moog synthesizer and field recordings from various cities. The bridge section includes a hidden sample from a 1960s jazz record, pitched down and reversed. Critics have noted the influence of early Detroit techno and UK garage in the rhythm section.',
'USRC12345678',
'Q11223344',
'{"spotify_track_id": "3c4d5e6f7g", "apple_music_track_id": "112233445", "youtube_video_id": "dQw4w9WgXcQ", "soundcloud_track_id": "123456789", "genius_song_id": "1234567", "musixmatch_track_id": "87654321", "lastfm_track_url": "https://last.fm/music/Sample+Artist/_/Sample+Song+Title"}',
1721826000, 1721826000);

-- Add a few more songs to show album context
INSERT INTO songs (id, title, slug, duration, artist_id, album_id, created_at, updated_at) VALUES
('test-song-002', 'Opening Track', 'opening-track', 180, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-003', 'Second Movement', 'second-movement', 210, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-004', 'Interlude', 'interlude', 90, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-005', 'Deep Cuts', 'deep-cuts', 300, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-006', 'Midnight Session', 'midnight-session', 280, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-007', 'Frequencies', 'frequencies', 195, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-008', 'Analog Dreams', 'analog-dreams', 220, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-009', 'Digital Sunrise', 'digital-sunrise', 260, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-010', 'Echoes', 'echoes', 340, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-011', 'Reflections', 'reflections', 215, 'test-artist-001', 'test-album-001', 1721826000, 1721826000),
('test-song-012', 'Closing Theme', 'closing-theme', 420, 'test-artist-001', 'test-album-001', 1721826000, 1721826000);

-- Add a second album to show artist context
INSERT INTO albums (id, title, slug, artist_id, release_date, track_count, created_at, updated_at) VALUES
('test-album-002', 'Earlier Work', 'earlier-work', 'test-artist-001', 1577836800, 10, 1721826000, 1721826000);
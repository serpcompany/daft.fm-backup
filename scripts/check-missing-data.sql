-- Check missing data for Artists
SELECT 
    COUNT(*) as total_artists,
    COUNT(CASE WHEN bio IS NULL OR bio = '' THEN 1 END) as missing_bio,
    COUNT(CASE WHEN images IS NULL OR images = '[]' THEN 1 END) as missing_images,
    COUNT(CASE WHEN members IS NULL OR members = '' THEN 1 END) as missing_members,
    COUNT(CASE WHEN genres IS NULL OR genres = '[]' THEN 1 END) as missing_genres,
    COUNT(CASE WHEN country IS NULL OR country = '' THEN 1 END) as missing_country,
    COUNT(CASE WHEN formed_year IS NULL THEN 1 END) as missing_formed_year
FROM artists;

-- Check missing data for Albums
SELECT 
    COUNT(*) as total_albums,
    COUNT(CASE WHEN cover_art IS NULL OR cover_art = '[]' THEN 1 END) as missing_cover_art,
    COUNT(CASE WHEN credits IS NULL OR credits = '' THEN 1 END) as missing_credits,
    COUNT(CASE WHEN genres IS NULL OR genres = '[]' THEN 1 END) as missing_genres,
    COUNT(CASE WHEN wikidata_id IS NULL OR wikidata_id = '' THEN 1 END) as missing_wikidata_id
FROM albums;

-- Check missing data for Songs
SELECT 
    COUNT(*) as total_songs,
    COUNT(CASE WHEN lyrics IS NULL OR lyrics = '' THEN 1 END) as missing_lyrics,
    COUNT(CASE WHEN annotations IS NULL OR annotations = '' THEN 1 END) as missing_annotations,
    COUNT(CASE WHEN credits IS NULL OR credits = '' THEN 1 END) as missing_credits,
    COUNT(CASE WHEN isrc IS NULL OR isrc = '' THEN 1 END) as missing_isrc,
    COUNT(CASE WHEN wikidata_id IS NULL OR wikidata_id = '' THEN 1 END) as missing_wikidata_id,
    COUNT(CASE WHEN duration IS NULL THEN 1 END) as missing_duration
FROM songs;
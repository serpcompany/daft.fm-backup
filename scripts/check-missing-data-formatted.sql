-- Check missing data for Artists
SELECT 
    'Artists' as table_name,
    COUNT(*) as total,
    printf('Bio: %d/%d missing (%.1f%%)', 
        COUNT(CASE WHEN bio IS NULL OR bio = '' THEN 1 END),
        COUNT(*),
        (COUNT(CASE WHEN bio IS NULL OR bio = '' THEN 1 END) * 100.0 / COUNT(*))
    ) as bio_status,
    printf('Images: %d/%d missing (%.1f%%)', 
        COUNT(CASE WHEN images IS NULL OR images = '[]' THEN 1 END),
        COUNT(*),
        (COUNT(CASE WHEN images IS NULL OR images = '[]' THEN 1 END) * 100.0 / COUNT(*))
    ) as images_status,
    printf('Members: %d/%d missing (%.1f%%)', 
        COUNT(CASE WHEN members IS NULL OR members = '' THEN 1 END),
        COUNT(*),
        (COUNT(CASE WHEN members IS NULL OR members = '' THEN 1 END) * 100.0 / COUNT(*))
    ) as members_status
FROM artists;

-- Check missing data for Albums
SELECT 
    'Albums' as table_name,
    COUNT(*) as total,
    printf('Cover Art: %d/%d missing (%.1f%%)', 
        COUNT(CASE WHEN cover_art IS NULL OR cover_art = '[]' THEN 1 END),
        COUNT(*),
        (COUNT(CASE WHEN cover_art IS NULL OR cover_art = '[]' THEN 1 END) * 100.0 / COUNT(*))
    ) as cover_art_status,
    printf('Credits: %d/%d missing (%.1f%%)', 
        COUNT(CASE WHEN credits IS NULL OR credits = '' THEN 1 END),
        COUNT(*),
        (COUNT(CASE WHEN credits IS NULL OR credits = '' THEN 1 END) * 100.0 / COUNT(*))
    ) as credits_status
FROM albums;

-- Check missing data for Songs
SELECT 
    'Songs' as table_name,
    COUNT(*) as total,
    printf('Lyrics: %d/%d missing (%.1f%%)', 
        COUNT(CASE WHEN lyrics IS NULL OR lyrics = '' THEN 1 END),
        COUNT(*),
        (COUNT(CASE WHEN lyrics IS NULL OR lyrics = '' THEN 1 END) * 100.0 / COUNT(*))
    ) as lyrics_status,
    printf('Credits: %d/%d missing (%.1f%%)', 
        COUNT(CASE WHEN credits IS NULL OR credits = '' THEN 1 END),
        COUNT(*),
        (COUNT(CASE WHEN credits IS NULL OR credits = '' THEN 1 END) * 100.0 / COUNT(*))
    ) as credits_status,
    printf('Duration: %d/%d missing (%.1f%%)', 
        COUNT(CASE WHEN duration IS NULL THEN 1 END),
        COUNT(*),
        (COUNT(CASE WHEN duration IS NULL THEN 1 END) * 100.0 / COUNT(*))
    ) as duration_status
FROM songs;
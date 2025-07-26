-- Sample seed data for development
-- Run with: wrangler d1 execute db-daftfm --local --file=scripts/seed-data.sql

-- Insert sample artists
INSERT INTO artists (id, name, slug, country, formed_year, genres, created_at, updated_at) VALUES
('056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'Daft Punk', 'daft-punk', 'FR', 1993, '["electronic", "house", "french house", "dance", "disco"]', 1721826000, 1721826000),
('f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'Justice', 'justice', 'FR', 2003, '["electronic", "electro", "french electro", "house", "dance"]', 1721826000, 1721826000),
('6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'Moderat', 'moderat', 'DE', 2002, '["electronic", "techno", "electronica", "ambient"]', 1721826000, 1721826000);

-- Insert sample albums
INSERT INTO albums (id, title, slug, artist_id, release_date, track_count, created_at, updated_at) VALUES
('47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', 'Discovery', 'discovery', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 983059200, 14, 1721826000, 1721826000),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Random Access Memories', 'random-access-memories', '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 1368748800, 13, 1721826000, 1721826000),
('b2c3d4e5-f6g7-8901-2345-678901bcdefg', '†', 'cross', 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 1181520000, 12, 1721826000, 1721826000),
('c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'Woman', 'woman', 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 1479427200, 8, 1721826000, 1721826000),
('d4e5f6g7-h8i9-0123-4567-890123defghi', 'Moderat', 'moderat', '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 1239062400, 11, 1721826000, 1721826000);

-- Insert sample songs
INSERT INTO songs (id, title, slug, duration, artist_id, album_id, created_at, updated_at) VALUES
-- Daft Punk - Discovery
('s1a2b3c4-d5e6-7890-1234-567890abcdef', 'One More Time', 'one-more-time', 320, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', 1721826000, 1721826000),
('s2b3c4d5-e6f7-8901-2345-678901bcdefg', 'Aerodynamic', 'aerodynamic', 212, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', 1721826000, 1721826000),
('s3c4d5e6-f7g8-9012-3456-789012cdefgh', 'Digital Love', 'digital-love', 301, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', '47b83c38-8a0e-4d93-9a5b-5c52d4b82f7c', 1721826000, 1721826000),

-- Daft Punk - Random Access Memories
('s4d5e6f7-g8h9-0123-4567-890123defghi', 'Get Lucky', 'get-lucky', 368, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 1721826000, 1721826000),
('s5e6f7g8-h9i0-1234-5678-901234efghij', 'Instant Crush', 'instant-crush', 337, '056e4f3e-d505-4dad-8ec1-d04f521cbb56', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 1721826000, 1721826000),

-- Justice - †
('s6f7g8h9-i0j1-2345-6789-012345fghijk', 'Genesis', 'genesis', 225, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 1721826000, 1721826000),
('s7g8h9i0-j1k2-3456-7890-123456ghijkl', 'D.A.N.C.E.', 'dance', 243, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 1721826000, 1721826000),

-- Justice - Woman
('s8h9i0j1-k2l3-4567-8901-234567hijklm', 'Safe', 'safe', 271, 'f54ba20c-aa3b-443e-a97e-6bee0329b0dd', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', 1721826000, 1721826000),

-- Moderat - Moderat
('s9i0j1k2-l3m4-5678-9012-345678ijklmn', 'A New Error', 'a-new-error', 495, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', 1721826000, 1721826000),
('s0j1k2l3-m4n5-6789-0123-456789jklmno', 'Rusty Nails', 'rusty-nails', 376, '6f70bfbe-f3b3-4985-8074-d3a67aad0e8b', 'd4e5f6g7-h8i9-0123-4567-890123defghi', 1721826000, 1721826000);
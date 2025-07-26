-- Reset database by deleting all data
-- Run with: wrangler d1 execute db-daftfm --local --file=scripts/reset-data.sql

-- Delete in reverse order to respect foreign key constraints
DELETE FROM songs;
DELETE FROM albums;
DELETE FROM artists;

-- Reset any auto-increment sequences if they exist
DELETE FROM sqlite_sequence WHERE name IN ('songs', 'albums', 'artists');
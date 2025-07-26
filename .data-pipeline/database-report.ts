#!/usr/bin/env tsx
// Database reporting script to show schema, row counts, and missing data
// Run with: pnpm tsx scripts/database-report.ts

import Database from 'better-sqlite3';
import { artists, albums, songs } from '../../server/database/schema';
import * as schema from '../../server/database/schema';

// Connect to local D1 database
const sqlite = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite');

console.log('====================================');
console.log('DATABASE SCHEMA REPORT');
console.log('====================================\n');

// Show schema for each table
console.log('TABLE SCHEMAS:');
console.log('--------------');

// Artists table
console.log('\n📚 ARTISTS TABLE:');
const artistColumns = sqlite.prepare("PRAGMA table_info(artists)").all();
artistColumns.forEach((col: any) => {
  console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
});

// Albums table
console.log('\n💿 ALBUMS TABLE:');
const albumColumns = sqlite.prepare("PRAGMA table_info(albums)").all();
albumColumns.forEach((col: any) => {
  console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
});

// Songs table
console.log('\n🎵 SONGS TABLE:');
const songColumns = sqlite.prepare("PRAGMA table_info(songs)").all();
songColumns.forEach((col: any) => {
  console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
});

console.log('\n====================================');
console.log('ROW COUNT REPORT');
console.log('====================================\n');

// Get row counts
const artistCount = sqlite.prepare("SELECT COUNT(*) as count FROM artists").get() as any;
const albumCount = sqlite.prepare("SELECT COUNT(*) as count FROM albums").get() as any;
const songCount = sqlite.prepare("SELECT COUNT(*) as count FROM songs").get() as any;

console.log(`📊 TABLE STATISTICS:`);
console.log(`  - Artists: ${artistCount.count.toLocaleString()} rows`);
console.log(`  - Albums:  ${albumCount.count.toLocaleString()} rows`);
console.log(`  - Songs:   ${songCount.count.toLocaleString()} rows`);
console.log(`  - TOTAL:   ${(artistCount.count + albumCount.count + songCount.count).toLocaleString()} rows`);

// Visual bar chart
const maxCount = Math.max(artistCount.count, albumCount.count, songCount.count);
const scale = 50 / maxCount; // Scale to 50 characters max

console.log('\n📈 VISUAL COMPARISON:');
console.log(`  Artists: ${'█'.repeat(Math.round(artistCount.count * scale))} (${artistCount.count})`);
console.log(`  Albums:  ${'█'.repeat(Math.round(albumCount.count * scale))} (${albumCount.count})`);
console.log(`  Songs:   ${'█'.repeat(Math.round(songCount.count * scale))} (${songCount.count})`);

console.log('\n====================================');
console.log('MISSING DATA REPORT');
console.log('====================================\n');

// Check missing data for Artists
const artistMissing = sqlite.prepare(`
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN bio IS NULL OR bio = '' THEN 1 END) as missing_bio,
    COUNT(CASE WHEN images IS NULL OR images = '[]' THEN 1 END) as missing_images,
    COUNT(CASE WHEN members IS NULL OR members = '' THEN 1 END) as missing_members,
    COUNT(CASE WHEN genres IS NULL OR genres = '[]' THEN 1 END) as missing_genres
  FROM artists
`).get() as any;

console.log('🎤 ARTISTS - Missing Data:');
console.log(`  - Bio:     ${artistMissing.missing_bio}/${artistMissing.total} missing (${Math.round(artistMissing.missing_bio * 100 / artistMissing.total)}%)`);
console.log(`  - Images:  ${artistMissing.missing_images}/${artistMissing.total} missing (${Math.round(artistMissing.missing_images * 100 / artistMissing.total)}%)`);
console.log(`  - Members: ${artistMissing.missing_members}/${artistMissing.total} missing (${Math.round(artistMissing.missing_members * 100 / artistMissing.total)}%)`);
console.log(`  - Genres:  ${artistMissing.missing_genres}/${artistMissing.total} missing (${Math.round(artistMissing.missing_genres * 100 / artistMissing.total)}%)`);

// Check missing data for Albums
const albumMissing = sqlite.prepare(`
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN cover_art IS NULL OR cover_art = '[]' THEN 1 END) as missing_cover_art,
    COUNT(CASE WHEN credits IS NULL OR credits = '' THEN 1 END) as missing_credits,
    COUNT(CASE WHEN genres IS NULL OR genres = '[]' THEN 1 END) as missing_genres
  FROM albums
`).get() as any;

console.log('\n💿 ALBUMS - Missing Data:');
console.log(`  - Cover Art: ${albumMissing.missing_cover_art}/${albumMissing.total} missing (${Math.round(albumMissing.missing_cover_art * 100 / albumMissing.total)}%)`);
console.log(`  - Credits:   ${albumMissing.missing_credits}/${albumMissing.total} missing (${Math.round(albumMissing.missing_credits * 100 / albumMissing.total)}%)`);
console.log(`  - Genres:    ${albumMissing.missing_genres}/${albumMissing.total} missing (${Math.round(albumMissing.missing_genres * 100 / albumMissing.total)}%)`);

// Check missing data for Songs
const songMissing = sqlite.prepare(`
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN lyrics IS NULL OR lyrics = '' THEN 1 END) as missing_lyrics,
    COUNT(CASE WHEN credits IS NULL OR credits = '' THEN 1 END) as missing_credits,
    COUNT(CASE WHEN duration IS NULL THEN 1 END) as missing_duration,
    COUNT(CASE WHEN isrc IS NULL OR isrc = '' THEN 1 END) as missing_isrc
  FROM songs
`).get() as any;

console.log('\n🎵 SONGS - Missing Data:');
console.log(`  - Lyrics:   ${songMissing.missing_lyrics}/${songMissing.total} missing (${Math.round(songMissing.missing_lyrics * 100 / songMissing.total)}%)`);
console.log(`  - Credits:  ${songMissing.missing_credits}/${songMissing.total} missing (${Math.round(songMissing.missing_credits * 100 / songMissing.total)}%)`);
console.log(`  - Duration: ${songMissing.missing_duration}/${songMissing.total} missing (${Math.round(songMissing.missing_duration * 100 / songMissing.total)}%)`);
console.log(`  - ISRC:     ${songMissing.missing_isrc}/${songMissing.total} missing (${Math.round(songMissing.missing_isrc * 100 / songMissing.total)}%)`);

console.log('\n====================================');
console.log('ENRICHMENT PRIORITIES');
console.log('====================================\n');

// Calculate enrichment priorities based on missing data
const priorities = [
  { name: 'Artist Images', missing: artistMissing.missing_images, total: artistMissing.total, source: 'Last.fm API' },
  { name: 'Artist Bios', missing: artistMissing.missing_bio, total: artistMissing.total, source: 'Last.fm API' },
  { name: 'Album Cover Art', missing: albumMissing.missing_cover_art, total: albumMissing.total, source: 'Cover Art Archive' },
  { name: 'Song Lyrics', missing: songMissing.missing_lyrics, total: songMissing.total, source: 'Genius API' },
  { name: 'Artist Genres', missing: artistMissing.missing_genres, total: artistMissing.total, source: 'Last.fm API' },
].sort((a, b) => b.missing - a.missing);

console.log('🎯 TOP PRIORITIES (by count):');
priorities.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name}: ${p.missing.toLocaleString()} items missing (${Math.round(p.missing * 100 / p.total)}%) - Source: ${p.source}`);
});

// Close database
sqlite.close();

console.log('\n✅ Report complete!\n');
#!/usr/bin/env python3
# Enrich song lyrics using lyricsgenius Python library
# Run with: python scripts/data-pipeline/enrich-lyrics-python.py

import os
import sqlite3
import json
import time
from datetime import datetime
from typing import Optional, Dict, Any
import lyricsgenius
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database path (relative to project root)
DB_PATH = os.path.join(os.path.dirname(__file__), '../../../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/d70c6ecd352f5cc8e562adae9b685f2a6bd7204becb41a1d1c5ab6f9c4a3ccf0.sqlite')

def get_genius_client() -> lyricsgenius.Genius:
    """Initialize Genius client with API token"""
    token = os.getenv('GENIUS_API_CLIENT_ACCESS_TOKEN') or os.getenv('GENIUS_ACCESS_TOKEN')
    if not token:
        raise ValueError("❌ GENIUS_API_CLIENT_ACCESS_TOKEN not found in environment variables")
    
    # Initialize client
    genius = lyricsgenius.Genius(token)
    
    # Configure options
    genius.verbose = False  # Turn off verbose output
    genius.remove_section_headers = True  # Remove [Verse], [Chorus], etc.
    genius.skip_non_songs = True  # Skip non-songs (interviews, etc.)
    genius.excluded_terms = ["(Remix)", "(Live)", "(Demo)", "(Instrumental)"]  # Skip remixes
    
    return genius

def fetch_lyrics_by_id(genius: lyricsgenius.Genius, song_id: str, title: str, artist: str) -> Optional[str]:
    """Fetch lyrics for a song by searching with title and artist"""
    try:
        # Search for the song by title and artist (this includes web scraping)
        print(f"   Searching for \"{title}\" by {artist}...")
        song = genius.search_song(title, artist)
        
        if song:
            print(f"   Found: {song.title} by {song.artist}")
            if song.lyrics:
                lyrics = song.lyrics
                print(f"   Got lyrics, length: {len(lyrics)} characters")
            else:
                print("   Song found but no lyrics")
                return None
        else:
            print("   No song found")
            return None
        
        # Remove the "EmbedShare..." footer that Genius adds
        if "EmbedShare" in lyrics:
            lyrics = lyrics.split("EmbedShare")[0]
        
        # Remove trailing numbers and "Embed" text
        lines = lyrics.strip().split('\n')
        if lines and lines[-1].strip().isdigit():
            lines = lines[:-1]
        if lines and "Embed" in lines[-1]:
            lines = lines[:-1]
        
        lyrics = '\n'.join(lines).strip()
        
        print(f"   After cleaning: {len(lyrics)} characters")
        if len(lyrics) <= 50:
            print(f"   Too short! First 50 chars: {lyrics[:50]}")
        
        return lyrics if len(lyrics) > 50 else None
    except Exception as e:
        print(f"   ❌ Error fetching lyrics for ID {song_id}: {e}")
        return None

def main():
    print("🎶 Starting lyrics enrichment using lyricsgenius...\n")
    
    # Initialize Genius client
    try:
        genius = get_genius_client()
        print("✅ Connected to Genius API\n")
    except ValueError as e:
        print(e)
        return
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get songs with Genius IDs but no lyrics
    cursor.execute("""
        SELECT id, title, genius_song_id, 
               (SELECT name FROM artists WHERE id = songs.artist_id) as artist_name
        FROM songs 
        WHERE genius_song_id IS NOT NULL 
        AND genius_song_id != ''
        AND (lyrics IS NULL OR lyrics = '')
    """)
    
    songs = cursor.fetchall()
    print(f"Found {len(songs)} songs with Genius IDs to process\n")
    
    # Track progress
    stats = {
        'processed': 0,
        'updated': 0,
        'skipped': 0,
        'failed': 0
    }
    
    # Process each song
    for song in songs:
        stats['processed'] += 1
        song_id = song['genius_song_id']
        title = song['title']
        artist = song['artist_name'] or 'Unknown'
        
        print(f"🎵 Processing \"{title}\" by {artist}...")
        
        # Rate limiting (2 requests per second)
        time.sleep(0.5)
        
        # Fetch lyrics
        lyrics = fetch_lyrics_by_id(genius, song_id, title, artist)
        
        if lyrics:
            # Update database
            cursor.execute("""
                UPDATE songs 
                SET lyrics = ?, updated_at = ? 
                WHERE id = ?
            """, (lyrics, datetime.now(), song['id']))
            
            conn.commit()
            stats['updated'] += 1
            
            # Count lines and words
            lines = len(lyrics.split('\n'))
            words = len(lyrics.split())
            print(f"   ✅ Added {lines} lines, {words} words")
        else:
            stats['skipped'] += 1
            print(f"   ⏭️  No lyrics found or lyrics too short")
        
        # Progress report every 5 songs
        if stats['processed'] % 5 == 0:
            print(f"\n📊 Progress: {stats['processed']}/{len(songs)} ({stats['processed']*100//len(songs)}%)")
            print(f"   Updated: {stats['updated']}, Skipped: {stats['skipped']}, Failed: {stats['failed']}\n")
    
    # Final report
    print("\n" + "="*50)
    print("📊 FINAL REPORT")
    print("="*50)
    print(f"Total processed: {stats['processed']}")
    print(f"✅ Updated: {stats['updated']} ({stats['updated']*100//stats['processed']}%)")
    print(f"⏭️  Skipped: {stats['skipped']} ({stats['skipped']*100//stats['processed']}%)")
    print(f"❌ Failed: {stats['failed']} ({stats['failed']*100//stats['processed']}%)")
    print("\n✨ Lyrics enrichment complete!")
    
    # Close database
    conn.close()

if __name__ == "__main__":
    main()
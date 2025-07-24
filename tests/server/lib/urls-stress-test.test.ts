import { describe, it, expect } from 'vitest'
import { createSlug } from '../../../server/lib/urls'

describe('createSlug - stress test with real music names', () => {
  // Real music names from MusicBrainz and other sources
  const realMusicNames = [
    // Unicode and accented characters
    'Björk', 'Sigur Rós', 'Mötley Crüe', 'Motörhead', 'Blue Öyster Cult',
    'Queensrÿche', 'Café del Mar', 'Naïve', 'Señor Coconut', 'Dépêche Mode',
    'Пропаганда', 'БИ-2', 'Воплі Відоплясова', 'Земфира', 'Агата Кристи',
    
    // Greek letters and math symbols
    'μ-Ziq', '∆', 'Σ', 'alt-J', 'f(x)', '+/-', '×', '÷', '±',
    
    // Punctuation hell
    '!!!', '?', '..', '...And You Will Know Us by the Trail of Dead',
    'Godspeed You! Black Emperor', '¡Forward, Russia!', 'Los Campesinos!',
    'Sunn O)))', '!T.O.O.H.!', 'Melt-Banana', 'Lightning Bolt',
    
    // Special characters and symbols
    'AC/DC', 'AT&T', 'R&B/Soul', '100% Silk', '$uicideboy$', 'Ke$ha',
    'P!nk', 'Will.i.am', "D'Angelo", "N'Sync", '*NSYNC', 'TLC',
    
    // Emoji and modern unicode
    '☯ アクァティック.wav ♄', 'Apk ♀ ᴎᴇᴛ ☯ Ltd℻', '♥', '☆', '♪', '🎵',
    
    // Japanese names (Romanized and native)
    'きゃりーぱみゅぱみゅ', 'BABYMETAL', 'X Japan', 'Dir En Grey',
    'ONE OK ROCK', "μ's", 'Perfume', 'AKB48', 'Hikaru Utada',
    
    // Korean names
    'BLACKPINK', 'BTS', '방탄소년단', 'TWICE', '트와이스', "Girls' Generation",
    'SNSD', '소녀시대', 'Red Velvet', '레드벨벳',
    
    // Numbers and mixed
    '2Pac', '50 Cent', '3OH!3', '30 Seconds to Mars', '311', '21 Pilots',
    '10,000 Maniacs', '5 Seconds of Summer', '3 Doors Down', '7 Seconds',
    
    // Really problematic ones
    'HEALTH', 'HEALTH (Band)', '(həd) p.e.', '[[[Grandaddy]]]',
    'Thee Oh Sees', 'The The', 'Yes Yes Yes', 'No No No', 'Maybe Maybe',
    
    // Brackets and parentheses
    'Angels & Airwaves', '(International) Noise Conspiracy',
    '[spunge]', '{The} Cure', 'Die Ärzte', 'Die Toten Hosen',
    
    // Long names
    "I Set My Friends on Fire and They Didn't Like It Very Much",
    'You Blew It!', 'I Wrestled a Bear Once', 'Dance Gavin Dance',
    'A Skylit Drive', 'Escape the Danger', 'From First to Last',
    
    // Mixed scripts
    'GODSPEED 音', 'tЯ̅∅ån', 'Йо-йо', 'Мумий Тролль', 'Аквариум',
    'ДДТ', 'Кино', 'Наутилус Помпилиус', 'Чайф', 'Алиса',
    
    // Edge cases
    '', '   ', '---', '___', '...', '!!!', '???', '***',
    '12345', 'ABCDE', 'αβγδε', '١٢٣٤٥', '一二三四五',
    
    // Common English but tricky
    'The Beatles', 'Led Zeppelin', 'Pink Floyd', 'Queen', 'The Rolling Stones',
    'The Who', 'The Doors', 'The Clash', 'The Sex Pistols', 'The Ramones',
    
    // Genre names as artist names
    'Drum & Bass', 'Rock & Roll', 'Rhythm & Blues', 'Jazz Fusion',
    'Post-Rock', 'Post-Punk', 'Nu-Metal', 'Death Metal', 'Black Metal',
    
    // Format/quality indicators
    '320kbps', 'MP3', 'FLAC', 'Hi-Res', '24/96', '16/44.1', 'DSD',
    'Vinyl Rip', 'CD Rip', 'Web-DL', 'WEB', 'Retail', 'Promo',
  ];

  it('should handle all real music names without breaking', () => {
    const results: Array<{ input: string; output: string; valid: boolean }> = [];
    
    realMusicNames.forEach(name => {
      const slug = createSlug(name);
      const isValid = /^[a-z0-9-]+$/.test(slug);
      const hasContent = slug.length > 0;
      
      results.push({
        input: name,
        output: slug,
        valid: isValid && hasContent
      });
      
      // Each slug must be valid
      expect(isValid, `Invalid characters in slug for "${name}": "${slug}"`).toBe(true);
      expect(hasContent, `Empty slug for "${name}"`).toBe(true);
    });
    
    // Log results for manual inspection
    console.log('\n=== SLUG CONVERSION RESULTS ===');
    results.forEach(({ input, output, valid }) => {
      const status = valid ? '✅' : '❌';
      console.log(`${status} "${input}" → "${output}"`);
    });
    
    const validCount = results.filter(r => r.valid).length;
    const totalCount = results.length;
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total names tested: ${totalCount}`);
    console.log(`Valid slugs: ${validCount}`);
    console.log(`Success rate: ${((validCount / totalCount) * 100).toFixed(1)}%`);
    
    // All should be valid
    expect(validCount).toBe(totalCount);
  });

  it('should handle batch processing without performance issues', () => {
    const start = performance.now();
    
    // Process all names multiple times
    for (let i = 0; i < 10; i++) {
      realMusicNames.forEach(name => {
        createSlug(name);
      });
    }
    
    const end = performance.now();
    const totalOperations = realMusicNames.length * 10;
    const avgTime = (end - start) / totalOperations;
    
    console.log(`\n=== PERFORMANCE ===`);
    console.log(`Total operations: ${totalOperations}`);
    console.log(`Total time: ${(end - start).toFixed(2)}ms`);
    console.log(`Average per slug: ${avgTime.toFixed(4)}ms`);
    
    // Should be fast (under 1ms per slug on average)
    expect(avgTime).toBeLessThan(1);
  });

  it('should categorize problematic cases', () => {
    const categories = {
      untitled: [] as string[],
      veryShort: [] as string[],
      multipleHyphens: [] as string[],
      numbersOnly: [] as string[],
      normal: [] as string[]
    };
    
    realMusicNames.forEach(name => {
      const slug = createSlug(name);
      
      if (slug === 'untitled') {
        categories.untitled.push(name);
      } else if (slug.length <= 2) {
        categories.veryShort.push(name);
      } else if (slug.includes('--')) {
        categories.multipleHyphens.push(name);
      } else if (/^[0-9-]+$/.test(slug)) {
        categories.numbersOnly.push(name);
      } else {
        categories.normal.push(name);
      }
    });
    
    console.log('\n=== CATEGORIZATION ===');
    console.log(`Untitled fallbacks: ${categories.untitled.length}`);
    console.log(`Very short slugs: ${categories.veryShort.length}`);  
    console.log(`Multiple hyphens: ${categories.multipleHyphens.length}`);
    console.log(`Numbers only: ${categories.numbersOnly.length}`);
    console.log(`Normal slugs: ${categories.normal.length}`);
    
    if (categories.untitled.length > 0) {
      console.log('\nNames that became "untitled":');
      categories.untitled.forEach(name => console.log(`  "${name}"`));
    }
    
    // Multiple hyphens should not exist due to our cleanup
    expect(categories.multipleHyphens.length).toBe(0);
  });
});
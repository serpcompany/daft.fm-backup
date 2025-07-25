#!/usr/bin/env tsx
// Validate staging database before promotion
// Run with: pnpm tsx scripts/data-pipeline/validate-staging.ts

import { validateStagingData, getDatabaseStats, getStagingDb, getProductionDb } from './config/database';

async function validateStaging() {
  console.log('🔍 Validating staging database...\n');
  
  try {
    // Show database stats comparison
    console.log('📊 Database comparison:');
    console.log('                 Production    Staging');
    console.log('   ' + '-'.repeat(40));
    
    const prod = getProductionDb(true);
    const prodStats = await getDatabaseStats(prod);
    prod.sqlite.close();
    
    const staging = getStagingDb();
    const stagingStats = await getDatabaseStats(staging);
    staging.sqlite.close();
    
    console.log(`   Artists:     ${prodStats.artists.toString().padEnd(13)} ${stagingStats.artists}`);
    console.log(`   Albums:      ${prodStats.albums.toString().padEnd(13)} ${stagingStats.albums}`);
    console.log(`   Songs:       ${prodStats.songs.toString().padEnd(13)} ${stagingStats.songs}`);
    
    // Calculate differences
    console.log('\n🔄 Changes:');
    console.log(`   Artists:     ${stagingStats.artists >= prodStats.artists ? '+' : ''}${stagingStats.artists - prodStats.artists}`);
    console.log(`   Albums:      ${stagingStats.albums >= prodStats.albums ? '+' : ''}${stagingStats.albums - prodStats.albums}`);
    console.log(`   Songs:       ${stagingStats.songs >= prodStats.songs ? '+' : ''}${stagingStats.songs - prodStats.songs}`);
    
    // Run validation
    console.log('\n🧐 Running data integrity checks...');
    const validation = await validateStagingData();
    
    if (validation.valid) {
      console.log('✅ All validation checks passed!');
      console.log('\n🚀 Ready to promote to production');
      console.log('   Run: pnpm tsx scripts/data-pipeline/promote-staging.ts');
    } else {
      console.error('\n❌ Validation failed:');
      validation.errors.forEach(err => console.error(`   - ${err}`));
      console.log('\n💡 Fix these issues before promoting to production');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during validation:', error);
    process.exit(1);
  }
}

validateStaging();
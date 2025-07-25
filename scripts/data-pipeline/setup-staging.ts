#!/usr/bin/env tsx
// Setup staging database for ETL pipeline
// Run with: pnpm tsx scripts/data-pipeline/setup-staging.ts

import { syncSchema, getDatabaseStats, getStagingDb, getProductionDb } from './config/database';

async function setupStaging() {
  console.log('🏭 Setting up staging database for ETL pipeline\n');
  
  try {
    // Show production stats
    console.log('📊 Production database stats:');
    const prod = getProductionDb(true);
    const prodStats = await getDatabaseStats(prod);
    console.log(`   - Artists: ${prodStats.artists}`);
    console.log(`   - Albums: ${prodStats.albums}`);
    console.log(`   - Songs: ${prodStats.songs}`);
    prod.sqlite.close();
    
    // Sync schema
    console.log();
    await syncSchema();
    
    // Show staging stats
    console.log('\n📊 Staging database stats:');
    const staging = getStagingDb();
    const stagingStats = await getDatabaseStats(staging);
    console.log(`   - Artists: ${stagingStats.artists}`);
    console.log(`   - Albums: ${stagingStats.albums}`);
    console.log(`   - Songs: ${stagingStats.songs}`);
    staging.sqlite.close();
    
    console.log('\n✅ Staging database is ready!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run data collection scripts with --staging flag');
    console.log('   2. Validate staging data: pnpm tsx scripts/data-pipeline/validate-staging.ts');
    console.log('   3. Promote to production: pnpm tsx scripts/data-pipeline/promote-staging.ts');
  } catch (error) {
    console.error('\n❌ Error setting up staging:', error);
    process.exit(1);
  }
}

setupStaging();
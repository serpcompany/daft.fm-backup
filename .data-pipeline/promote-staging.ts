#!/usr/bin/env tsx
// Promote staging database to production
// Run with: pnpm tsx scripts/data-pipeline/promote-staging.ts

import { promoteToProduction } from './config/database';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function promote() {
  console.log('🚀 Staging to Production Promotion\n');
  console.log('⚠️  WARNING: This will replace ALL production data!');
  console.log('   A backup will be created automatically.\n');
  
  const answer = await askQuestion('Do you want to continue? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Promotion cancelled');
    rl.close();
    return;
  }
  
  console.log();
  
  try {
    const success = await promoteToProduction();
    
    if (success) {
      console.log('\n🎉 Staging successfully promoted to production!');
      console.log('\n💡 Next steps:');
      console.log('   1. Restart your dev server to see the changes');
      console.log('   2. Clear staging database: pnpm tsx scripts/data-pipeline/setup-staging.ts');
    } else {
      console.log('\n❌ Promotion failed - check errors above');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during promotion:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

promote();
// Database utilities for enrichment scripts

import { getProductionDb, getStagingDb } from '../../config/database'

export function getLocalDatabase() {
  // Check if we should use staging
  const useStaging = process.argv.includes('--staging')
  const dbConnection = useStaging ? getStagingDb() : getProductionDb(false)
  
  if (useStaging) {
    console.log('🎭 Using STAGING database for enrichment\n')
  } else {
    console.log('⚠️  Using PRODUCTION database directly for enrichment\n')
  }
  
  return dbConnection.db
}

export interface EnrichmentProgress {
  processed: number
  updated: number
  failed: number
  skipped: number
}
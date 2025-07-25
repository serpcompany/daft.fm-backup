# ETL Pipeline for daft.fm

## Overview

This ETL (Extract, Transform, Load) pipeline provides a safe way to collect, validate, and deploy music data without directly modifying the production database.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   External APIs │ --> │     Staging     │ --> │   Production    │
│  (MusicBrainz)  │     │    Database     │     │    Database     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │                        │                        │
    Extract                 Validate                  Deploy
```

## Workflow

### 1. Setup Staging Environment

```bash
# Create staging database with production schema
pnpm tsx scripts/data-pipeline/setup-staging.ts
```

This creates a `data/staging.db` file that mirrors the production schema.

### 2. Collect Data into Staging

```bash
# Collect canonical data into staging
pnpm tsx scripts/data-pipeline/collect-clean-data.ts --staging

# Or collect specific data
pnpm tsx scripts/data-pipeline/collect-canonical-data.ts --staging
```

### 3. Enrich Data in Staging

```bash
# Run enrichment scripts on staging
pnpm tsx scripts/data-pipeline/enrichment/lastfm/artist-info.ts --staging
pnpm tsx scripts/data-pipeline/enrichment/cover-art-archive/cover-art.ts --staging
pnpm tsx scripts/data-pipeline/enrichment/genius/lyrics.ts --staging
```

### 4. Validate Staging Data

```bash
# Check data integrity before promotion
pnpm tsx scripts/data-pipeline/validate-staging.ts
```

This checks for:
- Orphaned records (albums without artists, songs without albums)
- Duplicate MusicBrainz IDs
- Data consistency

### 5. Promote to Production

```bash
# Deploy staging to production (creates backup)
pnpm tsx scripts/data-pipeline/promote-staging.ts
```

This will:
1. Create a timestamped backup of production
2. Validate staging data (unless forced)
3. Replace production data with staging
4. Show summary of changes

## Benefits

1. **Safety**: Never directly modify production during development
2. **Validation**: Catch data issues before they reach production
3. **Rollback**: Automatic backups before each promotion
4. **Testing**: Test collection scripts without affecting live data
5. **Batch Updates**: Collect and validate large datasets before deployment

## Database Locations

- **Production**: `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`
- **Staging**: `data/staging.db`
- **Backups**: `data/backups/production-[timestamp].db`

## Schema Synchronization

The staging database automatically inherits the production schema during setup. If you modify the production schema:

```bash
# Re-sync staging with new schema
pnpm tsx scripts/data-pipeline/setup-staging.ts
```

## Direct Production Access

For emergency fixes, you can still work directly on production by omitting the `--staging` flag:

```bash
# Direct production access (use with caution!)
pnpm tsx scripts/data-pipeline/collect-clean-data.ts
```

## Troubleshooting

### Validation Failures

If validation fails, check the specific errors:
- **Orphaned records**: Run cleanup scripts or fix foreign key references
- **Duplicate IDs**: Remove duplicates or update with unique values

### Restore from Backup

If something goes wrong:

```bash
# List available backups
ls -la data/backups/

# Restore specific backup (manual process)
cp data/backups/production-2024-01-01T12-00-00.db .wrangler/state/v3/d1/miniflare-D1DatabaseObject/[current].sqlite
```
# Migration Summary: UAE to Belgium Scraper

## Changes Made

### 1. Database Tables (Supabase)
**New Migration File:** `supabase/migrations/20251117_belgium_tables.sql`

Created fresh Belgium-specific tables:
- `belgium_page_cache` - Stores all scraped pages from BOSA website
- `belgium_is_e_invoicing_pages` - Stores only e-invoicing related pages

**Shared Tables** (no changes needed):
- `settings` - Application settings
- `scrape_runs` - Scraping session history

### 2. Server Code Updates

#### `server/scraper.ts`
- Changed `BASE_URL` from `https://mof.gov.ae` to `https://bosa.belgium.be`
- Changed `SITEMAP_INDEX_URL` from `https://mof.gov.ae/sitemap_index.xml` to `https://bosa.belgium.be/sitemap.xml`
- Updated fallback home page from `https://mof.gov.ae/en/home/` to `https://bosa.belgium.be/`

#### `server/persistence.ts`
- Changed `PAGES_COLLECTION` from `uae_page_cache` to `belgium_page_cache`
- Changed `EINVOICING_COLLECTION` from `uae_is_e_invoicing_pages` to `belgium_is_e_invoicing_pages`

### 3. Documentation Updates

#### `replit.md`
- Updated title and description to reference Belgium BOSA instead of UAE MOF
- Mentioned data storage in dedicated Belgium tables

#### `supabase/README.md` (New)
- Comprehensive setup guide for Supabase tables
- Table schema documentation
- Environment variable requirements
- Data separation explanation

## What Remains the Same

✅ All frontend functionality unchanged
✅ API endpoints remain identical
✅ Excel export feature works the same way
✅ Teams notification integration unchanged
✅ Auto-run and manual scraping modes preserved
✅ Real-time progress monitoring maintained
✅ E-invoicing keyword detection logic identical

## Next Steps for Deployment

1. **Run Supabase Migration:**
   - Open Supabase SQL Editor
   - Execute `supabase/migrations/20251117_belgium_tables.sql`
   - Verify tables are created successfully

2. **Environment Variables:**
   - Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

3. **Test the Scraper:**
   - Start the application
   - Initiate a manual scrape
   - Verify Belgium BOSA website is being crawled
   - Check data is being saved to Belgium tables in Supabase

## Data Separation

The application now uses completely separate tables for Belgium data:
- **Old UAE tables:** `uae_page_cache`, `uae_is_e_invoicing_pages` (not affected)
- **New Belgium tables:** `belgium_page_cache`, `belgium_is_e_invoicing_pages`

This allows both scrapers to coexist independently if needed in the future.

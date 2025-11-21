# UAE E-Invoicing Pages Display Fix

## Issue
The UAE dashboard's "E-Invoicing Pages Found" section was displaying **all crawled pages** from `uae_page_cache` instead of only the **e-invoicing related pages** from `uae_is_e_invoicing_pages`.

## Root Cause
The `fetchPersistedPages()` function in `server/uae/persistence.ts` was querying the wrong table:
- ❌ **Before**: Fetched from `uae_page_cache` (all pages)
- ✅ **After**: Fetches from `uae_is_e_invoicing_pages` (only e-invoicing pages)

## Changes Made

### File: `server/uae/persistence.ts`

#### 1. Updated `fetchPersistedPages()` - Supabase Query

**Before:**
```typescript
export async function fetchPersistedPages(): Promise<ScrapedPage[]> {
  if (isSupabaseEnabled && supabase) {
    const { data, error } = await supabase
      .from(PAGES_COLLECTION)  // ❌ Wrong table (all pages)
      .select("id,url,title,content,scraped_at")
      .order("scraped_at", { ascending: false });
    // ...
  }
}
```

**After:**
```typescript
export async function fetchPersistedPages(): Promise<ScrapedPage[]> {
  if (isSupabaseEnabled && supabase) {
    // Fetch only e-invoicing pages from the dedicated table
    const { data, error } = await supabase
      .from(EINVOICING_COLLECTION)  // ✅ Correct table (only e-invoicing)
      .select("id,url,title,content,scraped_at,summary,matched_keyword")
      .order("scraped_at", { ascending: false });
    // ...
  }
}
```

#### 2. Updated `fetchPagesFromSql()` - SQL Fallback Query

**Before:**
```typescript
async function fetchPagesFromSql(): Promise<ScrapedPage[]> {
  if (!sqlClient) return [];
  try {
    const rows = await sqlClient`
      SELECT id, url, title, content, scraped_at
      FROM uae_page_cache  -- ❌ Wrong table (all pages)
      ORDER BY scraped_at DESC
    `;
    // ...
  }
}
```

**After:**
```typescript
async function fetchPagesFromSql(): Promise<ScrapedPage[]> {
  if (!sqlClient) return [];
  try {
    // Fetch only e-invoicing pages from the dedicated table
    const rows = await sqlClient`
      SELECT id, url, title, content, scraped_at, summary, matched_keyword
      FROM uae_is_e_invoicing_pages  -- ✅ Correct table (only e-invoicing)
      ORDER BY scraped_at DESC
    `;
    // ...
  }
}
```

## Tables Explained

### `uae_page_cache`
- Stores **ALL** pages crawled from mof.gov.ae
- Used for deduplication and tracking what's been scraped
- Includes both e-invoicing and non-e-invoicing pages

### `uae_is_e_invoicing_pages`
- Stores **ONLY** e-invoicing related pages
- Pages that matched e-invoicing keywords/patterns
- This is what should be displayed in the dashboard

## Consistency with Belgium Scraper

The UAE implementation now matches the Belgium scraper exactly:

| Aspect | Belgium | UAE |
|--------|---------|-----|
| Display source | `belgium_is_e_invoicing_pages` | `uae_is_e_invoicing_pages` |
| Cache table | `belgium_page_cache` | `uae_page_cache` |
| Fields fetched | `id, url, title, content, scraped_at, summary, matched_keyword` | Same |
| Function name | `fetchPersistedPages()` | `fetchPersistedPages()` |

## Result

✅ The "E-Invoicing Pages Found" section now displays **only** e-invoicing related pages  
✅ Matches the Belgium scraper's behavior  
✅ Shows summary and matched keyword for each page  
✅ Proper filtering at the database level  

## Testing

After this fix:
1. Start the UAE scraper
2. Let it crawl some pages
3. The "E-Invoicing Pages Found" section should show only pages that contain e-invoicing keywords
4. Each page should display:
   - Title
   - URL
   - Content preview
   - AI-generated summary (if available)
   - Matched keyword (if available)

## Build Status

✅ Build completed successfully with no errors
✅ No linter errors
✅ TypeScript compilation passed


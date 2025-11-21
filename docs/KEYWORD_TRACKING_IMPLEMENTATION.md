# Keyword Tracking Implementation

This document describes the implementation of keyword tracking for the UAE scraper, similar to the Belgium scraper.

## Overview

The system now tracks which specific keyword or pattern triggered the identification of an e-invoicing related page. This helps in understanding what content is being captured and improves transparency in the scraping process.

## Changes Made

### 1. Enhanced Keyword Detection Function

**File:** `server/uae/scraper.ts`

Added a new `checkEInvoicingMatch()` function that:
- Tests each keyword with word boundary matching for precision
- Uses regex patterns to catch variations and compound words
- Returns both a boolean match result and the matched keyword/pattern
- Supports multilingual content (English and Arabic)

**Key Features:**
- Word boundary detection to avoid false positives
- Pattern-based detection for compound words
- Specific handling for technical terms (PEPPOL, UBL, ZATCA)
- Arabic language support for UAE-specific content

### 2. Expanded Keyword List

**Enhanced Keywords Include:**

**English:**
- All variations: e-invoice, e-invoices, e-invoicing
- Electronic/digital/online variations
- Tax and VAT invoice variants
- Billing variations

**Arabic (UAE specific):**
- فاتورة إلكترونية (e-invoice)
- الفواتير الإلكترونية (e-invoices)
- نظام الفوترة الإلكترونية (e-invoicing system)
- الفاتورة الرقمية (digital invoice)
- فاتورة ضريبية إلكترونية (e-tax invoice)

**Technical Terms:**
- PEPPOL, PEPPOL network, PEPPOL authority, PEPPOL access point
- UBL (Universal Business Language)
- XML invoice, XML invoicing
- Structured invoice
- Invoice automation
- ZATCA, Fatoora (GCC/Saudi Arabia related but relevant)

### 3. Database Schema Updates

**File:** `supabase/migrations/20251120_add_uae_matched_keyword_column.sql`

Added `matched_keyword` column to:
- `uae_page_cache` table
- `uae_is_e_invoicing_pages` table

Also created an index for faster filtering:
```sql
CREATE INDEX IF NOT EXISTS idx_uae_einvoicing_matched_keyword 
  ON uae_is_e_invoicing_pages(matched_keyword) 
  WHERE matched_keyword IS NOT NULL;
```

### 4. Persistence Layer Updates

**File:** `server/uae/persistence.ts`

Updated to:
- Store `matched_keyword` in both cache and e-invoicing tables
- Fetch `matched_keyword` from Supabase and SQL
- Include `matched_keyword` in `TeamsPagePayload` interface

### 5. Teams Notification Updates

**File:** `server/integrations/teams.ts`

Enhanced Teams notifications to include:
- Matched keyword display with 🔑 emoji
- Format: `🔑 Keyword: e-invoice`
- Appears before the summary in notification messages

### 6. Type System Updates

**File:** `shared/schema.ts`

Already included `matchedKeyword?: string` in:
- `scrapedPageSchema`
- `InsertScrapedPage` type (derived)
- `ScrapedPage` type (derived)

## Benefits

1. **Transparency:** Know exactly which keyword triggered the match
2. **Analytics:** Track which keywords are most effective
3. **Debugging:** Easier to understand why a page was flagged
4. **Filtering:** Can filter results by specific keywords
5. **Optimization:** Identify and refine keyword patterns

## Pattern Matching Examples

The system can detect:

1. **Exact matches:** "e-invoice" → matches "e-invoice"
2. **Hyphenated variations:** "e-invoicing" → matches "e invoicing" or "einvoicing"
3. **Compound patterns:** Electronic + invoice → matches "electronic invoicing"
4. **Technical terms:** "PEPPOL" → strong indicator of e-invoicing
5. **Arabic text:** "فاتورة إلكترونية" → matches Arabic e-invoice text
6. **URL patterns:** Keywords in URLs are also checked

## Usage

When a page is scraped:
1. Content is extracted from the page
2. `checkEInvoicingMatch()` is called with title, content, and URL
3. If a match is found, the keyword is logged and stored
4. The keyword appears in:
   - Supabase database columns
   - Server logs: `🔍 E-invoicing page found: "Title" - Keyword: "e-invoice"`
   - Teams notifications: `🔑 Keyword: e-invoice`

## Migration Instructions

Run the following migrations in your Supabase SQL Editor:

```sql
-- Add matched_keyword column to UAE tables
ALTER TABLE uae_is_e_invoicing_pages 
ADD COLUMN IF NOT EXISTS matched_keyword TEXT;

ALTER TABLE uae_page_cache 
ADD COLUMN IF NOT EXISTS matched_keyword TEXT;

-- Create index for faster filtering by keyword
CREATE INDEX IF NOT EXISTS idx_uae_einvoicing_matched_keyword 
  ON uae_is_e_invoicing_pages(matched_keyword) 
  WHERE matched_keyword IS NOT NULL;
```

## Consistency with Belgium Scraper

The UAE implementation now mirrors the Belgium scraper's keyword tracking functionality:
- Same database column structure
- Same Teams notification format
- Same type definitions
- Similar keyword detection methodology (with UAE-specific enhancements)

## Future Enhancements

Potential improvements:
1. Analytics dashboard showing keyword distribution
2. Machine learning to identify new relevant keywords
3. Keyword effectiveness scoring
4. Multi-language keyword expansion
5. Keyword synonym detection



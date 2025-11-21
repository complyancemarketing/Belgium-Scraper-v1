# UAE E-Invoicing Scraper - Supabase Setup

This document explains how to set up the UAE scraper tables in Supabase.

## Prerequisites

- Supabase project already set up
- Belgium scraper tables already created (shares `settings` and `scrape_runs` tables)

## Migration Steps

### 1. Create UAE Base Tables

First, create the main UAE tables. Run this SQL in your Supabase SQL Editor:

```sql
-- UAE page cache table (stores all scraped pages)
CREATE TABLE IF NOT EXISTS uae_page_cache (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL,
  is_e_invoicing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UAE e-invoicing pages table (stores only e-invoicing related pages)
CREATE TABLE IF NOT EXISTS uae_is_e_invoicing_pages (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uae_page_cache_scraped_at 
  ON uae_page_cache(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_uae_page_cache_is_e_invoicing 
  ON uae_page_cache(is_e_invoicing);
CREATE INDEX IF NOT EXISTS idx_uae_is_e_invoicing_pages_scraped_at 
  ON uae_is_e_invoicing_pages(scraped_at DESC);

-- Enable Row Level Security (RLS) for security
ALTER TABLE uae_page_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE uae_is_e_invoicing_pages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Service role can do everything on uae_page_cache"
  ON uae_page_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on uae_is_e_invoicing_pages"
  ON uae_is_e_invoicing_pages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Create policies for authenticated users (read-only access)
CREATE POLICY "Authenticated users can read uae_page_cache"
  ON uae_page_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read uae_is_e_invoicing_pages"
  ON uae_is_e_invoicing_pages
  FOR SELECT
  TO authenticated
  USING (true);
```

### 2. Add Summary Column

Run the migration from `20251120_add_uae_summary_column.sql`:

```sql
-- Add summary column to UAE e-invoicing tables
-- This stores AI-generated summaries of e-invoicing content

ALTER TABLE uae_is_e_invoicing_pages 
ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE uae_page_cache 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_uae_einvoicing_summary 
  ON uae_is_e_invoicing_pages(summary) 
  WHERE summary IS NOT NULL;
```

### 3. Add Matched Keyword Column

Run the migration from `20251120_add_uae_matched_keyword_column.sql`:

```sql
-- Add matched_keyword column to UAE e-invoicing tables
-- This stores which e-invoicing keyword was found on the page

ALTER TABLE uae_is_e_invoicing_pages 
ADD COLUMN IF NOT EXISTS matched_keyword TEXT;

ALTER TABLE uae_page_cache 
ADD COLUMN IF NOT EXISTS matched_keyword TEXT;

-- Create index for faster filtering by keyword
CREATE INDEX IF NOT EXISTS idx_uae_einvoicing_matched_keyword 
  ON uae_is_e_invoicing_pages(matched_keyword) 
  WHERE matched_keyword IS NOT NULL;
```

### 4. Add UAE Settings Row

The UAE scraper uses a separate settings row in the shared `settings` table:

```sql
-- Insert UAE-specific settings row (if not exists)
INSERT INTO settings (id, auto_run_enabled, teams_webhook_url, last_auto_run_at, last_manual_run_at)
VALUES ('uae', false, null, null, null)
ON CONFLICT (id) DO NOTHING;
```

## Table Structure

### `uae_page_cache`
Stores all scraped pages from the UAE Ministry of Finance website.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | SHA256 hash of URL |
| url | TEXT | Page URL |
| title | TEXT | Page title |
| content | TEXT | Text content from page |
| scraped_at | TIMESTAMPTZ | When page was scraped |
| is_e_invoicing | BOOLEAN | Whether page is e-invoicing related |
| summary | TEXT | AI-generated summary (Mistral AI) |
| matched_keyword | TEXT | Keyword that matched (e.g., "e-invoice", "peppol") |
| created_at | TIMESTAMPTZ | Record creation timestamp |

### `uae_is_e_invoicing_pages`
Stores only pages that contain e-invoicing related content.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | SHA256 hash of URL |
| url | TEXT | Page URL |
| title | TEXT | Page title |
| content | TEXT | Text content from page |
| scraped_at | TIMESTAMPTZ | When page was scraped |
| summary | TEXT | AI-generated summary (Mistral AI) |
| matched_keyword | TEXT | Keyword that matched (e.g., "e-invoice", "peppol") |
| created_at | TIMESTAMPTZ | Record creation timestamp |

## Shared Tables

The following tables are shared between Belgium and UAE scrapers:

- **`settings`** - Application settings (auto-run, webhook, etc.)
  - Row ID `global` for Belgium
  - Row ID `uae` for UAE
- **`scrape_runs`** - History of scraping sessions (all countries)

## Environment Variables

Ensure these are set in your `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MISTRAL_API_KEY=your_mistral_api_key
```

## Features

- ✅ Scrapes https://mof.gov.ae for e-invoicing content
- ✅ Extracts URLs from sitemap
- ✅ Identifies e-invoicing related pages using enhanced keyword matching
- ✅ Tracks which keyword triggered the match
- ✅ Generates AI summaries using Mistral AI
- ✅ Stores data in dedicated UAE tables in Supabase
- ✅ Supports manual and automatic scraping modes
- ✅ Microsoft Teams notifications (uses global webhook from home page)
- ✅ Excel export functionality

## E-Invoicing Keywords

The scraper uses enhanced pattern matching to identify pages containing:

**English Keywords:**
- e-invoice, e-invoices, e-invoicing
- einvoice, einvoices, einvoicing
- electronic invoice, electronic invoicing
- digital invoice, digital invoicing
- online invoice, online invoicing
- tax invoice, vat invoice
- electronic billing, digital billing, e-billing

**Arabic Keywords (UAE specific):**
- فاتورة إلكترونية (e-invoice)
- الفواتير الإلكترونية (e-invoices)
- نظام الفوترة الإلكترونية (e-invoicing system)
- الفاتورة الرقمية (digital invoice)
- فاتورة ضريبية إلكترونية (e-tax invoice)

**Technical Terms:**
- PEPPOL, PEPPOL network, PEPPOL authority
- UBL (Universal Business Language)
- XML invoice, XML invoicing
- Structured invoice
- Invoice automation
- ZATCA, Fatoora (GCC related)

**Pattern Matching:**
The scraper also uses regex patterns to catch variations like:
- Compound words (e-invoices, e-billing)
- Language variations (French, Dutch, German)
- Electronic/digital + invoice combinations

## Data Separation

- **Belgium Tables:** `belgium_page_cache`, `belgium_is_e_invoicing_pages`
- **UAE Tables:** `uae_page_cache`, `uae_is_e_invoicing_pages`

Each country's scraper operates independently with separate data storage.


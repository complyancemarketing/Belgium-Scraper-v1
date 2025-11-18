# Belgium E-Invoicing Scraper - Supabase Setup

This project scrapes the Belgium BOSA website (https://bosa.belgium.be/) for e-invoicing content and stores the data in Supabase.

## Supabase Database Setup

### Running the Migration

To set up the Belgium tables in your Supabase database, follow these steps:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the migration file: `supabase/migrations/20251117_belgium_tables.sql`
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click "Run" to execute the migration

### Tables Created

The migration creates the following tables:

#### `belgium_page_cache`
Stores all scraped pages from the Belgium BOSA website.

**Columns:**
- `id` (TEXT, PRIMARY KEY) - SHA256 hash of the URL
- `url` (TEXT) - The page URL
- `title` (TEXT) - Page title
- `content` (TEXT) - Text content from the page
- `scraped_at` (TIMESTAMPTZ) - When the page was scraped
- `is_e_invoicing` (BOOLEAN) - Whether the page is e-invoicing related
- `created_at` (TIMESTAMPTZ) - Record creation timestamp

#### `belgium_is_e_invoicing_pages`
Stores only pages that contain e-invoicing related content.

**Columns:**
- `id` (TEXT, PRIMARY KEY) - SHA256 hash of the URL
- `url` (TEXT) - The page URL
- `title` (TEXT) - Page title
- `content` (TEXT) - Text content from the page
- `scraped_at` (TIMESTAMPTZ) - When the page was scraped
- `created_at` (TIMESTAMPTZ) - Record creation timestamp

### Shared Tables

The following tables are shared and should already exist (from previous UAE scraper setup):

- `settings` - Application settings (auto-run, webhook, etc.)
- `scrape_runs` - History of scraping sessions

### Environment Variables

Make sure the following environment variables are set in your `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Data Separation

The Belgium scraper uses completely separate tables from the UAE scraper:

- **UAE Tables:** `uae_page_cache`, `uae_is_e_invoicing_pages`
- **Belgium Tables:** `belgium_page_cache`, `belgium_is_e_invoicing_pages`

This allows you to run both scrapers independently without data conflicts.

## Features

- Scrapes https://bosa.belgium.be/ for e-invoicing content
- Extracts URLs from sitemap
- Identifies e-invoicing related pages using keywords
- Stores data in dedicated Belgium tables in Supabase
- Supports manual and automatic scraping modes
- Microsoft Teams notifications for new findings
- Excel export functionality

## E-Invoicing Keywords

The scraper identifies pages containing these keywords:
- e-invoice, e-invoicing
- einvoice, einvoicing
- electronic invoice, electronic invoicing
- digital invoice, digital invoicing
- tax invoice
- vat invoice
- electronic billing, e-billing

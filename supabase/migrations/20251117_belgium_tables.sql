-- Migration to create Belgium e-invoicing scraper tables
-- This creates fresh tables for Belgium BOSA website data, separate from UAE tables

-- Belgium page cache table (stores all scraped pages)
CREATE TABLE IF NOT EXISTS belgium_page_cache (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL,
  is_e_invoicing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Belgium e-invoicing pages table (stores only e-invoicing related pages)
CREATE TABLE IF NOT EXISTS belgium_is_e_invoicing_pages (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_belgium_page_cache_scraped_at 
  ON belgium_page_cache(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_belgium_page_cache_is_e_invoicing 
  ON belgium_page_cache(is_e_invoicing);
CREATE INDEX IF NOT EXISTS idx_belgium_is_e_invoicing_pages_scraped_at 
  ON belgium_is_e_invoicing_pages(scraped_at DESC);

-- Note: The 'settings' and 'scrape_runs' tables are shared between UAE and Belgium scrapers
-- They already exist and don't need to be recreated

-- Enable Row Level Security (RLS) for security
ALTER TABLE belgium_page_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE belgium_is_e_invoicing_pages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Service role can do everything on belgium_page_cache"
  ON belgium_page_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on belgium_is_e_invoicing_pages"
  ON belgium_is_e_invoicing_pages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Create policies for authenticated users (read-only access)
CREATE POLICY "Authenticated users can read belgium_page_cache"
  ON belgium_page_cache
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read belgium_is_e_invoicing_pages"
  ON belgium_is_e_invoicing_pages
  FOR SELECT
  TO authenticated
  USING (true);

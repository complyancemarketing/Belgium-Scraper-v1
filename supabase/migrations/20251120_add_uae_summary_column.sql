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


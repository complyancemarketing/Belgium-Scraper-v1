-- Add summary column to Belgium e-invoicing tables
-- This stores AI-generated summaries of e-invoicing content

ALTER TABLE belgium_is_e_invoicing_pages 
ADD COLUMN IF NOT EXISTS summary TEXT;

ALTER TABLE belgium_page_cache 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_belgium_einvoicing_summary 
  ON belgium_is_e_invoicing_pages(summary) 
  WHERE summary IS NOT NULL;

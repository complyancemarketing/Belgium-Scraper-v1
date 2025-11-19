-- Add matched_keyword column to Belgium e-invoicing tables
-- This stores which e-invoicing keyword was found on the page

ALTER TABLE belgium_is_e_invoicing_pages 
ADD COLUMN IF NOT EXISTS matched_keyword TEXT;

ALTER TABLE belgium_page_cache 
ADD COLUMN IF NOT EXISTS matched_keyword TEXT;

-- Create index for faster filtering by keyword
CREATE INDEX IF NOT EXISTS idx_belgium_einvoicing_matched_keyword 
  ON belgium_is_e_invoicing_pages(matched_keyword) 
  WHERE matched_keyword IS NOT NULL;

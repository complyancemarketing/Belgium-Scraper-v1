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


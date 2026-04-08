-- Add supplier_name to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_name TEXT;

-- Update the batches created from Initial Stock Migration to have a better name if needed
-- (Optional, since we already have it in the product_batches table meta)

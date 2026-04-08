-- Create product_batches table
CREATE TABLE IF NOT EXISTS public.product_batches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    supplier_name TEXT,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE,
    received_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

-- Create Policies for product_batches
CREATE POLICY "Store members can view product_batches"
ON public.product_batches FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.store_id = product_batches.store_id
    )
);

CREATE POLICY "Store admins and owners can manage product_batches"
ON public.product_batches FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.store_id = product_batches.store_id
        AND profiles.role IN ('owner', 'admin')
    )
);

-- Update the decrement_stock function to handle FIFO + Expiry properly.
-- It deducts from batches first, then syncs the products.stock_quantity.
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_remaining_to_deduct INTEGER := p_quantity;
  v_batch RECORD;
  v_new_total INTEGER;
BEGIN
  -- Loop through active batches ordered by expiry_date (NULLS LAST) then received_date ASC.
  -- Add FOR UPDATE to safely lock the rows during deduction.
  FOR v_batch IN 
      SELECT id, quantity 
      FROM public.product_batches 
      WHERE product_id = p_product_id AND quantity > 0 
      ORDER BY expiry_date ASC NULLS LAST, received_date ASC
      FOR UPDATE
  LOOP
      IF v_remaining_to_deduct = 0 THEN
          EXIT;
      END IF;

      IF v_batch.quantity <= v_remaining_to_deduct THEN
          -- Batch doesn't have enough to cover the whole deduction, or exactly matches it.
          -- Drain this batch
          UPDATE public.product_batches SET quantity = 0 WHERE id = v_batch.id;
          v_remaining_to_deduct := v_remaining_to_deduct - v_batch.quantity;
      ELSE
          -- Batch has more than enough
          UPDATE public.product_batches SET quantity = quantity - v_remaining_to_deduct WHERE id = v_batch.id;
          v_remaining_to_deduct := 0;
      END IF;
  END LOOP;

  -- Deduct from the main products.stock_quantity regardless of whether batches existed
  -- This accurately reflects the sum total logic
  UPDATE public.products 
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_product_id
  RETURNING stock_quantity INTO v_new_total;

  RETURN v_new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration script to auto-generate initial batches for products that already have stock > 0
DO $$
DECLARE
    v_product RECORD;
BEGIN
    FOR v_product IN 
        SELECT id, store_id, stock_quantity, price
        FROM public.products
        WHERE stock_quantity > 0
    LOOP
        -- Check if a batch already exists for this product to prevent duplicates if rerun
        IF NOT EXISTS (SELECT 1 FROM public.product_batches WHERE product_id = v_product.id) THEN
            INSERT INTO public.product_batches (store_id, product_id, quantity, cost_price, supplier_name)
            VALUES (v_product.store_id, v_product.id, v_product.stock_quantity, v_product.price, 'Initial Stock Migration');
        END IF;
    END LOOP;
END;
$$;

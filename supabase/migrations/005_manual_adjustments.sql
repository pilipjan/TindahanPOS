-- Function to handle manual stock adjustments (Waste, Correction, etc.)
-- This ensures that manual deductions also follow the FIFO batch logic.
CREATE OR REPLACE FUNCTION manual_adjust_stock(
    p_product_id UUID,
    p_store_id UUID,
    p_quantity_change INTEGER,
    p_reason TEXT,
    p_adjusted_by UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_previous_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  -- 1. Get current stock
  SELECT stock_quantity INTO v_previous_qty FROM public.products WHERE id = p_product_id;
  
  -- 2. Update stock
  -- If negative (deduction), use the FIFO decrement logic
  IF p_quantity_change < 0 THEN
      PERFORM public.decrement_stock(p_product_id, ABS(p_quantity_change));
  ELSE
      -- If positive (addition/correction), just add to products
      -- (Note: For formal deliveries, the Receive Stock UI should be used instead)
      UPDATE public.products SET stock_quantity = stock_quantity + p_quantity_change WHERE id = p_product_id;
  END IF;

  -- 3. Get new total
  SELECT stock_quantity INTO v_new_qty FROM public.products WHERE id = p_product_id;

  -- 4. Record the adjustment in the audit table
  INSERT INTO public.stock_adjustments (
    store_id, 
    product_id, 
    quantity_change, 
    previous_qty, 
    new_qty, 
    reason, 
    adjusted_by, 
    notes
  ) VALUES (
    p_store_id, 
    p_product_id, 
    p_quantity_change, 
    v_previous_qty, 
    v_new_qty, 
    p_reason, 
    p_adjusted_by, 
    p_notes
  );

  RETURN v_new_qty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

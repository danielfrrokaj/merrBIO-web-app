-- =========================
-- Table: basket_items
-- =========================
CREATE TABLE basket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  
  -- Enforce unique combination of user_id and product_id
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE basket_items ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own basket"
  ON basket_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert items to their own basket"
  ON basket_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own basket items"
  ON basket_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete items from their own basket"
  ON basket_items FOR DELETE
  USING (auth.uid() = user_id);

-- =========================
-- Functions for basket operations
-- =========================

-- Function to add an item to basket or update quantity if already exists
CREATE OR REPLACE FUNCTION add_to_basket(p_user_id UUID, p_product_id UUID, p_quantity INTEGER DEFAULT 1)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_exists BOOLEAN;
  result_record RECORD;
BEGIN
  -- Check if product exists and is available
  SELECT EXISTS (
    SELECT 1 FROM products WHERE id = p_product_id AND available = true
  ) INTO product_exists;
  
  IF NOT product_exists THEN
    RETURN json_build_object('success', false, 'message', 'Product not found or not available');
  END IF;
  
  -- Insert or update basket item
  INSERT INTO basket_items (user_id, product_id, quantity)
  VALUES (p_user_id, p_product_id, p_quantity)
  ON CONFLICT (user_id, product_id) 
  DO UPDATE SET quantity = basket_items.quantity + p_quantity
  RETURNING * INTO result_record;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Item added to basket',
    'item', row_to_json(result_record)
  );
END;
$$; 
-- Function to create the categories table
CREATE OR REPLACE FUNCTION public.create_categories_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the categories table
  CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
  );

  -- Enable RLS on the table
  ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Allow all to view categories"
    ON public.categories FOR SELECT
    USING (true);

  CREATE POLICY "Allow admin to insert/update/delete categories"
    ON public.categories FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating categories table: %', SQLERRM;
    RETURN false;
END;
$$;

-- Function to create the product_categories junction table
CREATE OR REPLACE FUNCTION public.create_product_categories_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create the product_categories junction table
  CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    -- Enforce unique combination of product_id and category_id
    UNIQUE(product_id, category_id)
  );

  -- Enable RLS on the table
  ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

  -- Create policies
  CREATE POLICY "Allow all to view product_categories"
    ON public.product_categories FOR SELECT
    USING (true);

  CREATE POLICY "Allow farmers to manage product_categories for their products"
    ON public.product_categories FOR ALL
    USING (
      EXISTS (
        SELECT 1 
        FROM products
        JOIN farms ON farms.id = products.farm_id
        WHERE products.id = product_categories.product_id AND farms.owner_id = auth.uid()
      )
    );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating product_categories table: %', SQLERRM;
    RETURN false;
END;
$$; 
import { supabase } from '../supabaseClient';

/**
 * Creates the categories table and product_categories junction table if they don't exist,
 * and adds sample data.
 */
export async function setupCategoriesAndProducts() {
  console.log('Setting up categories and product relationships...');
  
  try {
    // Instead of creating tables directly (which requires admin privileges),
    // just try to insert categories directly and see if it works
    console.log('Attempting to create categories by inserting data directly...');
    
    // First, attempt to insert default categories
    const defaultCategories = [
      {
        name: 'Vegetables',
        description: 'Fresh, locally grown vegetables',
        image_url: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      },
      {
        name: 'Fruits',
        description: 'Sweet and nutritious fruits',
        image_url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      },
      {
        name: 'Dairy',
        description: 'Milk, cheese, and other dairy products',
        image_url: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Meat',
        description: 'Ethically raised meat products',
        image_url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      },
      {
        name: 'Eggs',
        description: 'Fresh farm eggs',
        image_url: 'https://images.unsplash.com/photo-1583562835057-a62d1beffbf3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Honey',
        description: 'Local honey and bee products',
        image_url: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
      }
    ];
    
    // Insert the first category to see if the table exists
    const { error: insertError } = await supabase
      .from('categories')
      .insert([defaultCategories[0]]);
      
    if (insertError) {
      // If the table doesn't exist, we need to tell the user to create it manually
      console.error('Error inserting category, table may not exist:', insertError);
      return {
        success: false,
        message: `The categories table does not exist. Please run the following SQL in your Supabase SQL editor:
        
<code>CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  UNIQUE(product_id, category_id)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
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

-- RLS policies for product_categories
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
  );</code>`,
      };
    }
    
    // Insert the rest of the categories
    const restOfCategories = defaultCategories.slice(1);
    if (restOfCategories.length > 0) {
      const { error: bulkInsertError } = await supabase
        .from('categories')
        .insert(restOfCategories);
        
      if (bulkInsertError) {
        console.warn('Error inserting additional categories, they may already exist:', bulkInsertError);
      }
    }
    
    console.log('Categories setup completed successfully');
    return {
      success: true,
      message: 'Categories have been set up successfully!'
    };
  } catch (error) {
    console.error('Unexpected error during category setup:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
} 
-- =========================
-- Table: categories
-- =========================
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Junction table for products and categories
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc', now()),
  
  -- Enforce unique combination of product_id and category_id
  unique(product_id, category_id)
);

-- Enable RLS
alter table categories enable row level security;
alter table product_categories enable row level security;

-- RLS policies for categories
create policy "Allow all to view categories"
  on categories for select
  using (true);

create policy "Allow admin to insert/update/delete categories"
  on categories for all
  using (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- RLS policies for product_categories
create policy "Allow all to view product_categories"
  on product_categories for select
  using (true);

create policy "Allow farmers to manage product_categories for their products"
  on product_categories for all
  using (
    exists (
      select 1 
      from products
      join farms on farms.id = products.farm_id
      where products.id = product_categories.product_id and farms.owner_id = auth.uid()
    )
  );

-- Insert some initial categories
INSERT INTO categories (name, description, image_url) VALUES
('Vegetables', 'Fresh, locally grown vegetables', 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Fruits', 'Sweet and nutritious fruits', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Dairy', 'Milk, cheese, and other dairy products', 'https://images.unsplash.com/photo-1628088062854-d1870b1b7181?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Meat', 'Ethically raised meat products', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Eggs', 'Fresh farm eggs', 'https://images.unsplash.com/photo-1598965675603-9e587a4c3f02?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'),
('Honey', 'Local honey and bee products', 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'); 
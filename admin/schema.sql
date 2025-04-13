-- =========================
-- Enable Postgres extensions
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- Table: profiles (extends Supabase auth.users)
-- =========================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text default 'user', -- roles: user, admin
  avatar_url text,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table profiles enable row level security;

create policy "Allow user to view their profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Allow user to insert their profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Allow user to update their profile"
  on profiles for update
  using (auth.uid() = id);

-- =========================
-- Table: farms
-- =========================
create table farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  location text,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table farms enable row level security;

create policy "Allow all to read farms"
  on farms for select
  using (true);

create policy "Allow farm owner to insert"
  on farms for insert
  with check (auth.uid() = owner_id);

create policy "Allow farm owner to update/delete"
  on farms for update using (auth.uid() = owner_id);
create policy "Allow farm owner to delete"
  on farms for delete using (auth.uid() = owner_id);

-- =========================
-- Table: products (linked to farms)
-- =========================
create table products (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2),
  available boolean default true,
  image_url text,
  created_at timestamp with time zone default timezone('utc', now())
);

alter table products enable row level security;

create policy "Allow all to view products"
  on products for select
  using (true);

create policy "Allow farm owner to insert products"
  on products for insert
  with check (
    exists (
      select 1 from farms where farms.id = farm_id and farms.owner_id = auth.uid()
    )
  );

create policy "Allow farm owner to update/delete products"
  on products for update using (
    exists (
      select 1 from farms where farms.id = farm_id and farms.owner_id = auth.uid()
    )
  );
create policy "Allow farm owner to delete products"
  on products for delete using (
    exists (
      select 1 from farms where farms.id = farm_id and farms.owner_id = auth.uid()
    )
  );

-- =========================
-- Table: orders
-- =========================
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  quantity integer default 1 check (quantity > 0),
  total_price numeric(10, 2),
  status text default 'pending', -- pending, confirmed, shipped, delivered
  created_at timestamp with time zone default timezone('utc', now())
);

alter table orders enable row level security;

create policy "Allow users to view their own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Allow users to place orders"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "Allow farm owners to view orders for their products"
  on orders for select
  using (
    exists (
      select 1 
      from products
      join farms on farms.id = products.farm_id
      where products.id = orders.product_id and farms.owner_id = auth.uid()
    )
  );

-- =========================
-- Function to handle new user signups
-- =========================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profiles for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 

-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'seller', 'buyer');
create type public.seller_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.product_status as enum ('draft', 'active', 'out_of_stock', 'archived');
create type public.order_status as enum ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
create type public.payment_method as enum ('pay_on_delivery', 'bank_transfer', 'paystack');
create type public.payment_status as enum ('unpaid', 'awaiting_confirmation', 'paid', 'failed', 'refunded');

-- ============ UPDATED_AT TRIGGER ============
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ============ SELLERS ============
create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  contact_person text not null,
  contact_phone text not null,
  contact_email text not null,
  business_address text not null,
  description text,
  logo_url text,
  status seller_status not null default 'pending',
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  rejected_reason text,
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.sellers to authenticated;
grant all on public.sellers to service_role;
alter table public.sellers enable row level security;
create index sellers_status_idx on public.sellers(status);

-- ============ CATEGORIES ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  emoji text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;

-- ============ PRODUCTS ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text not null,
  price_kobo bigint not null check (price_kobo >= 0),
  original_price_kobo bigint check (original_price_kobo is null or original_price_kobo >= 0),
  stock int not null default 0 check (stock >= 0),
  image_urls text[] not null default '{}',
  status product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create index products_seller_idx on public.products(seller_id);
create index products_category_idx on public.products(category_id);
create index products_status_idx on public.products(status);

-- ============ ORDERS ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('RCM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_email text not null,
  delivery_address text not null,
  delivery_city text not null,
  delivery_state text not null,
  delivery_notes text,
  subtotal_kobo bigint not null,
  delivery_fee_kobo bigint not null default 0,
  total_kobo bigint not null,
  payment_method payment_method not null,
  payment_status payment_status not null default 'unpaid',
  payment_reference text,
  status order_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create index orders_buyer_idx on public.orders(buyer_id);
create index orders_status_idx on public.orders(status);

-- ============ ORDER ITEMS ============
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  seller_id uuid not null references public.sellers(id) on delete restrict,
  product_name text not null,
  product_image_url text,
  unit_price_kobo bigint not null,
  quantity int not null check (quantity > 0),
  line_total_kobo bigint not null,
  fulfillment_status order_status not null default 'paid',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create index order_items_order_idx on public.order_items(order_id);
create index order_items_seller_idx on public.order_items(seller_id);

-- ============ TRIGGERS ============
create trigger profiles_updated before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger sellers_updated before update on public.sellers
  for each row execute function public.update_updated_at_column();
create trigger products_updated before update on public.products
  for each row execute function public.update_updated_at_column();
create trigger orders_updated before update on public.orders
  for each row execute function public.update_updated_at_column();

-- ============ AUTO PROFILE + BUYER ROLE ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role) values (new.id, 'buyer')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
create policy "users view own profile" on public.profiles for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "users insert own profile" on public.profiles for insert to authenticated
  with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

-- user_roles
create policy "users view own roles" on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- sellers
create policy "public view approved sellers" on public.sellers for select
  using (status = 'approved' or auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "users create own seller app" on public.sellers for insert to authenticated
  with check (auth.uid() = user_id);
create policy "sellers update own profile" on public.sellers for update to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- categories
create policy "anyone views categories" on public.categories for select using (true);

-- products
create policy "anyone views active products" on public.products for select
  using (
    status = 'active'
    or exists (select 1 from public.sellers s where s.id = products.seller_id and s.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );
create policy "sellers insert own products" on public.products for insert to authenticated
  with check (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid() and s.status = 'approved'));
create policy "sellers update own products" on public.products for update to authenticated
  using (
    exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );
create policy "sellers delete own products" on public.products for delete to authenticated
  using (
    exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

-- orders
create policy "buyers view own orders" on public.orders for select to authenticated
  using (
    auth.uid() = buyer_id
    or public.has_role(auth.uid(), 'admin')
    or exists (
      select 1 from public.order_items oi
      join public.sellers s on s.id = oi.seller_id
      where oi.order_id = orders.id and s.user_id = auth.uid()
    )
  );
create policy "buyers create own orders" on public.orders for insert to authenticated
  with check (auth.uid() = buyer_id);
create policy "buyers update own orders" on public.orders for update to authenticated
  using (auth.uid() = buyer_id or public.has_role(auth.uid(), 'admin'));

-- order_items
create policy "view items of accessible orders" on public.order_items for select to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
    or exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );
create policy "buyers insert items for own orders" on public.order_items for insert to authenticated
  with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));
create policy "sellers update own line items" on public.order_items for update to authenticated
  using (
    exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

-- ============ SEED CATEGORIES ============
insert into public.categories (slug, name, emoji, sort_order) values
  ('phones', 'Phones', '📱', 1),
  ('electronics', 'Electronics', '💻', 2),
  ('fashion', 'Fashion', '👗', 3),
  ('groceries', 'Groceries', '🛒', 4),
  ('snacks-drinks', 'Snacks & Drinks', '🍪', 5),
  ('home-kitchen', 'Home & Kitchen', '🍳', 6),
  ('beauty', 'Beauty', '💄', 7),
  ('power', 'Generators & Power', '⚡', 8),
  ('church-books', 'Church & Books', '📖', 9);

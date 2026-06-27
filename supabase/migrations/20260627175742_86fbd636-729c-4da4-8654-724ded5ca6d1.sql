create schema if not exists app_private;
grant usage on schema app_private to anon, authenticated, service_role;

create or replace function app_private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

grant execute on function app_private.has_role(uuid, public.app_role) to anon, authenticated, service_role;
revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, service_role;

alter policy "users view own roles"
  on public.user_roles
  using ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'));

alter policy "admins manage roles"
  on public.user_roles
  using (app_private.has_role(auth.uid(), 'admin'))
  with check (app_private.has_role(auth.uid(), 'admin'));

alter policy "users view own profile"
  on public.profiles
  using ((auth.uid() = id) or app_private.has_role(auth.uid(), 'admin'));

alter policy "users update own profile"
  on public.profiles
  using ((auth.uid() = id) or app_private.has_role(auth.uid(), 'admin'));

alter policy "admins view all profiles"
  on public.profiles
  using (app_private.has_role(auth.uid(), 'admin'));

alter policy "public view approved sellers"
  on public.sellers
  using ((status = 'approved'::public.seller_status) or (auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'));

alter policy "sellers update own profile"
  on public.sellers
  using ((auth.uid() = user_id) or app_private.has_role(auth.uid(), 'admin'));

alter policy "admins manage sellers"
  on public.sellers
  using (app_private.has_role(auth.uid(), 'admin'))
  with check (app_private.has_role(auth.uid(), 'admin'));

alter policy "anyone views active products"
  on public.products
  using ((status = 'active'::public.product_status) or (exists (select 1 from public.sellers s where s.id = products.seller_id and s.user_id = auth.uid())) or app_private.has_role(auth.uid(), 'admin'));

alter policy "sellers update own products"
  on public.products
  using ((exists (select 1 from public.sellers s where s.id = products.seller_id and s.user_id = auth.uid())) or app_private.has_role(auth.uid(), 'admin'));

alter policy "sellers delete own products"
  on public.products
  using ((exists (select 1 from public.sellers s where s.id = products.seller_id and s.user_id = auth.uid())) or app_private.has_role(auth.uid(), 'admin'));

alter policy "admins manage products"
  on public.products
  using (app_private.has_role(auth.uid(), 'admin'))
  with check (app_private.has_role(auth.uid(), 'admin'));

alter policy "buyers view own orders"
  on public.orders
  using ((auth.uid() = buyer_id) or app_private.has_role(auth.uid(), 'admin') or (exists (select 1 from public.order_items oi join public.sellers s on s.id = oi.seller_id where oi.order_id = orders.id and s.user_id = auth.uid())));

alter policy "buyers update own orders"
  on public.orders
  using ((auth.uid() = buyer_id) or app_private.has_role(auth.uid(), 'admin'));

alter policy "admins manage orders"
  on public.orders
  using (app_private.has_role(auth.uid(), 'admin'))
  with check (app_private.has_role(auth.uid(), 'admin'));

alter policy "view items of accessible orders"
  on public.order_items
  using ((exists (select 1 from public.orders o where o.id = order_items.order_id and o.buyer_id = auth.uid())) or (exists (select 1 from public.sellers s where s.id = order_items.seller_id and s.user_id = auth.uid())) or app_private.has_role(auth.uid(), 'admin'));

alter policy "sellers update own line items"
  on public.order_items
  using ((exists (select 1 from public.sellers s where s.id = order_items.seller_id and s.user_id = auth.uid())) or app_private.has_role(auth.uid(), 'admin'));

alter policy "admins manage order items"
  on public.order_items
  using (app_private.has_role(auth.uid(), 'admin'))
  with check (app_private.has_role(auth.uid(), 'admin'));
grant usage on schema public to anon, authenticated, service_role;

grant select on public.categories to anon, authenticated, service_role;
grant select on public.sellers to anon, authenticated, service_role;
grant select on public.products to anon, authenticated, service_role;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.sellers to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert, update on public.order_items to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;

grant all on public.categories to service_role;
grant all on public.profiles to service_role;
grant all on public.user_roles to service_role;
grant all on public.sellers to service_role;
grant all on public.products to service_role;
grant all on public.orders to service_role;
grant all on public.order_items to service_role;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated, service_role;
grant execute on function public.decrement_product_stock(uuid, integer) to service_role;

drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles"
  on public.user_roles
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins view all profiles" on public.profiles;
create policy "admins view all profiles"
  on public.profiles
  for select
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage sellers" on public.sellers;
create policy "admins manage sellers"
  on public.sellers
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products"
  on public.products
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders"
  on public.orders
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins manage order items" on public.order_items;
create policy "admins manage order items"
  on public.order_items
  for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where lower(email) = 'fadahunsi.miracle@gmail.com'
on conflict (user_id, role) do nothing;

-- Trigger handle_new_user on auth.users (if not already)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'buyer')
  on conflict do nothing;

  -- Auto-grant admin to the church admin email
  if lower(new.email) = 'fadahunsi.miracle@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Storage policies for product-images bucket
create policy "anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "authenticated users upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owners update their product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owners delete their product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Helper to decrement stock after order
create or replace function public.decrement_product_stock(_product_id uuid, _quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
    set stock = greatest(0, stock - _quantity)
  where id = _product_id;
end;
$$;
revoke execute on function public.decrement_product_stock(uuid, integer) from public, anon, authenticated;

revoke insert, update, delete, truncate, references, trigger on public.categories from anon;
revoke insert, update, delete, truncate, references, trigger on public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on public.user_roles from anon;
revoke insert, update, delete, truncate, references, trigger on public.sellers from anon;
revoke insert, update, delete, truncate, references, trigger on public.products from anon;
revoke insert, update, delete, truncate, references, trigger on public.orders from anon;
revoke insert, update, delete, truncate, references, trigger on public.order_items from anon;

revoke select on public.profiles from anon;
revoke select on public.user_roles from anon;
revoke select on public.orders from anon;
revoke select on public.order_items from anon;
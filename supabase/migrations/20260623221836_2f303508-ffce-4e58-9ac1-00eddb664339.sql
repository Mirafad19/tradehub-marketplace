-- Grant Data API privileges so PostgREST can reach public tables.
-- Categories: public read.
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;

-- Products: public read (browsing); sellers write via RLS.
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

-- Sellers: authenticated read/write (RLS narrows); anon may view approved shop pages.
GRANT SELECT ON public.sellers TO anon, authenticated;
GRANT INSERT, UPDATE ON public.sellers TO authenticated;
GRANT ALL ON public.sellers TO service_role;

-- Profiles: only authenticated; RLS scopes to self/admin.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Orders + items: authenticated; RLS scopes to buyer/seller/admin.
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

-- User roles: authenticated read (has_role uses SECURITY DEFINER anyway).
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Truck, BadgeCheck, Search, Store } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  component: HomePage,
});

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price_kobo: number;
  original_price_kobo: number | null;
  image_urls: string[];
  stock: number;
  sellers: { business_name: string } | null;
  categories: { slug: string; name: string } | null;
};

type Cat = { slug: string; name: string; emoji: string | null };

function HomePage() {
  const { q } = Route.useSearch();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from("products")
        .select(
          "id,slug,name,price_kobo,original_price_kobo,image_urls,stock,sellers(business_name),categories(slug,name)",
        )
        .eq("status", "active")
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(40);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data } = await query;
      setProducts((data ?? []) as unknown as ProductRow[]);
      const { data: c } = await supabase
        .from("categories")
        .select("slug,name,emoji")
        .order("sort_order");
      setCats((c ?? []) as Cat[]);
      setLoading(false);
    })();
  }, [q]);

  return (
    <SiteLayout>
      <section className="bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[3fr_2fr] md:py-16">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <BadgeCheck className="h-3.5 w-3.5" />
              The Redeemed Church Members' Marketplace
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] sm:text-5xl md:text-6xl">
              Buy and sell <br />
              <span className="text-brand">within the church.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              A trusted marketplace for RCCG members. Verified sellers,
              secure Paystack payments, and fast delivery nationwide.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
                window.location.assign("/?q=" + encodeURIComponent(v));
              }}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-card p-1.5 ring-1 ring-border"
            >
              <Search className="ml-3 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q ?? ""}
                type="search"
                placeholder="What are you looking for today?"
                className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
              >
                Search
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand" /> Verified church sellers</span>
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-brand" /> Nationwide delivery</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-brand" /> Paystack secure pay</span>
            </div>
          </div>

          <div className="hidden flex-col justify-between gap-4 rounded-2xl bg-brand p-8 text-brand-foreground md:flex">
            <div>
              <Store className="h-8 w-8 opacity-80" />
              <div className="mt-4 font-display text-2xl font-semibold">Are you a member?</div>
              <p className="mt-2 text-sm opacity-90">
                List your goods, snacks, fashion, phones, services — and reach
                fellow members across Nigeria.
              </p>
            </div>
            <Link
              to="/seller"
              className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-foreground px-5 py-2 text-sm font-semibold text-brand"
            >
              Become a seller →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="font-display text-xl font-semibold">Shop by category</h2>
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6 md:grid-cols-9">
          {cats.map((c) => (
            <Link
              key={c.slug}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-card p-4 ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-brand"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-center text-xs font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {q ? `Search: "${q}"` : "Latest from our sellers"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? "Loading…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {!loading && products.length === 0 && (
          <div className="rounded-2xl bg-surface px-6 py-16 text-center ring-1 ring-border">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
              <Store className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">
              No products yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Be one of the first sellers in our community.
            </p>
            <Link
              to="/seller"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              Start selling
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCardDB key={p.id} p={p} />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

export function ProductCardDB({ p }: { p: ProductRow }) {
  const img = p.image_urls?.[0];
  return (
    <Link
      to="/products/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-brand"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={p.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <Store className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {p.categories?.name ?? ""}
        </div>
        <div className="line-clamp-2 text-sm font-medium leading-snug">{p.name}</div>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-base font-semibold text-brand">
            {formatNaira(p.price_kobo)}
          </span>
          {p.original_price_kobo && p.original_price_kobo > p.price_kobo && (
            <span className="text-xs text-muted-foreground line-through">
              {formatNaira(p.original_price_kobo)}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {p.sellers?.business_name}
        </div>
      </div>
    </Link>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { ProductCardDB } from "@/routes/index";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

type CatRow = { id: string; name: string; emoji: string | null };

function CategoryPage() {
  const { slug } = Route.useParams();
  const [category, setCategory] = useState<CatRow | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cat } = await supabase
        .from("categories")
        .select("id,name,emoji")
        .eq("slug", slug)
        .maybeSingle();
      if (!cat) {
        setNotFoundFlag(true);
        setLoading(false);
        return;
      }
      setCategory(cat as CatRow);
      const { data: prods } = await supabase
        .from("products")
        .select(
          "id,slug,name,price_kobo,original_price_kobo,image_urls,stock,sellers(business_name),categories(slug,name)",
        )
        .eq("category_id", cat.id)
        .eq("status", "active")
        .gt("stock", 0)
        .order("created_at", { ascending: false });
      setProducts(prods ?? []);
      setLoading(false);
    })();
  }, [slug]);

  if (notFoundFlag) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-2xl font-semibold">Category not found</h1>
          <Link to="/" className="mt-4 inline-block text-brand hover:underline">
            Back to home →
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-brand">
          ← All categories
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-4xl">{category?.emoji}</span>
          <h1 className="font-display text-3xl font-semibold">{category?.name}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading ? "Loading…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCardDB key={p.id} p={p} />
          ))}
        </div>

        {!loading && products.length === 0 && (
          <div className="mt-10 rounded-2xl bg-surface px-6 py-14 text-center ring-1 ring-border">
            <p className="text-sm text-muted-foreground">
              No active products in this category yet.
            </p>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

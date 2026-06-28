import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingBag, ShieldCheck, Truck, Store } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";
import { addToCart } from "@/lib/cart-store";
import { productImageUrl } from "@/lib/product-images";

export const Route = createFileRoute("/products/$slug")({
  component: ProductPage,
});

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_kobo: number;
  original_price_kobo: number | null;
  stock: number;
  image_urls: string[];
  seller_id: string;
  sellers: { id: string; business_name: string; slug: string } | null;
  categories: { slug: string; name: string } | null;
};

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select(
          "id,slug,name,description,price_kobo,original_price_kobo,stock,image_urls,seller_id,sellers(id,business_name,slug),categories(slug,name)",
        )
        .eq("slug", slug)
        .maybeSingle();
      setProduct(data as unknown as Product);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-muted-foreground sm:px-6">
          Loading…
        </div>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-2xl font-semibold">Product not found</h1>
          <Link to="/" className="mt-4 inline-block text-brand hover:underline">
            Back to home →
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const img = productImageUrl(product.image_urls?.[imgIdx] ?? product.image_urls?.[0]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-brand">Home</Link>
          {product.categories && (
            <>
              <span className="mx-2">/</span>
              <Link to="/category/$slug" params={{ slug: product.categories.slug }} className="hover:text-brand">
                {product.categories.name}
              </Link>
            </>
          )}
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
              {img ? (
                <img src={img} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground">
                  <Store className="h-16 w-16" />
                </div>
              )}
            </div>
            {product.image_urls.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.image_urls.map((u, i) => (
                  <button
                    key={u}
                    onClick={() => setImgIdx(i)}
                    className={`h-16 w-16 overflow-hidden rounded-md ring-2 ${
                      i === imgIdx ? "ring-brand" : "ring-border"
                    }`}
                  >
                    {productImageUrl(u) ? <img src={productImageUrl(u)!} alt="" className="h-full w-full object-cover" /> : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl font-semibold">{product.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground">
              Sold by <span className="font-medium text-foreground">{product.sellers?.business_name}</span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-brand">{formatNaira(product.price_kobo)}</span>
              {product.original_price_kobo && product.original_price_kobo > product.price_kobo && (
                <span className="text-base text-muted-foreground line-through">
                  {formatNaira(product.original_price_kobo)}
                </span>
              )}
            </div>

            <div className="mt-3 text-sm">
              {product.stock > 0 ? (
                <span className="font-medium text-success">In stock · {product.stock} available</span>
              ) : (
                <span className="font-medium text-destructive">Out of stock</span>
              )}
            </div>

            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {product.stock > 0 && (
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center rounded-full ring-1 ring-border">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-brand"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2.5rem] text-center font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-brand"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    addToCart(
                      {
                        productId: product.id,
                        sellerId: product.seller_id,
                        name: product.name,
                        priceKobo: product.price_kobo,
                        imageUrl: product.image_urls[0] ?? null,
                        stock: product.stock,
                      },
                      qty,
                    );
                    toast.success(`Added ${qty} × ${product.name}`);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
                >
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </button>
                <button
                  onClick={() => {
                    addToCart(
                      {
                        productId: product.id,
                        sellerId: product.seller_id,
                        name: product.name,
                        priceKobo: product.price_kobo,
                        imageUrl: product.image_urls[0] ?? null,
                        stock: product.stock,
                      },
                      qty,
                    );
                    navigate({ to: "/checkout" });
                  }}
                  className="rounded-full border border-brand bg-brand-soft px-5 py-3 text-sm font-semibold text-brand hover:bg-brand hover:text-brand-foreground"
                >
                  Buy now
                </button>
              </div>
            )}

            <div className="mt-8 grid gap-3 rounded-2xl bg-surface p-5 ring-1 ring-border">
              <div className="flex items-start gap-3 text-sm">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-brand" />
                <div>
                  <div className="font-semibold">Secure Paystack payment</div>
                  <div className="text-muted-foreground">Card, transfer, USSD — all supported.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Truck className="mt-0.5 h-5 w-5 text-brand" />
                <div>
                  <div className="font-semibold">Delivered to your address</div>
                  <div className="text-muted-foreground">Coordinate directly with the seller.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

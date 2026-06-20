import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Minus,
  Plus,
  Store,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductImage } from "@/components/ProductImage";
import { ProductCard } from "@/components/ProductCard";
import { formatNaira, getProductBySlug, products } from "@/lib/products";
import { addToCart } from "@/lib/cart-store";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    const related = products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
    return { product, related };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — TradeHub` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:description", content: loaderData.product.description },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Product not found</h1>
        <Link to="/" className="mt-6 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground">
          Continue shopping
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ reset }) => (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold">Couldn't load this product</h1>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          Try again
        </button>
      </div>
    </SiteLayout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-brand">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/category/$slug" params={{ slug: product.category }} className="hover:text-brand capitalize">
            {product.category.replace("-", " ")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
          {/* Gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl ring-1 ring-border bg-card">
              <ProductImage hue={product.imageHue} label={product.name} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  className={`aspect-square overflow-hidden rounded-lg ring-1 transition-all ${
                    i === 0 ? "ring-brand ring-2" : "ring-border hover:ring-brand/30"
                  }`}
                >
                  <ProductImage
                    hue={(product.imageHue + i * 25) % 360}
                    label={product.name}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs">
              <Link
                to="/category/$slug"
                params={{ slug: product.category }}
                className="rounded-full bg-brand-soft px-2.5 py-0.5 font-semibold uppercase tracking-wide text-brand"
              >
                {product.category.replace("-", " ")}
              </Link>
              {product.inStock > 0 ? (
                <span className="text-success">In stock · {product.inStock} left</span>
              ) : (
                <span className="text-destructive">Out of stock</span>
              )}
            </div>
            <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      n <= Math.round(product.rating)
                        ? "fill-warning text-warning"
                        : "text-muted"
                    }`}
                  />
                ))}
                <span className="ml-1 font-semibold">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">
                · {product.reviewCount} reviews
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-brand">
                {formatNaira(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatNaira(product.originalPrice)}
                  </span>
                  {discount && (
                    <span className="rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                      Save {discount}%
                    </span>
                  )}
                </>
              )}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Seller */}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-surface p-4 ring-1 ring-border">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand text-brand-foreground">
                  <Store className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Sold by</div>
                  <div className="text-sm font-semibold">{product.sellerName}</div>
                </div>
              </div>
              <button className="text-xs font-semibold text-brand hover:underline underline-offset-4">
                Visit shop →
              </button>
            </div>

            {/* Quantity + CTA */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-full ring-1 ring-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.inStock, q + 1))}
                  className="grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={product.inStock === 0}
                className="flex-1 rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {added ? "Added to cart ✓" : "Add to cart"}
              </button>
            </div>

            <Link
              to="/cart"
              className="mt-3 block w-full rounded-full border border-border bg-card py-3 text-center text-sm font-semibold transition-colors hover:bg-muted"
            >
              Go to cart
            </Link>

            {/* Trust grid */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
              <Perk icon={<ShieldCheck className="h-4 w-4" />} text="Escrow protection" />
              <Perk icon={<Truck className="h-4 w-4" />} text="24h Lagos delivery" />
              <Perk icon={<RotateCcw className="h-4 w-4" />} text="7-day returns" />
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 font-display text-2xl font-semibold">More like this</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {related.map((p: import("@/lib/products").Product) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}

function Perk({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg bg-surface p-3 text-center ring-1 ring-border">
      <span className="text-brand">{icon}</span>
      <span className="font-medium text-muted-foreground">{text}</span>
    </div>
  );
}

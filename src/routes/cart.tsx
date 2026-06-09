import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShieldCheck, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductImage } from "@/components/ProductImage";
import {
  formatNaira,
  getProductBySlug,
  products as allProducts,
} from "@/lib/products";
import { useCart, updateQuantity, removeFromCart } from "@/lib/cart-store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — TradeHub" },
      { name: "description", content: "Review your TradeHub cart and check out securely." },
    ],
  }),
  component: CartPage,
});

function productById(id: string) {
  return allProducts.find((p) => p.id === id);
}

function CartPage() {
  const { items } = useCart();

  const lines = items
    .map((item) => {
      const product = productById(item.productId);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter((x): x is { product: NonNullable<ReturnType<typeof getProductBySlug>>; quantity: number } => x !== null);

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const shipping = subtotal > 0 ? (subtotal > 100000 ? 0 : 2500) : 0;
  const total = subtotal + shipping;

  if (lines.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-3xl">
            🛒
          </div>
          <h1 className="font-display text-3xl font-semibold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Browse trending products and add something you'll love.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="mb-8 font-display text-3xl font-semibold">Your cart</h1>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-3">
            {lines.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 rounded-xl bg-card p-4 ring-1 ring-border"
              >
                <Link
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-border"
                >
                  <ProductImage hue={product.imageHue} label={product.name} />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to="/products/$slug"
                        params={{ slug: product.slug }}
                        className="font-semibold leading-tight hover:text-brand"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Sold by {product.sellerName}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div className="flex items-center rounded-full ring-1 ring-border">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="font-display text-lg font-semibold text-brand">
                      {formatNaira(product.price * quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-2xl bg-surface p-6 ring-1 ring-border lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-semibold">{formatNaira(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-semibold">
                  {shipping === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    formatNaira(shipping)
                  )}
                </dd>
              </div>
              {subtotal < 100000 && subtotal > 0 && (
                <p className="text-xs text-muted-foreground">
                  Add {formatNaira(100000 - subtotal)} more for free shipping.
                </p>
              )}
            </dl>
            <div className="my-4 h-px bg-border" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-brand">
                {formatNaira(total)}
              </span>
            </div>
            <Link
              to="/checkout"
              className="mt-6 block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              Proceed to checkout
            </Link>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-brand-soft p-3 text-xs text-brand">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Escrow-protected.</strong> Sellers are only paid once you confirm delivery.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

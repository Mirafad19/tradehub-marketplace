import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, Store } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { useCart, updateQuantity, removeFromCart } from "@/lib/cart-store";
import { formatNaira } from "@/lib/format";
import { productImageUrl } from "@/lib/product-images";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — RCCGTradeHUB" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotalKobo } = useCart();

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold">Your cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse products from our church members.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Start shopping
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 font-display text-3xl font-semibold">Your cart</h1>
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <ul className="space-y-3">
            {items.map((it) => (
              <li
                key={it.productId}
                className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {it.imageUrl ? (
                    <img src={productImageUrl(it.imageUrl) ?? it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <Store className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link to="/products/$slug" params={{ slug: "" }} className="text-sm font-medium hover:text-brand">
                    {it.name}
                  </Link>
                  <div className="mt-1 text-sm font-semibold text-brand">
                    {formatNaira(it.priceKobo)}
                  </div>
                </div>
                <div className="flex items-center rounded-full ring-1 ring-border">
                  <button
                    onClick={() => updateQuantity(it.productId, it.quantity - 1)}
                    className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-brand"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold">{it.quantity}</span>
                  <button
                    onClick={() => updateQuantity(it.productId, it.quantity + 1)}
                    className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-brand"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="hidden w-24 text-right text-sm font-semibold sm:block">
                  {formatNaira(it.priceKobo * it.quantity)}
                </div>
                <button
                  onClick={() => removeFromCart(it.productId)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <aside className="h-fit space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatNaira(subtotalKobo)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-muted-foreground">Calculated at checkout</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold text-brand">
                {formatNaira(subtotalKobo)}
              </span>
            </div>
            <Link
              to="/checkout"
              className="block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              Proceed to checkout
            </Link>
            <Link
              to="/"
              className="block w-full rounded-full border border-border bg-card py-3 text-center text-sm font-semibold hover:bg-muted"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

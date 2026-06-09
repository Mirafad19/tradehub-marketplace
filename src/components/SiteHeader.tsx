import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Store, User } from "lucide-react";
import { categories } from "@/lib/products";
import { useCart } from "@/lib/cart-store";

export function SiteHeader() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 sm:gap-6">
        <Link to="/" className="flex items-center gap-1.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-brand-foreground font-display font-bold">
            T
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            TradeHub
          </span>
        </Link>

        <form
          className="hidden flex-1 md:block"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search generators, Ankara, phones, groceries…"
              className="w-full rounded-md bg-muted py-2 pl-10 pr-4 text-sm outline-none ring-1 ring-border transition-all placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </form>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            to="/sell"
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
          >
            <Store className="h-4 w-4" />
            Sell
          </Link>
          <Link
            to="/account"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </Link>
          <Link
            to="/cart"
            className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Search on mobile */}
      <div className="border-t border-border md:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search TradeHub"
              className="w-full rounded-md bg-muted py-2 pl-10 pr-4 text-sm outline-none ring-1 ring-border placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>
      </div>

      {/* Category strip */}
      <div className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="no-scrollbar flex gap-5 overflow-x-auto py-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to="/category/$slug"
                params={{ slug: cat.slug }}
                className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-brand"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

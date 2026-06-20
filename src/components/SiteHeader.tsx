import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Store, User, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth";

type Cat = { slug: string; name: string };

export function SiteHeader() {
  const { count } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [cats, setCats] = useState<Cat[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("categories")
      .select("slug,name")
      .order("sort_order")
      .then(({ data }) => setCats((data ?? []) as Cat[]));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 sm:gap-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground font-display font-bold">
            R
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
            RCCGTradeHUB
          </span>
        </Link>

        <form
          className="hidden flex-1 md:block"
          onSubmit={(e) => {
            e.preventDefault();
            const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            navigate({ to: "/", search: { q } as never });
          }}
          role="search"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="search"
              placeholder="Search products from our church merchants…"
              className="w-full rounded-md bg-muted py-2 pl-10 pr-4 text-sm outline-none ring-1 ring-border placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </form>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            to="/seller"
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
          >
            <Store className="h-4 w-4" />
            Sell
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-brand transition-colors hover:bg-muted sm:flex"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-foreground transition-colors hover:bg-muted"
              >
                <User className="h-4 w-4" />
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {user.email}
                </span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-muted"
                  >
                    My orders
                  </Link>
                  <Link
                    to="/seller"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-muted"
                  >
                    Seller dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                      navigate({ to: "/" });
                    }}
                    className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-sm text-destructive hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
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

      <div className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="no-scrollbar flex gap-5 overflow-x-auto py-2.5">
            {cats.map((cat) => (
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

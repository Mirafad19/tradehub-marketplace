import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Truck, BadgeCheck, Search } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { ProductCard } from "@/components/ProductCard";
import { categories, products } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TradeHub — Nigeria's local-first online marketplace" },
      {
        name: "description",
        content:
          "Buy and sell on TradeHub. Verified Nigerian merchants, secure payments, fast delivery nationwide. Phones, fashion, generators, groceries and more.",
      },
      { property: "og:title", content: "TradeHub — Nigeria's local-first online marketplace" },
      {
        property: "og:description",
        content:
          "Verified Nigerian sellers. Secure payments. Fast nationwide delivery.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const trending = products.slice(0, 8);
  const featuredCategories = categories.slice(0, 6);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[3fr_2fr] md:py-16">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Over 15,000 verified Nigerian sellers
            </span>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl md:text-6xl">
              Nigeria's most active <br />
              <span className="text-brand">trade community.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Buy directly from verified local merchants. Secure escrow payments,
              authentic products, and fast delivery across Lagos, Abuja and Port
              Harcourt.
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-card p-1.5 ring-1 ring-border shadow-[var(--shadow-card)]"
            >
              <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="search"
                placeholder="What are you looking for today?"
                className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
              >
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>Popular:</span>
              {["Tecno phone", "Generator", "Ankara", "Rice 50kg", "Powerbank"].map((q) => (
                <a
                  key={q}
                  href="#"
                  className="hover:text-brand hover:underline underline-offset-4"
                >
                  {q}
                </a>
              ))}
            </div>
          </div>

          {/* Right side: featured stack */}
          <div className="hidden grid-cols-2 gap-3 md:grid">
            <div className="col-span-2 flex flex-col justify-between rounded-2xl bg-brand p-6 text-brand-foreground">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                  Deal of the day
                </div>
                <div className="mt-2 font-display text-2xl font-semibold">
                  Tecno Camon 20 Pro
                </div>
                <div className="mt-1 text-sm opacity-80">From ₦185,000 · Save ₦30,000</div>
              </div>
              <Link
                to="/products/$slug"
                params={{ slug: "tecno-camon-20-pro-256gb" }}
                className="mt-6 inline-flex w-fit items-center gap-1 rounded-full bg-brand-foreground px-4 py-1.5 text-xs font-semibold text-brand"
              >
                Shop now <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <MiniCard title="Generators" subtitle="Power up" hue={28} />
            <MiniCard title="Ankara fabric" subtitle="From ₦28,500" hue={350} />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Popular categories</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump straight to what you need.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {featuredCategories.map((cat) => (
            <Link
              key={cat.slug}
              to="/category/$slug"
              params={{ slug: cat.slug }}
              className="group flex flex-col items-center rounded-xl bg-card p-5 text-center ring-1 ring-border transition-all hover:ring-brand/40 hover:shadow-[var(--shadow-card)]"
            >
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-2xl transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                {cat.emoji}
              </div>
              <span className="text-sm font-semibold">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Trending now</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What Nigerians are buying this week.
            </p>
          </div>
          <Link
            to="/"
            className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 rounded-2xl bg-surface p-8 ring-1 ring-border md:grid-cols-3">
          <TrustItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title="TradeHub Guarantee"
            text="Payments held in escrow until you receive and confirm your order."
          />
          <TrustItem
            icon={<Truck className="h-5 w-5" />}
            title="Fast nationwide delivery"
            text="24-hour delivery in Lagos. 72 hours to every state in Nigeria."
          />
          <TrustItem
            icon={<BadgeCheck className="h-5 w-5" />}
            title="Verified sellers only"
            text="Every vendor is identity-checked to keep your purchase authentic."
          />
        </div>
      </section>

      {/* Seller CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-brand">
          <div className="grid items-center gap-10 p-8 sm:p-12 md:grid-cols-[3fr_2fr]">
            <div className="text-brand-foreground">
              <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
                Grow your business with TradeHub.
              </h2>
              <p className="mt-3 max-w-lg text-base opacity-90">
                Join thousands of Nigerian entrepreneurs reaching customers
                nationwide. Zero setup fees, same-day payouts, real seller tools.
              </p>
              <Link
                to="/sell"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-foreground px-6 py-3 text-sm font-semibold text-brand transition-transform hover:scale-[1.02]"
              >
                Open your shop
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat value="0%" label="Setup fee" />
              <Stat value="24h" label="Payouts" />
              <Stat value="36" label="States covered" />
              <Stat value="15k+" label="Active sellers" />
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function MiniCard({ title, subtitle, hue }: { title: string; subtitle: string; hue: number }) {
  return (
    <div
      className="flex flex-col justify-end rounded-2xl p-5 text-foreground ring-1 ring-border"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 60% 92%), hsl(${(hue + 25) % 360} 50% 82%))`,
      }}
    >
      <div className="font-display text-lg font-semibold">{title}</div>
      <div className="text-xs text-foreground/70">{subtitle}</div>
    </div>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-brand-foreground/10 p-4 text-center ring-1 ring-brand-foreground/15 backdrop-blur-sm">
      <div className="font-display text-2xl font-bold text-brand-foreground">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-brand-foreground/80">
        {label}
      </div>
    </div>
  );
}

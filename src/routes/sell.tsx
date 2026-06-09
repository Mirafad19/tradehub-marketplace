import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Store, Wallet, BarChart3, Truck } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell on TradeHub — Reach millions of Nigerian buyers" },
      {
        name: "description",
        content:
          "Open your TradeHub shop in 2 minutes. 0% setup, same-day payouts, real seller tools, and access to millions of verified buyers nationwide.",
      },
      { property: "og:title", content: "Sell on TradeHub" },
      {
        property: "og:description",
        content:
          "0% setup, same-day payouts, real seller tools. Join 15,000+ verified Nigerian sellers.",
      },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              For sellers
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-6xl">
              Sell more.<br />
              <span className="text-brand">Stress less.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Open a TradeHub shop in 2 minutes and start receiving orders from
              verified buyers across all 36 states. Zero setup fees, same-day
              payouts, real tools to run your business.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/seller/register"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
              >
                Open your shop
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/seller"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted"
              >
                Already a seller? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-4">
          <Pillar
            icon={<Store className="h-5 w-5" />}
            title="Your own storefront"
            text="A branded shop page with your products, ratings and customer reviews."
          />
          <Pillar
            icon={<BarChart3 className="h-5 w-5" />}
            title="Real sales analytics"
            text="Track daily, weekly and monthly revenue. Spot best-sellers instantly."
          />
          <Pillar
            icon={<Wallet className="h-5 w-5" />}
            title="Same-day payouts"
            text="Funds settle to your Nigerian bank account within 24 hours of delivery."
          />
          <Pillar
            icon={<Truck className="h-5 w-5" />}
            title="Logistics handled"
            text="Use TradeHub's nationwide courier network or arrange your own."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold">How it works</h2>
        <p className="mt-2 text-muted-foreground">
          From signup to first sale in less than a day.
        </p>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          <Step
            n={1}
            title="Register your business"
            text="Submit your business name, contact details and ID for quick verification."
          />
          <Step
            n={2}
            title="List your products"
            text="Add photos, descriptions, prices and inventory in your seller dashboard."
          />
          <Step
            n={3}
            title="Receive orders"
            text="Orders land in your dashboard and notify you instantly via SMS and email."
          />
          <Step
            n={4}
            title="Get paid"
            text="Ship the order, mark it delivered, and your payout is on the way."
          />
        </ol>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-2xl ring-1 ring-border">
          <div className="grid md:grid-cols-2">
            <div className="bg-brand p-10 text-brand-foreground">
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                Simple pricing
              </span>
              <h3 className="mt-3 font-display text-3xl font-semibold">
                Pay only when you sell.
              </h3>
              <p className="mt-4 text-base opacity-90">
                No subscription. No listing fees. Just a fair commission on every
                successful order — and we handle the payment infrastructure.
              </p>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold">5%</span>
                <span className="text-sm opacity-80">commission per sale</span>
              </div>
            </div>
            <div className="bg-card p-10">
              <h4 className="font-display text-lg font-semibold">What you get</h4>
              <ul className="mt-5 space-y-3 text-sm">
                {[
                  "Unlimited product listings",
                  "Branded seller storefront",
                  "Order, customer and inventory management",
                  "Real-time sales analytics & reports",
                  "Same-day payouts to Nigerian bank accounts",
                  "Customer messaging built-in",
                  "Verified-seller badge",
                ].map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/seller/register"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background hover:bg-foreground/90"
              >
                Open my shop
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Pillar({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl bg-card p-6 ring-1 ring-border">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="rounded-xl bg-surface p-6 ring-1 ring-border">
      <div className="font-display text-3xl font-bold text-brand">0{n}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </li>
  );
}

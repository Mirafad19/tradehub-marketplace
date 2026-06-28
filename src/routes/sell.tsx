import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Store, Wallet, Megaphone, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell on RCCGTradeHUB — Church Members' Marketplace" },
      { name: "description", content: "Apply to become a verified seller on RCCGTradeHUB and reach church members across Nigeria." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  return (
    <SiteLayout>
      <section className="bg-brand text-brand-foreground">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-foreground/15 px-3 py-1 text-xs font-semibold">
            For RCCG members
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Turn your church community<br /> into your customer base.
          </h1>
          <p className="mt-4 max-w-2xl text-base opacity-90 sm:text-lg">
            Open a verified seller account, upload your real products with
            photos, receive orders, and manage buyer payments from one dashboard.
          </p>
          <Link
            to="/seller"
            className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-brand-foreground px-6 py-3 text-sm font-semibold text-brand"
          >
            Apply to sell <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Store, title: "Your own shop page", desc: "Each seller gets a branded shop with logo, description and product catalogue." },
            { icon: Wallet, title: "Paystack payouts", desc: "Buyers pay securely. Funds settled to your registered Nigerian bank account." },
            { icon: Megaphone, title: "Free promotion", desc: "Your products appear in our homepage feed and category listings." },
            { icon: ShieldCheck, title: "Verified trust", desc: "Sellers are vetted by our admin team — buyers know they're dealing with real members." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-card p-6 ring-1 ring-border">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-surface p-8 ring-1 ring-border">
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
          <ol className="mt-5 grid gap-5 sm:grid-cols-3">
            {[
              ["1", "Apply", "Tell us about your business — name, contact, products."],
              ["2", "Get approved", "Our admin team verifies your application within 24 hours."],
              ["3", "List & sell", "Upload products with photos. Start receiving orders."],
            ].map(([n, t, d]) => (
              <li key={n} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-brand-foreground">{n}</span>
                <div>
                  <div className="font-semibold">{t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{d}</div>
                </div>
              </li>
            ))}
          </ol>
          <Link
            to="/seller"
            className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Start your application <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — TradeHub" },
      { name: "description", content: "Manage your TradeHub shop, products and orders." },
    ],
  }),
  component: SellerHome,
});

function SellerHome() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          Seller area
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
          Your private seller dashboard
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sign-in, product management, order processing, sales analytics and
          payouts are being wired up next. Today you can apply to become a
          seller — we'll notify you the moment your dashboard is live.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/seller/register"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Apply to sell
          </Link>
          <Link
            to="/sell"
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted"
          >
            Learn more
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}

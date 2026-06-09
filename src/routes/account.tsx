import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — TradeHub" },
      { name: "description", content: "Sign in to track orders, manage addresses, and view your TradeHub activity." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Customer accounts are coming in the next update — including order
          tracking, saved addresses, wishlist and reviews.
        </p>
        <div className="mt-8 rounded-2xl bg-surface p-6 ring-1 ring-border">
          <div className="text-sm font-semibold">In the meantime</div>
          <p className="mt-1 text-sm text-muted-foreground">
            You can browse products and check out as a guest. Buyer accounts
            (email, phone, Google) are wired up next.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}

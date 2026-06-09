import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-brand-foreground font-display font-bold">
                T
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                TradeHub
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Nigeria's local-first marketplace, connecting verified merchants with
              millions of shoppers nationwide.
            </p>
          </div>

          <FooterColumn
            title="Marketplace"
            links={[
              { label: "Browse products", to: "/" },
              { label: "Categories", to: "/" },
              { label: "Flash sales", to: "/" },
              { label: "Best sellers", to: "/" },
            ]}
          />
          <FooterColumn
            title="Sell"
            links={[
              { label: "Become a seller", to: "/sell" },
              { label: "Seller dashboard", to: "/seller" },
              { label: "Fees & payouts", to: "/sell" },
              { label: "Seller policy", to: "/sell" },
            ]}
          />
          <FooterColumn
            title="Support"
            links={[
              { label: "Help center", to: "/" },
              { label: "Track order", to: "/account" },
              { label: "Returns & refunds", to: "/" },
              { label: "Contact us", to: "/" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} TradeHub Marketplace. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
        {title}
      </h4>
      <ul className="space-y-2.5 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="transition-colors hover:text-brand">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

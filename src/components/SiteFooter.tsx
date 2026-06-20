import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground font-display font-bold">
              R
            </span>
            <span className="font-display text-base font-semibold">RCCGTradeHUB</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            The Redeemed Christian Church of God members' marketplace. Buy and
            sell within our church community.
          </p>
        </div>
        <div>
          <h4 className="font-semibold">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-brand">All products</Link></li>
            <li><Link to="/cart" className="hover:text-brand">Your cart</Link></li>
            <li><Link to="/account" className="hover:text-brand">Your orders</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Sell</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/seller" className="hover:text-brand">Become a seller</Link></li>
            <li><Link to="/seller" className="hover:text-brand">Seller dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Support: hello@rccgtradehub.ng</li>
            <li>Mon–Sat · 9am–6pm WAT</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} RCCGTradeHUB. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

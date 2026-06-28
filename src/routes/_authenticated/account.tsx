import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import { productImageUrl } from "@/lib/product-images";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_kobo: number;
  created_at: string;
  order_items: { product_name: string; quantity: number; product_image_url: string | null }[];
};

function AccountPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id,order_number,status,payment_status,total_kobo,created_at,order_items(product_name,quantity,product_image_url)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as unknown as Order[]);
        setLoading(false);
      });
  }, [user]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">My orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>

        {loading ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-surface p-12 text-center ring-1 ring-border">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
              <Package className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">No orders yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">When you place an order, it'll show up here.</p>
            <Link to="/" className="mt-5 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl bg-card p-5 ring-1 ring-border">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">{o.order_number}</div>
                    <div className="mt-1 font-display text-lg font-semibold">{formatNaira(o.total_kobo)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize">
                      {o.status.replace("_", " ")}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${o.payment_status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
                      {o.payment_status}
                    </span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                  {o.order_items.map((it, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                        {productImageUrl(it.product_image_url) ? <img src={productImageUrl(it.product_image_url)!} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                      <span className="flex-1 truncate">{it.product_name}</span>
                      <span className="text-muted-foreground">× {it.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

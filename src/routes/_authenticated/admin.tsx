import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Shield, Package, Store, ShoppingBag, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import { productImageUrl } from "@/lib/product-images";
import { adminSetProductStatus, adminSetSellerStatus, adminUpdateOrder } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type Seller = {
  id: string;
  business_name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  business_address: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  created_at: string;
  rejected_reason: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price_kobo: number;
  stock: number;
  status: "draft" | "active" | "out_of_stock" | "archived";
  image_urls: string[];
  created_at: string;
  sellers: { business_name: string } | null;
  categories: { name: string } | null;
};

type Order = {
  id: string;
  order_number: string;
  buyer_name: string;
  total_kobo: number;
  status: "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  payment_status: "unpaid" | "awaiting_confirmation" | "paid" | "failed" | "refunded";
  payment_method: string;
  created_at: string;
};

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"sellers" | "products" | "orders">("sellers");
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    refresh();
  }, [isAdmin]);

  async function refresh() {
    const [{ data: s }, { data: p }, { data: o }] = await Promise.all([
      supabase.from("sellers").select("*").order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("id,name,slug,price_kobo,stock,status,image_urls,created_at,sellers(business_name),categories(name)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("orders")
        .select("id,order_number,buyer_name,total_kobo,status,payment_status,payment_method,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setSellers((s ?? []) as Seller[]);
    setProducts((p ?? []) as unknown as Product[]);
    setOrders((o ?? []) as Order[]);
  }

  async function setStatus(id: string, status: "approved" | "rejected" | "suspended" | "pending") {
    const reason = status === "rejected" ? prompt("Reason for rejection?") : null;
    setBusyId(id);
    try {
      await adminSetSellerStatus({ data: { id, status, reason } });
      toast.success(`Seller ${status}`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update seller");
    } finally {
      setBusyId(null);
    }
  }

  async function setProductStatus(id: string, status: "draft" | "active" | "archived") {
    setBusyId(id);
    try {
      await adminSetProductStatus({ data: { id, status } });
      toast.success(`Product ${status}`);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update product");
    } finally {
      setBusyId(null);
    }
  }

  async function updateOrder(id: string, update: { status?: Order["status"]; payment_status?: Order["payment_status"] }) {
    setBusyId(id);
    try {
      await adminUpdateOrder({ data: { id, ...update } });
      toast.success("Order updated");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update order");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <SiteLayout><div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">Loading…</div></SiteLayout>;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand" />
          <h1 className="font-display text-3xl font-semibold">Admin</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Approve sellers, moderate products, confirm payments and supervise orders for RCCGTradeHUB.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <AdminStat icon={Store} label="Sellers" value={sellers.length} />
          <AdminStat icon={ShoppingBag} label="Products" value={products.length} />
          <AdminStat icon={Package} label="Orders" value={orders.length} />
        </div>

        <div className="mt-6 flex gap-2 border-b border-border">
          {(["sellers", "products", "orders"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold capitalize ${tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "sellers" && (
          <div className="mt-6 space-y-3">
            {sellers.length === 0 && <p className="text-sm text-muted-foreground">No seller applications yet.</p>}
            {sellers.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card p-5 ring-1 ring-border">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{s.business_name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.status === "approved" ? "bg-success/15 text-success" : s.status === "pending" ? "bg-warning/15 text-warning-foreground" : "bg-destructive/15 text-destructive"}`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                    <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      <div><dt className="inline text-muted-foreground">Contact:</dt> <dd className="inline font-medium">{s.contact_person} · {s.contact_phone}</dd></div>
                      <div><dt className="inline text-muted-foreground">Email:</dt> <dd className="inline font-medium">{s.contact_email}</dd></div>
                      <div className="sm:col-span-2"><dt className="inline text-muted-foreground">Address:</dt> <dd className="inline">{s.business_address}</dd></div>
                      {(s.bank_name || s.bank_account_number || s.bank_account_name) && (
                        <div className="sm:col-span-2"><dt className="inline text-muted-foreground">Bank:</dt> <dd className="inline">{[s.bank_name, s.bank_account_number, s.bank_account_name].filter(Boolean).join(" · ")}</dd></div>
                      )}
                      {s.rejected_reason && <div className="sm:col-span-2 text-destructive"><dt className="inline">Rejection:</dt> <dd className="inline">{s.rejected_reason}</dd></div>}
                    </dl>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.status !== "approved" && (
                      <button disabled={busyId === s.id} onClick={() => setStatus(s.id, "approved")} className="inline-flex items-center gap-1.5 rounded-full bg-success px-4 py-2 text-xs font-semibold text-success-foreground hover:opacity-90 disabled:opacity-50">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                    )}
                    {s.status !== "rejected" && s.status !== "suspended" && (
                      <button disabled={busyId === s.id} onClick={() => setStatus(s.id, "rejected")} className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    )}
                    {s.status === "approved" && (
                      <button disabled={busyId === s.id} onClick={() => setStatus(s.id, "suspended")} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                        Suspend
                      </button>
                    )}
                    {(s.status === "rejected" || s.status === "suspended") && (
                      <button disabled={busyId === s.id} onClick={() => setStatus(s.id, "pending")} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                        Move to pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "products" && (
          <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Seller</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground"><ShoppingBag className="mx-auto mb-2 h-6 w-6" />No products uploaded yet.</td></tr>}
                {products.map((p) => {
                  const img = productImageUrl(p.image_urls?.[0]);
                  return (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 overflow-hidden rounded-md bg-muted">
                            {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.categories?.name ?? "Uncategorised"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{p.sellers?.business_name ?? "—"}</td>
                      <td className="p-3 font-semibold">{formatNaira(p.price_kobo)}</td>
                      <td className="p-3">{p.stock}</td>
                      <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.status}</span></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {p.status !== "active" && <button disabled={busyId === p.id} onClick={() => setProductStatus(p.id, "active")} className="rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground disabled:opacity-50">Publish</button>}
                          {p.status === "active" && <button disabled={busyId === p.id} onClick={() => setProductStatus(p.id, "draft")} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">Unpublish</button>}
                          {p.status !== "archived" && <button disabled={busyId === p.id} onClick={() => setProductStatus(p.id, "archived")} className="rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground disabled:opacity-50">Archive</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-6 overflow-hidden rounded-2xl ring-1 ring-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Buyer</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground"><Package className="mx-auto mb-2 h-6 w-6" />No orders yet.</td></tr>}
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{o.order_number}</td>
                    <td className="p-3">{o.buyer_name}</td>
                    <td className="p-3 font-semibold">{formatNaira(o.total_kobo)}</td>
                    <td className="p-3">
                      <select
                        value={o.status}
                        disabled={busyId === o.id}
                        onChange={(e) => updateOrder(o.id, { status: e.target.value as Order["status"] })}
                        className="rounded-md border border-border bg-card px-2 py-1 text-xs outline-none disabled:opacity-50"
                      >
                        <option value="pending_payment">Pending payment</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        value={o.payment_status}
                        disabled={busyId === o.id}
                        onChange={(e) => updateOrder(o.id, { payment_status: e.target.value as Order["payment_status"] })}
                        className={`rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold outline-none disabled:opacity-50 ${o.payment_status === "paid" ? "text-success" : "text-warning-foreground"}`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="awaiting_confirmation">Awaiting confirmation</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{o.payment_method.replace("_", " ")}</div>
                    </td>
                    <td className="p-3">
                      {o.payment_status !== "paid" && (
                        <button disabled={busyId === o.id} onClick={() => updateOrder(o.id, { payment_status: "paid" })} className="rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground disabled:opacity-50">
                          Mark paid
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function AdminStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

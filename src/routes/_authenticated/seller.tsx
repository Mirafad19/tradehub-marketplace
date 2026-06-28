import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Package, Clock, CheckCircle2, XCircle, Pencil, Trash2, Store } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";
import { productImageUrl } from "@/lib/product-images";
import {
  deleteSellerProduct,
  setSellerProductStatus,
  submitSellerApplication,
  updateSellerOrderItemStatus,
} from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/seller")({
  component: SellerDashboard,
});

type Seller = {
  id: string;
  business_name: string;
  slug: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  description: string | null;
  logo_url: string | null;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  business_address: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  rejected_reason: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price_kobo: number;
  stock: number;
  status: "draft" | "active" | "archived" | "out_of_stock";
  image_urls: string[];
};

type SellerOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  line_total_kobo: number;
  fulfillment_status: "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
};

type SellerOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_kobo: number;
  buyer_name: string;
  buyer_phone: string;
  created_at: string;
  items: SellerOrderItem[];
};

function SellerDashboard() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user]);

  async function refresh() {
    setLoading(true);
    const { data: s } = await supabase
      .from("sellers")
      .select("id,business_name,slug,status,description,logo_url,contact_person,contact_phone,contact_email,business_address,bank_name,bank_account_number,bank_account_name,rejected_reason")
      .eq("user_id", user!.id)
      .maybeSingle();
    setSeller(s as Seller);
    if (s) {
      const [{ data: p }, { data: o }] = await Promise.all([
        supabase
          .from("products")
          .select("id,name,slug,price_kobo,stock,status,image_urls")
          .eq("seller_id", s.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("order_items")
          .select("id,product_name,quantity,line_total_kobo,fulfillment_status,orders(id,order_number,status,payment_status,total_kobo,buyer_name,buyer_phone,created_at)")
          .eq("seller_id", s.id)
          .order("created_at", { ascending: false }),
      ]);
      setProducts((p ?? []) as Product[]);
      const map = new Map<string, SellerOrder>();
      ((o ?? []) as Array<SellerOrderItem & { orders: Omit<SellerOrder, "items"> | null }>).forEach((row) => {
        if (!row.orders) return;
        const existing = map.get(row.orders.id) ?? { ...row.orders, items: [] };
        existing.items.push({
          id: row.id,
          product_name: row.product_name,
          quantity: row.quantity,
          line_total_kobo: row.line_total_kobo,
          fulfillment_status: row.fulfillment_status,
        });
        map.set(row.orders.id, existing);
      });
      setOrders(Array.from(map.values()).sort((a, b) => b.created_at.localeCompare(a.created_at)));
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-muted-foreground">
          Loading dashboard…
        </div>
      </SiteLayout>
    );
  }

  if (!seller) return <SellerApplyForm onCreated={refresh} />;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">{seller.business_name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={seller.status} />
              <span className="text-sm text-muted-foreground">Seller dashboard</span>
            </div>
          </div>
          {seller.status === "approved" && (
            <Link
              to="/seller/products/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" /> Add product
            </Link>
          )}
        </div>

        {seller.status === "pending" && (
          <div className="mb-6 rounded-2xl bg-warning/10 p-5 ring-1 ring-warning/30">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 text-warning-foreground" />
              <div>
                <h3 className="font-semibold">Application pending review</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your application is being reviewed by our admin team. You'll
                  be able to list products as soon as it's approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {seller.status === "rejected" && (
          <div className="mb-6 rounded-2xl bg-destructive/10 p-5 ring-1 ring-destructive/30">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-semibold">Application rejected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {seller.rejected_reason ?? "Please contact support."}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Update your details below and submit again for a fresh review.
                </p>
              </div>
            </div>
          </div>
        )}

        {seller.status === "rejected" && <SellerApplyForm onCreated={refresh} existing={seller} compact />}

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard icon={Package} label="Products" value={products.length} />
          <StatCard icon={CheckCircle2} label="Active listings" value={products.filter((p) => p.status === "active").length} />
          <StatCard icon={Store} label="Orders received" value={orders.length} />
        </div>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold">Your products</h2>
          {products.length === 0 ? (
            <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
              <p className="text-sm text-muted-foreground">
                No products yet. {seller.status === "approved" ? "Add your first product to start selling." : "You'll be able to add products once approved."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl ring-1 ring-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <ProductRow key={p.id} p={p} onChange={refresh} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold">Recent orders</h2>
          {orders.length === 0 ? (
            <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl ring-1 ring-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Buyer</th>
                    <th className="p-3">Items</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Fulfillment</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <OrderRow key={o.id} order={o} onChange={refresh} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
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

function StatusBadge({ status }: { status: Seller["status"] }) {
  const map = {
    pending: { label: "Pending review", cls: "bg-warning/15 text-warning-foreground" },
    approved: { label: "Approved", cls: "bg-success/15 text-success" },
    rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive" },
    suspended: { label: "Suspended", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}

function ProductRow({ p, onChange }: { p: Product; onChange: () => void }) {
  const navigate = useNavigate();
  async function toggle() {
    try {
      const next = p.status === "active" ? "draft" : "active";
      await setSellerProductStatus({ data: { id: p.id, status: next } });
      toast.success(next === "active" ? "Published" : "Unpublished");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update product");
    }
  }
  async function remove() {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      const res = await deleteSellerProduct({ data: { id: p.id } });
      toast.success(res.archived ? "Product archived because it has order history" : "Deleted");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete product");
    }
  }
  return (
    <tr className="border-t border-border">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
            {productImageUrl(p.image_urls?.[0]) ? <img src={productImageUrl(p.image_urls?.[0])!} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <span className="font-medium">{p.name}</span>
        </div>
      </td>
      <td className="p-3 font-semibold">{formatNaira(p.price_kobo)}</td>
      <td className="p-3">{p.stock}</td>
      <td className="p-3">
        <button onClick={toggle} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
          {p.status}
        </button>
      </td>
      <td className="p-3">
        <div className="flex justify-end gap-2">
          <button onClick={() => navigate({ to: "/seller/products/$id", params: { id: p.id } })} className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={remove} className="grid h-8 w-8 place-items-center rounded-md text-destructive hover:bg-muted">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function OrderRow({ order, onChange }: { order: SellerOrder; onChange: () => void }) {
  async function updateItem(order_item_id: string, status: "processing" | "shipped" | "delivered" | "cancelled") {
    try {
      await updateSellerOrderItemStatus({ data: { order_item_id, status } });
      toast.success("Order updated");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update order");
    }
  }

  return (
    <tr className="border-t border-border align-top">
      <td className="p-3">
        <div className="font-mono text-xs">{order.order_number}</div>
        <div className="mt-1 font-semibold">{formatNaira(order.total_kobo)}</div>
        <div className="mt-1 text-xs text-muted-foreground capitalize">Order: {order.status.replace("_", " ")}</div>
      </td>
      <td className="p-3">
        <div className="font-medium">{order.buyer_name}</div>
        <div className="text-xs text-muted-foreground">{order.buyer_phone}</div>
      </td>
      <td className="p-3">
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.id}>
              <div className="font-medium">{item.product_name} × {item.quantity}</div>
              <div className="text-xs text-muted-foreground">{formatNaira(item.line_total_kobo)}</div>
            </li>
          ))}
        </ul>
      </td>
      <td className="p-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${order.payment_status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
          {order.payment_status.replace("_", " ")}
        </span>
      </td>
      <td className="p-3">
        <div className="space-y-2">
          {order.items.map((item) => (
            <select
              key={item.id}
              value={item.fulfillment_status === "paid" || item.fulfillment_status === "pending_payment" ? "processing" : item.fulfillment_status}
              onChange={(e) => updateItem(item.id, e.target.value as "processing" | "shipped" | "delivered" | "cancelled")}
              disabled={item.fulfillment_status === "pending_payment"}
              className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs outline-none disabled:opacity-50"
            >
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          ))}
        </div>
      </td>
      <td className="p-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
    </tr>
  );
}

function SellerApplyForm({ onCreated, existing, compact }: { onCreated: () => void; existing?: Partial<Seller>; compact?: boolean }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    business_name: existing?.business_name ?? "",
    contact_person: existing?.contact_person ?? "",
    contact_phone: existing?.contact_phone ?? "",
    contact_email: existing?.contact_email ?? user?.email ?? "",
    business_address: existing?.business_address ?? "",
    description: existing?.description ?? "",
    bank_name: existing?.bank_name ?? "",
    bank_account_number: existing?.bank_account_number ?? "",
    bank_account_name: existing?.bank_account_name ?? "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const seller = await submitSellerApplication({ data: form });
      toast.success(seller.status === "approved" ? "Seller account ready. You can add products now." : "Application submitted. Admin can approve it from the admin dashboard.");
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  const content = (
      <div className={`mx-auto max-w-2xl px-4 sm:px-6 ${compact ? "py-0" : "py-12"}`}>
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          Seller application
        </span>
        {!compact && <h1 className="mt-4 font-display text-3xl font-semibold">Become a seller</h1>}
        {!compact && (
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us about your shop. Admin approval unlocks product uploads, order management and payouts.
          </p>
        )}

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl bg-card p-6 ring-1 ring-border">
          <h2 className="font-display text-lg font-semibold">Business</h2>
          <Field label="Business / shop name" value={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} required />
          <Field label="Short description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="What do you sell?" />

          <h2 className="pt-3 font-display text-lg font-semibold">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person" value={form.contact_person} onChange={(v) => setForm({ ...form, contact_person: v })} required />
            <Field label="Phone" value={form.contact_phone} onChange={(v) => setForm({ ...form, contact_phone: v })} required type="tel" placeholder="080…" />
            <div className="sm:col-span-2">
              <Field label="Email" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} required type="email" />
            </div>
            <div className="sm:col-span-2">
              <Field label="Business address" value={form.business_address} onChange={(v) => setForm({ ...form, business_address: v })} required />
            </div>
          </div>

          <h2 className="pt-3 font-display text-lg font-semibold">Payout (Nigerian bank)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank name" value={form.bank_name} onChange={(v) => setForm({ ...form, bank_name: v })} placeholder="e.g. GTBank" />
            <Field label="Account number" value={form.bank_account_number} onChange={(v) => setForm({ ...form, bank_account_number: v })} placeholder="10 digits" />
            <div className="sm:col-span-2">
              <Field label="Account name" value={form.bank_account_name} onChange={(v) => setForm({ ...form, bank_account_name: v })} />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
             {busy ? "Submitting…" : compact ? "Resubmit application" : "Submit application"}
          </button>
        </form>
      </div>
  );

  return compact ? content : <SiteLayout>{content}</SiteLayout>;
}

function Field({
  label, value, onChange, type = "text", required, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

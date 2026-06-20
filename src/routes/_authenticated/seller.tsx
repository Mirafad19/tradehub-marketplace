import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Package, Clock, CheckCircle2, XCircle, Pencil, Trash2, Store } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatNaira, slugify } from "@/lib/format";

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
  contact_phone: string;
  rejected_reason: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price_kobo: number;
  stock: number;
  status: "draft" | "active" | "archived";
  image_urls: string[];
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_kobo: number;
  buyer_name: string;
  created_at: string;
};

function SellerDashboard() {
  const { user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user]);

  async function refresh() {
    setLoading(true);
    const { data: s } = await supabase
      .from("sellers")
      .select("id,business_name,slug,status,description,logo_url,contact_phone,rejected_reason")
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
          .select("order_id,orders(id,order_number,status,total_kobo,buyer_name,created_at)")
          .eq("seller_id", s.id),
      ]);
      setProducts((p ?? []) as Product[]);
      const map = new Map<string, Order>();
      ((o ?? []) as Array<{ orders: Order | null }>).forEach((row) => {
        if (row.orders) map.set(row.orders.id, row.orders);
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
              </div>
            </div>
          </div>
        )}

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
                    <th className="p-3">Total</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3 font-mono text-xs">{o.order_number}</td>
                      <td className="p-3">{o.buyer_name}</td>
                      <td className="p-3 font-semibold">{formatNaira(o.total_kobo)}</td>
                      <td className="p-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.status}</span></td>
                      <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
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
    const next = p.status === "active" ? "draft" : "active";
    const { error } = await supabase.from("products").update({ status: next }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(next === "active" ? "Published" : "Unpublished");
    onChange();
  }
  async function remove() {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onChange();
  }
  return (
    <tr className="border-t border-border">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
            {p.image_urls?.[0] ? <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" /> : null}
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

function SellerApplyForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_person: "",
    contact_phone: "",
    contact_email: user?.email ?? "",
    business_address: "",
    description: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const base = slugify(form.business_name);
      const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("sellers").insert({
        ...form,
        slug,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success("Application submitted! Awaiting admin approval.");
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          Seller application
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold">Become a seller</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us about your business. Our admin team reviews applications
          within 24 hours.
        </p>

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
            {busy ? "Submitting…" : "Submit application"}
          </button>
        </form>
      </div>
    </SiteLayout>
  );
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

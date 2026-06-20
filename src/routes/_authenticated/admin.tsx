import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Shield, Package } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatNaira } from "@/lib/format";

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
  status: string;
  created_at: string;
};

type Order = {
  id: string;
  order_number: string;
  buyer_name: string;
  total_kobo: number;
  status: string;
  payment_status: string;
  created_at: string;
};

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"sellers" | "orders">("sellers");
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/" });
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    refresh();
  }, [isAdmin]);

  async function refresh() {
    const [{ data: s }, { data: o }] = await Promise.all([
      supabase.from("sellers").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("id,order_number,buyer_name,total_kobo,status,payment_status,created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    setSellers((s ?? []) as Seller[]);
    setOrders((o ?? []) as Order[]);
  }

  async function setStatus(id: string, status: "approved" | "rejected" | "suspended") {
    const reason = status === "rejected" ? prompt("Reason for rejection?") : null;
    if (status === "approved") {
      const { data: u } = await supabase.from("sellers").select("user_id").eq("id", id).single();
      if (u) {
        await supabase.from("user_roles").insert({ user_id: u.user_id, role: "seller" });
      }
    }
    const { error } =
      status === "approved"
        ? await supabase.from("sellers").update({ status, approved_at: new Date().toISOString() }).eq("id", id)
        : status === "rejected"
        ? await supabase.from("sellers").update({ status, rejected_reason: reason }).eq("id", id)
        : await supabase.from("sellers").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Seller ${status}`);
    refresh();
  }

  if (loading) return <SiteLayout><div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">Loading…</div></SiteLayout>;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand" />
          <h1 className="font-display text-3xl font-semibold">Admin</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Manage sellers and orders for RCCGTradeHUB.</p>

        <div className="mt-6 flex gap-2 border-b border-border">
          {(["sellers", "orders"] as const).map((t) => (
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
                    </dl>
                  </div>
                  <div className="flex gap-2">
                    {s.status !== "approved" && (
                      <button onClick={() => setStatus(s.id, "approved")} className="inline-flex items-center gap-1.5 rounded-full bg-success px-4 py-2 text-xs font-semibold text-success-foreground hover:opacity-90">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                    )}
                    {s.status !== "rejected" && s.status !== "suspended" && (
                      <button onClick={() => setStatus(s.id, "rejected")} className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:opacity-90">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    )}
                    {s.status === "approved" && (
                      <button onClick={() => setStatus(s.id, "suspended")} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-muted">
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground"><Package className="mx-auto mb-2 h-6 w-6" />No orders yet.</td></tr>}
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{o.order_number}</td>
                    <td className="p-3">{o.buyer_name}</td>
                    <td className="p-3 font-semibold">{formatNaira(o.total_kobo)}</td>
                    <td className="p-3 capitalize">{o.status.replace("_", " ")}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.payment_status === "paid" ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
                        {o.payment_status}
                      </span>
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

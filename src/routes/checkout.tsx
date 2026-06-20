import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { useCart, clearCart } from "@/lib/cart-store";
import { formatNaira } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { createOrder } from "@/lib/orders.functions";
import { initPaystackPayment } from "@/lib/paystack.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — RCCGTradeHUB" }] }),
  component: CheckoutPage,
});

const STATES = [
  "Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano", "Kaduna", "Enugu", "Edo",
  "Anambra", "Delta", "Ogun", "Osun", "Ondo", "Ekiti", "Plateau", "Imo",
];

function CheckoutPage() {
  const { items, subtotalKobo } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Lagos",
    notes: "",
    payment: "paystack" as "paystack" | "pay_on_delivery" | "bank_transfer",
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/checkout" } as never });
    if (user) {
      setForm((f) => ({ ...f, email: f.email || user.email || "" }));
    }
  }, [user, loading, navigate]);

  const deliveryKobo = subtotalKobo > 10_000_000 ? 0 : 250_000; // ₦2,500
  const totalKobo = subtotalKobo + deliveryKobo;

  if (items.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
          <Link to="/" className="mt-4 inline-block text-brand hover:underline">
            Continue shopping →
          </Link>
        </div>
      </SiteLayout>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const order = await createOrder({
        data: {
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          buyer_name: form.name,
          buyer_phone: form.phone,
          buyer_email: form.email,
          delivery_address: form.address,
          delivery_city: form.city,
          delivery_state: form.state,
          delivery_notes: form.notes || null,
          payment_method: form.payment,
        },
      });

      if (form.payment === "paystack") {
        const { authorization_url } = await initPaystackPayment({
          data: { order_id: order.id, origin: window.location.origin },
        });
        clearCart();
        window.location.assign(authorization_url);
        return;
      }
      clearCart();
      toast.success(`Order ${order.order_number} placed!`);
      navigate({ to: "/account" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link to="/cart" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </Link>
        <h1 className="mb-8 font-display text-3xl font-semibold">Checkout</h1>

        <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <Section title="Contact">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required type="tel" placeholder="080…" />
                <div className="sm:col-span-2">
                  <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required type="email" />
                </div>
              </div>
            </Section>

            <Section title="Delivery address">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Street address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
                </div>
                <Field label="City / area" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium">State</span>
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    {STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <Field label="Delivery notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
                </div>
              </div>
            </Section>

            <Section title="Payment">
              <div className="space-y-2">
                {[
                  { v: "paystack", t: "Pay now with Paystack", d: "Card, bank transfer, USSD" },
                  { v: "pay_on_delivery", t: "Pay on delivery", d: "Cash or transfer when item arrives" },
                  { v: "bank_transfer", t: "Direct bank transfer", d: "Seller will share account details" },
                ].map((opt) => (
                  <label
                    key={opt.v}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm has-[input:checked]:border-brand has-[input:checked]:bg-brand-soft"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.v}
                      checked={form.payment === opt.v}
                      onChange={() => setForm({ ...form, payment: opt.v as typeof form.payment })}
                      className="mt-0.5 accent-brand"
                    />
                    <div>
                      <div className="font-semibold">{opt.t}</div>
                      <div className="text-xs text-muted-foreground">{opt.d}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Section>
          </div>

          <aside className="h-fit space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Your order</h2>
            <ul className="space-y-2 text-sm">
              {items.map((it) => (
                <li key={it.productId} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {it.name} <span className="text-foreground">× {it.quantity}</span>
                  </span>
                  <span className="font-semibold">{formatNaira(it.priceKobo * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="h-px bg-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatNaira(subtotalKobo)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-semibold">
                {deliveryKobo === 0 ? <span className="text-success">Free</span> : formatNaira(deliveryKobo)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-brand">{formatNaira(totalKobo)}</span>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
            >
              {busy ? "Processing…" : form.payment === "paystack" ? "Pay with Paystack" : "Place order"}
            </button>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Verified church sellers only.
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Free delivery on orders over ₦100,000.
            </div>
          </aside>
        </form>
      </div>
    </SiteLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      {children}
    </div>
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

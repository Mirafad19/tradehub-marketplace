import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Truck, ShieldCheck, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import {
  formatNaira,
  products as allProducts,
} from "@/lib/products";
import { useCart, clearCart } from "@/lib/cart-store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — TradeHub" },
      { name: "description", content: "Securely complete your TradeHub purchase." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items } = useCart();
  const [step, setStep] = useState<"details" | "done">("details");

  const lines = items
    .map((item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const shipping = subtotal > 100000 ? 0 : 2500;
  const total = subtotal + shipping;

  if (lines.length === 0 && step === "details") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Continue shopping →
          </Link>
        </div>
      </SiteLayout>
    );
  }

  if (step === "done") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-success text-success-foreground text-3xl">
            ✓
          </div>
          <h1 className="font-display text-3xl font-semibold">Order placed!</h1>
          <p className="mt-2 text-muted-foreground">
            Your order has been routed to the sellers. You'll receive an SMS
            once it ships. Payment infrastructure (Stripe) goes live in the
            next update.
          </p>
          <Link to="/" className="mt-8 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
            Continue shopping
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link to="/cart" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Back to cart
        </Link>
        <h1 className="mb-8 font-display text-3xl font-semibold">Checkout</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            clearCart();
            setStep("done");
          }}
          className="grid gap-8 lg:grid-cols-[1.6fr_1fr]"
        >
          <div className="space-y-6">
            <Section title="Contact">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" name="name" required />
                <Field label="Phone" name="phone" type="tel" required placeholder="080…" />
                <div className="sm:col-span-2">
                  <Field label="Email" name="email" type="email" required />
                </div>
              </div>
            </Section>

            <Section title="Delivery address">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Street address" name="address" required />
                </div>
                <Field label="City / area" name="city" required placeholder="e.g. Lekki Phase 1" />
                <SelectField
                  label="State"
                  name="state"
                  options={[
                    "Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano",
                    "Kaduna", "Enugu", "Edo", "Anambra", "Delta",
                  ]}
                />
              </div>
            </Section>

            <Section title="Shipping method">
              <ShippingOption
                id="ship-standard"
                title="Standard delivery"
                subtitle="3–5 business days nationwide"
                price={shipping === 0 ? "Free" : formatNaira(2500)}
                defaultChecked
              />
              <ShippingOption
                id="ship-express"
                title="Express delivery"
                subtitle="24 hours in Lagos, 48 hours major cities"
                price={formatNaira(5500)}
              />
            </Section>

            <Section title="Payment">
              <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-foreground ring-1 ring-warning/30">
                Live card payments via Stripe will be activated in the next
                update. For now, place the order to test the flow end-to-end.
              </p>
              <div className="mt-4 space-y-2">
                {["Card (Visa / Mastercard / Verve)", "Bank transfer", "USSD / Mobile money"].map((opt, i) => (
                  <label
                    key={opt}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm has-[input:checked]:border-brand has-[input:checked]:bg-brand-soft"
                  >
                    <input
                      type="radio"
                      name="payment"
                      defaultChecked={i === 0}
                      className="accent-brand"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </Section>
          </div>

          {/* Summary */}
          <aside className="h-fit space-y-4 rounded-2xl bg-surface p-6 ring-1 ring-border lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Your order</h2>
            <ul className="space-y-2 text-sm">
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {product.name} <span className="text-foreground">× {quantity}</span>
                  </span>
                  <span className="font-semibold">{formatNaira(product.price * quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="h-px bg-border" />
            <dl className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatNaira(subtotal)} />
              <Row
                label="Shipping"
                value={shipping === 0 ? <span className="text-success">Free</span> : formatNaira(shipping)}
              />
            </dl>
            <div className="h-px bg-border" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-brand">{formatNaira(total)}</span>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
            >
              Place order
            </button>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              Payment held in escrow until delivery is confirmed.
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
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <select
        name={name}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function ShippingOption({
  id,
  title,
  subtitle,
  price,
  defaultChecked,
}: {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  defaultChecked?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-sm has-[input:checked]:border-brand has-[input:checked]:bg-brand-soft"
    >
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="radio"
          name="shipping"
          defaultChecked={defaultChecked}
          className="accent-brand"
        />
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <span className="font-semibold">{price}</span>
    </label>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

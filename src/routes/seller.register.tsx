import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/seller/register")({
  head: () => ({
    meta: [
      { title: "Apply to sell on TradeHub" },
      { name: "description", content: "Register your business as a TradeHub seller." },
    ],
  }),
  component: SellerRegisterPage,
});

function SellerRegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand text-brand-foreground">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-semibold">Application received</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you. Our team will verify your business within 24 hours and
            email you when your seller dashboard is ready.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Back to marketplace
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link to="/sell" className="text-sm text-muted-foreground hover:text-brand">
          ← Back to seller info
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold">Apply to sell</h1>
        <p className="mt-2 text-muted-foreground">
          Fill in your business details. Verification usually takes under 24 hours.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="mt-8 space-y-5 rounded-2xl bg-card p-6 ring-1 ring-border"
        >
          <Field label="Business name" name="business" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person" name="contact" required />
            <Field label="Phone" name="phone" type="tel" required />
          </div>
          <Field label="Email address" name="email" type="email" required />
          <Field label="Business address" name="address" required />
          <div>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">What do you sell?</span>
              <textarea
                name="categories"
                rows={3}
                required
                placeholder="Briefly describe your product range, brands and price points."
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>
          </div>

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="mt-0.5 accent-brand" />
            I agree to TradeHub's seller policy and confirm my business is
            registered and operating in Nigeria.
          </label>

          <button
            type="submit"
            className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground hover:bg-brand/90"
          >
            Submit application
          </button>
        </form>
      </div>
    </SiteLayout>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

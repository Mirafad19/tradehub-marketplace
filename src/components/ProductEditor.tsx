import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { nairaToKobo } from "@/lib/format";
import { productImageUrl } from "@/lib/product-images";
import { getProductEditorData, saveProduct } from "@/lib/marketplace.functions";

type Cat = { id: string; name: string };
type SellerInfo = { id: string; status: string };

export default function ProductEditor({
  mode,
  productId,
  onDone,
}: {
  mode: "create" | "edit";
  productId?: string;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [cats, setCats] = useState<Cat[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    price_naira: "",
    original_price_naira: "",
    stock: "1",
    status: "active" as "active" | "draft",
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const editorData = await getProductEditorData({ data: { productId: mode === "edit" ? productId : null } });
      setCats((editorData.categories ?? []) as Cat[]);
      const seller = editorData.seller as SellerInfo | null;
      setSellerId(seller?.id ?? null);
      setSellerStatus(seller?.status ?? null);

      if (mode === "edit" && productId) {
        const data = editorData.product;
        if (data) {
          setForm({
            name: data.name,
            description: data.description,
            category_id: data.category_id ?? "",
            price_naira: String(Math.round(data.price_kobo / 100)),
            original_price_naira: data.original_price_kobo
              ? String(Math.round(data.original_price_kobo / 100))
              : "",
            stock: String(data.stock),
            status: data.status === "active" ? "active" : "draft",
          });
          setImages(data.image_urls ?? []);
        }
        setLoading(false);
      }
    })();
  }, [user, mode, productId]);

  async function uploadImage(file: File) {
    if (!user) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setImages((imgs) => [...imgs, path]);
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name}: max 5MB`);
        continue;
      }
      await uploadImage(f);
    }
    e.target.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerId || sellerStatus !== "approved") {
      toast.error("You must be an approved seller first.");
      return;
    }
    if (images.length === 0) {
      toast.error("Add at least one product image.");
      return;
    }
    setBusy(true);
    try {
      const price = parseFloat(form.price_naira);
      const originalPrice = form.original_price_naira ? parseFloat(form.original_price_naira) : null;
      const stock = parseInt(form.stock, 10);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Enter a valid product price");
      if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < 0)) throw new Error("Enter a valid original price");
      if (!Number.isInteger(stock) || stock < 0) throw new Error("Enter a valid stock quantity");

      const payload = {
        id: mode === "edit" ? productId : undefined,
        category_id: form.category_id || null,
        name: form.name,
        description: form.description,
        price_kobo: nairaToKobo(price),
        original_price_kobo: originalPrice === null ? null : nairaToKobo(originalPrice),
        stock,
        status: form.status,
        image_urls: images,
      };
      await saveProduct({ data: payload });
      toast.success(mode === "create" ? "Product created" : "Product updated");
      onDone();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">Loading…</div>
      </SiteLayout>
    );
  }

  if (!sellerId || sellerStatus !== "approved") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h1 className="font-display text-2xl font-semibold">
            {sellerId ? "Seller approval required" : "Apply as a seller first"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sellerId
              ? "Your shop is suspended or not active. Contact the admin to restore product uploads."
              : "Create a seller profile before adding products to RCCGTradeHUB."}
          </p>
          <Link to="/seller" className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
            Go to seller dashboard
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link to="/seller" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="font-display text-3xl font-semibold">
          {mode === "create" ? "Add a product" : "Edit product"}
        </h1>

        <form onSubmit={submit} className="mt-6 space-y-6">
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <h2 className="mb-4 font-display text-lg font-semibold">Photos</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                  {productImageUrl(url) ? <img src={productImageUrl(url)!} alt="" className="h-full w-full object-cover" /> : null}
                  <button
                    type="button"
                    onClick={() => setImages((i) => i.filter((u) => u !== url))}
                    className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-destructive opacity-0 ring-1 ring-border transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface text-xs text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                <Upload className="h-5 w-5" />
                Upload
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
              </label>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Up to 5MB per photo. JPG or PNG.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <h2 className="mb-4 font-display text-lg font-semibold">Details</h2>
            <div className="space-y-4">
              <Field label="Product name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Category</span>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  required
                >
                  <option value="">Choose a category</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={5}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Condition, specs, what makes your product special…"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <h2 className="mb-4 font-display text-lg font-semibold">Price & stock</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (₦)" value={form.price_naira} onChange={(v) => setForm({ ...form, price_naira: v })} required type="number" />
              <Field label="Original price (₦)" value={form.original_price_naira} onChange={(v) => setForm({ ...form, original_price_naira: v })} type="number" placeholder="Optional" />
              <Field label="Stock" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} required type="number" />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.status === "active"}
                onChange={(e) => setForm({ ...form, status: e.target.checked ? "active" : "draft" })}
                className="accent-brand"
              />
              Publish immediately (otherwise saved as draft)
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <Link to="/seller" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
            >
              {busy ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
            </button>
          </div>
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

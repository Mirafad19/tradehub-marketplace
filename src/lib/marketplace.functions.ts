import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { slugify } from "@/lib/format";

type SellerApplicationInput = {
  business_name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  business_address: string;
  description?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
};

type ProductInput = {
  id?: string;
  name: string;
  description: string;
  category_id: string | null;
  price_kobo: number;
  original_price_kobo: number | null;
  stock: number;
  image_urls: string[];
  status: "draft" | "active" | "archived";
};

type OrderStatus = "pending_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
type PaymentStatus = "unpaid" | "awaiting_confirmation" | "paid" | "failed" | "refunded";
type SellerStatus = "pending" | "approved" | "rejected" | "suspended";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function cleanText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function requireText(value: string | null | undefined, label: string) {
  const cleaned = cleanText(value);
  if (!cleaned) throw new Error(`${label} is required`);
  return cleaned;
}

async function userIsAdmin(userId: string) {
  const supabaseAdmin = await adminClient();
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

async function requireAdmin(userId: string) {
  if (!(await userIsAdmin(userId))) throw new Error("Admin access required");
}

async function getApprovedSellerForUser(userId: string) {
  const supabaseAdmin = await adminClient();
  const { data: seller, error } = await supabaseAdmin
    .from("sellers")
    .select("id,status,user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!seller) throw new Error("Apply as a seller first");
  if (seller.status !== "approved") throw new Error("Your seller account must be approved before you can sell");
  return seller;
}

async function uniqueSellerSlug(name: string, existingId?: string) {
  const supabaseAdmin = await adminClient();
  const base = slugify(name) || "seller";
  for (let i = 0; i < 8; i += 1) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await supabaseAdmin
      .from("sellers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === existingId) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function uniqueProductSlug(name: string, existingId?: string) {
  const supabaseAdmin = await adminClient();
  const base = slugify(name) || "product";
  for (let i = 0; i < 8; i += 1) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === existingId) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export const submitSellerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SellerApplicationInput) => input)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const userId = context!.userId;
    const isAdmin = await userIsAdmin(userId);

    const payload = {
      business_name: requireText(data.business_name, "Shop name"),
      contact_person: requireText(data.contact_person, "Contact person"),
      contact_phone: requireText(data.contact_phone, "Phone"),
      contact_email: requireText(data.contact_email, "Email"),
      business_address: requireText(data.business_address, "Business address"),
      description: cleanText(data.description) || null,
      bank_name: cleanText(data.bank_name) || null,
      bank_account_number: cleanText(data.bank_account_number) || null,
      bank_account_name: cleanText(data.bank_account_name) || null,
    };

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("sellers")
      .select("id,status,slug")
      .eq("user_id", userId)
      .maybeSingle();
    if (existingError) throw existingError;

    const autoApprove = isAdmin;
    const status: SellerStatus = autoApprove ? "approved" : existing?.status === "approved" ? "approved" : "pending";
    const slug = await uniqueSellerSlug(payload.business_name, existing?.id);

    const writePayload = {
      ...payload,
      user_id: userId,
      slug,
      status,
      rejected_reason: null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      approved_by: status === "approved" ? userId : null,
    };

    const query = existing
      ? supabaseAdmin.from("sellers").update(writePayload).eq("id", existing.id)
      : supabaseAdmin.from("sellers").insert(writePayload);

    const { data: seller, error } = await query
      .select("id,business_name,slug,status,description,logo_url,contact_phone,rejected_reason")
      .single();
    if (error) throw error;

    if (status === "approved") {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "seller" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    }

    return seller;
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProductInput) => input)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const seller = await getApprovedSellerForUser(context!.userId);

    const name = requireText(data.name, "Product name");
    const description = requireText(data.description, "Description");
    if (!data.category_id) throw new Error("Category is required");
    if (!Number.isFinite(data.price_kobo) || data.price_kobo <= 0) throw new Error("Price must be greater than zero");
    if (data.original_price_kobo !== null && data.original_price_kobo < 0) throw new Error("Original price is invalid");
    if (!Number.isInteger(data.stock) || data.stock < 0) throw new Error("Stock must be zero or more");
    if (!data.image_urls.length) throw new Error("Upload at least one product image");

    const status = data.stock === 0 && data.status === "active" ? "draft" : data.status;

    if (data.id) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("products")
        .select("id,seller_id")
        .eq("id", data.id)
        .single();
      if (existingError) throw existingError;
      if (existing.seller_id !== seller.id) throw new Error("You can only edit your own products");

      const slug = await uniqueProductSlug(name, data.id);
      const { data: product, error } = await supabaseAdmin
        .from("products")
        .update({
          name,
          slug,
          description,
          category_id: data.category_id,
          price_kobo: data.price_kobo,
          original_price_kobo: data.original_price_kobo,
          stock: data.stock,
          image_urls: data.image_urls,
          status,
        })
        .eq("id", data.id)
        .select("id,slug")
        .single();
      if (error) throw error;
      return product;
    }

    const slug = await uniqueProductSlug(name);
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert({
        seller_id: seller.id,
        name,
        slug,
        description,
        category_id: data.category_id,
        price_kobo: data.price_kobo,
        original_price_kobo: data.original_price_kobo,
        stock: data.stock,
        image_urls: data.image_urls,
        status,
      })
      .select("id,slug")
      .single();
    if (error) throw error;
    return product;
  });

export const setSellerProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "draft" | "active" | "archived" }) => input)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const seller = await getApprovedSellerForUser(context!.userId);
    const { data: product, error: getError } = await supabaseAdmin
      .from("products")
      .select("id,seller_id,stock,image_urls")
      .eq("id", data.id)
      .single();
    if (getError) throw getError;
    if (product.seller_id !== seller.id) throw new Error("You can only manage your own products");
    if (data.status === "active") {
      if (product.stock <= 0) throw new Error("Add stock before publishing");
      if (!product.image_urls?.length) throw new Error("Add a product image before publishing");
    }
    const { error } = await supabaseAdmin.from("products").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteSellerProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const seller = await getApprovedSellerForUser(context!.userId);
    const { data: product, error: getError } = await supabaseAdmin
      .from("products")
      .select("id,seller_id")
      .eq("id", data.id)
      .single();
    if (getError) throw getError;
    if (product.seller_id !== seller.id) throw new Error("You can only delete your own products");

    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (!error) return { ok: true, archived: false };

    const { error: archiveError } = await supabaseAdmin.from("products").update({ status: "archived" }).eq("id", data.id);
    if (archiveError) throw archiveError;
    return { ok: true, archived: true };
  });

export const updateSellerOrderItemStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_item_id: string; status: "processing" | "shipped" | "delivered" | "cancelled" }) => input)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const seller = await getApprovedSellerForUser(context!.userId);
    const { data: item, error: itemError } = await supabaseAdmin
      .from("order_items")
      .select("id,order_id,seller_id")
      .eq("id", data.order_item_id)
      .single();
    if (itemError) throw itemError;
    if (item.seller_id !== seller.id) throw new Error("You can only update your own order items");

    const { error } = await supabaseAdmin
      .from("order_items")
      .update({ fulfillment_status: data.status })
      .eq("id", data.order_item_id);
    if (error) throw error;

    const { data: allItems } = await supabaseAdmin
      .from("order_items")
      .select("fulfillment_status")
      .eq("order_id", item.order_id);
    const statuses = (allItems ?? []).map((i) => i.fulfillment_status);
    const nextOrderStatus: OrderStatus = statuses.every((s) => s === "delivered")
      ? "delivered"
      : statuses.some((s) => s === "shipped")
        ? "shipped"
        : statuses.some((s) => s === "cancelled") && statuses.every((s) => s === "cancelled")
          ? "cancelled"
          : "processing";
    await supabaseAdmin.from("orders").update({ status: nextOrderStatus }).eq("id", item.order_id);
    return { ok: true };
  });

export const adminSetSellerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "approved" | "rejected" | "suspended" | "pending"; reason?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const userId = context!.userId;
    await requireAdmin(userId);

    const { data: seller, error: getError } = await supabaseAdmin
      .from("sellers")
      .select("id,user_id")
      .eq("id", data.id)
      .single();
    if (getError) throw getError;

    const update: {
      status: SellerStatus;
      rejected_reason: string | null;
      approved_at?: string;
      approved_by?: string;
    } = {
      status: data.status,
      rejected_reason: data.status === "rejected" ? cleanText(data.reason) || "Application rejected by admin" : null,
    };
    if (data.status === "approved") {
      update.approved_at = new Date().toISOString();
      update.approved_by = userId;
    }

    const { error } = await supabaseAdmin.from("sellers").update(update).eq("id", data.id);
    if (error) throw error;

    if (data.status === "approved") {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: seller.user_id, role: "seller" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    }
    if (data.status === "suspended" || data.status === "rejected") {
      await supabaseAdmin.from("products").update({ status: "draft" }).eq("seller_id", data.id);
    }

    return { ok: true };
  });

export const adminSetProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "draft" | "active" | "archived" }) => input)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    await requireAdmin(context!.userId);
    const { error } = await supabaseAdmin.from("products").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status?: OrderStatus; payment_status?: PaymentStatus }) => input)
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    await requireAdmin(context!.userId);
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("orders")
      .select("id,payment_method,payment_status,status")
      .eq("id", data.id)
      .single();
    if (existingError) throw existingError;

    const update: { status?: OrderStatus; payment_status?: PaymentStatus } = {};
    if (data.status) update.status = data.status;
    if (data.payment_status) update.payment_status = data.payment_status;
    if (data.payment_status === "paid" && existing.status === "pending_payment" && !data.status) {
      update.status = "processing";
    }
    const { error } = await supabaseAdmin.from("orders").update(update).eq("id", data.id);
    if (error) throw error;

    if (data.payment_status === "paid" && existing.payment_status !== "paid" && existing.payment_method === "paystack") {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("product_id,quantity")
        .eq("order_id", data.id);
      for (const it of items ?? []) {
        await supabaseAdmin.rpc("decrement_product_stock", {
          _product_id: it.product_id,
          _quantity: it.quantity,
        });
      }
      await supabaseAdmin
        .from("order_items")
        .update({ fulfillment_status: "processing" })
        .eq("order_id", data.id)
        .eq("fulfillment_status", "pending_payment");
    }
    return { ok: true };
  });
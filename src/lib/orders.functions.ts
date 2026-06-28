import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CartItemIn = { productId: string; quantity: number };
type CreateOrderInput = {
  items: CartItemIn[];
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_notes: string | null;
  payment_method: "paystack" | "pay_on_delivery" | "bank_transfer";
};
type FulfillmentStatus = "pending_payment" | "processing";

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateOrderInput) => input)
  .handler(async ({ data, context }) => {
    const { userId } = context!;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.items.length) throw new Error("Cart is empty");
    if (!data.buyer_name.trim()) throw new Error("Full name is required");
    if (!data.buyer_phone.trim()) throw new Error("Phone number is required");
    if (!data.buyer_email.trim()) throw new Error("Email is required");
    if (!data.delivery_address.trim()) throw new Error("Delivery address is required");
    if (!data.delivery_city.trim()) throw new Error("City / area is required");

    const ids = data.items.map((i) => i.productId);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,seller_id,name,price_kobo,stock,image_urls,status")
      .in("id", ids);
    if (pErr) throw pErr;
    if (!products || products.length !== data.items.length) {
      throw new Error("Some products are no longer available");
    }

    let subtotal = 0;
    const fulfillmentStatus: FulfillmentStatus = data.payment_method === "paystack" ? "pending_payment" : "processing";
    const orderItemsInput = data.items.map((cartItem) => {
      const p = products.find((x) => x.id === cartItem.productId)!;
      if (p.status !== "active") throw new Error(`${p.name} is not available`);
      if (p.stock < cartItem.quantity) throw new Error(`${p.name}: only ${p.stock} in stock`);
      const lineTotal = p.price_kobo * cartItem.quantity;
      subtotal += lineTotal;
      return {
        product_id: p.id,
        seller_id: p.seller_id,
        product_name: p.name,
        product_image_url: p.image_urls?.[0] ?? null,
        unit_price_kobo: p.price_kobo,
        quantity: cartItem.quantity,
        line_total_kobo: lineTotal,
        fulfillment_status: fulfillmentStatus,
      };
    });

    const deliveryFee = subtotal > 10_000_000 ? 0 : 250_000;
    const total = subtotal + deliveryFee;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: userId,
        buyer_name: data.buyer_name.trim(),
        buyer_phone: data.buyer_phone.trim(),
        buyer_email: data.buyer_email.trim(),
        delivery_address: data.delivery_address.trim(),
        delivery_city: data.delivery_city.trim(),
        delivery_state: data.delivery_state,
        delivery_notes: data.delivery_notes,
        subtotal_kobo: subtotal,
        delivery_fee_kobo: deliveryFee,
        total_kobo: total,
        payment_method: data.payment_method,
        payment_status: data.payment_method === "paystack" ? "unpaid" : "awaiting_confirmation",
        status: data.payment_method === "paystack" ? "pending_payment" : "processing",
      })
      .select("id,order_number,total_kobo")
      .single();
    if (oErr) throw oErr;

    const { error: iErr } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemsInput.map((oi) => ({ ...oi, order_id: order.id })));
    if (iErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw iErr;
    }

    if (data.payment_method !== "paystack") {
      for (const it of data.items) {
        await supabaseAdmin.rpc("decrement_product_stock", {
          _product_id: it.productId,
          _quantity: it.quantity,
        });
      }
    }

    return order;
  });

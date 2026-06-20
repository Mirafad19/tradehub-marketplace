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

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CreateOrderInput) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (!data.items.length) throw new Error("Cart is empty");

    const ids = data.items.map((i) => i.productId);
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id,seller_id,name,price_kobo,stock,image_urls,status")
      .in("id", ids);
    if (pErr) throw pErr;
    if (!products || products.length !== data.items.length) {
      throw new Error("Some products are no longer available");
    }

    let subtotal = 0;
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
      };
    });

    const deliveryFee = subtotal > 10_000_000 ? 0 : 250_000;
    const total = subtotal + deliveryFee;

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        buyer_id: userId,
        buyer_name: data.buyer_name,
        buyer_phone: data.buyer_phone,
        buyer_email: data.buyer_email,
        delivery_address: data.delivery_address,
        delivery_city: data.delivery_city,
        delivery_state: data.delivery_state,
        delivery_notes: data.delivery_notes,
        subtotal_kobo: subtotal,
        delivery_fee_kobo: deliveryFee,
        total_kobo: total,
        payment_method: data.payment_method,
        payment_status: "unpaid",
        status: "pending_payment",
      })
      .select("id,order_number,total_kobo")
      .single();
    if (oErr) throw oErr;

    const { error: iErr } = await supabase
      .from("order_items")
      .insert(orderItemsInput.map((oi) => ({ ...oi, order_id: order.id })));
    if (iErr) throw iErr;

    return order;
  });

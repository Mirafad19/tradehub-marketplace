import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const initPaystackPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; origin: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select("id,order_number,total_kobo,buyer_email,buyer_id")
      .eq("id", data.order_id)
      .single();
    if (error) throw error;
    if (order.buyer_id !== userId) throw new Error("Forbidden");

    const secret = process.env.PAYSTACK_KEY;
    if (!secret) throw new Error("Paystack not configured");

    const callbackUrl = `${data.origin}/api/public/paystack/callback?order=${order.id}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: order.buyer_email,
        amount: order.total_kobo,
        currency: "NGN",
        reference: order.order_number,
        callback_url: callbackUrl,
        metadata: { order_id: order.id, order_number: order.order_number },
      }),
    });
    const body = (await res.json()) as {
      status: boolean;
      message: string;
      data?: { authorization_url: string; reference: string };
    };
    if (!body.status || !body.data) {
      throw new Error(body.message || "Failed to initialize payment");
    }

    await supabase
      .from("orders")
      .update({ payment_reference: body.data.reference })
      .eq("id", order.id);

    return {
      authorization_url: body.data.authorization_url,
      reference: body.data.reference,
    };
  });

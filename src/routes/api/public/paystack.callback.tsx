import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/paystack/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
        const orderId = url.searchParams.get("order");
        const origin = url.origin;

        if (!reference || !orderId) {
          return Response.redirect(`${origin}/account`, 302);
        }

        const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_KEY;
        if (!secret) return Response.redirect(`${origin}/account`, 302);

        const res = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          { headers: { Authorization: `Bearer ${secret}` } },
        );
        const body = (await res.json()) as {
          status: boolean;
          data?: { status: string; amount: number; reference: string };
        };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id,total_kobo,payment_status")
          .eq("id", orderId)
          .single();

        const paid = Boolean(
          order &&
          body.status &&
          body.data?.status === "success" &&
          body.data.amount === order.total_kobo,
        );

        if (paid && order && order.payment_status !== "paid") {
          await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "paid",
              status: "processing",
              payment_reference: reference,
            })
            .eq("id", orderId);

          const { data: items } = await supabaseAdmin
            .from("order_items")
            .select("product_id,quantity")
            .eq("order_id", orderId);
          for (const it of items ?? []) {
            await supabaseAdmin.rpc("decrement_product_stock", {
              _product_id: it.product_id,
              _quantity: it.quantity,
            });
          }
          await supabaseAdmin
            .from("order_items")
            .update({ fulfillment_status: "processing" })
            .eq("order_id", orderId)
            .eq("fulfillment_status", "pending_payment");
        }

        return Response.redirect(
          `${origin}/account?payment=${paid ? "success" : "failed"}`,
          302,
        );
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { PRODUCTS_BY_SLUG, EXPRESS_HOURS } from "@/lib/products";

async function getSupabase() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

async function handleCheckoutCompleted(session: any) {
  const sessionId = session.id;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("orders")
    .select("id, category, status")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!existing) {
    console.error("checkout.session.completed for unknown session:", sessionId);
    return;
  }
  if (existing.status !== "pending_payment") {
    console.log("Order already processed:", existing.id);
    return;
  }

  const newStatus = existing.category === "instant" ? "processing" : "paid";

  // Late-bind: a deliver_by-t a tényleges fizetés időpontjától számoljuk.
  const { data: full } = await supabase
    .from("orders")
    .select("product_slug, express")
    .eq("id", existing.id)
    .maybeSingle();
  let deliverBy: string | null = null;
  if (full && existing.category === "delayed") {
    const p = PRODUCTS_BY_SLUG[full.product_slug as string];
    const hours = full.express ? EXPRESS_HOURS : (p?.standardHours ?? 24);
    deliverBy = new Date(Date.now() + hours * 3600_000).toISOString();
  }

  await supabase
    .from("orders")
    .update({
      status: newStatus,
      stripe_payment_intent: paymentIntent,
      paid_at: new Date().toISOString(),
      ...(deliverBy ? { deliver_by: deliverBy } : {}),
    })
    .eq("id", existing.id);

  // Instant rendelésekhez: szerveroldalon is elindítjuk az AI feldolgozást,
  // hogy ne csak a köszönő-oldal polling indítsa el (ha a vásárló bezárja a tabot).
  if (existing.category === "instant") {
    try {
      const { processOrder } = await import("@/lib/payments.functions");
      // Tűzd-és-felejtsd: a vásárló köszönő-oldala újra meghívja idempotensen.
      processOrder({ data: { sessionId } }).catch((e) => console.error("processOrder failed:", e));
    } catch (e) {
      console.error("processOrder import failed:", e);
    }
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const supabase = await getSupabase();
      await supabase
        .from("orders")
        .update({ status: "failed", error_message: event.type })
        .eq("stripe_session_id", (event.data.object as any).id);
      break;
    }
    default:
      console.log("Unhandled payment event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
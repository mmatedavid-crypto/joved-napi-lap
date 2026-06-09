import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { PRODUCTS_BY_SLUG, EXPRESS_HOURS } from "@/lib/products";

async function getSupabase() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

type CheckoutSessionLike = {
  id: string;
  payment_intent?: string | { id?: string } | null;
};

function checkoutObjectId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const id = (raw as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}

async function handleCheckoutCompleted(session: CheckoutSessionLike) {
  const sessionId = session.id;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const supabase = await getSupabase();
  const { data: existing } = await supabase
    .from("orders")
    .select("id, category, status, product_slug, express")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!existing) {
    console.error("checkout.session.completed for unknown session:", sessionId);
    return;
  }
  if (existing.status === "delivered") {
    console.log("Order already delivered:", existing.id);
    return;
  }
  if (
    existing.status !== "pending_payment" &&
    existing.status !== "paid" &&
    existing.status !== "processing"
  ) {
    console.log("Order is not processable from webhook:", existing.id, existing.status);
    return;
  }

  const newStatus = "paid";

  // Late-bind: a deliver_by-t a tényleges fizetés időpontjától számoljuk.
  let deliverBy: string | null = null;
  if (existing.category === "delayed" && existing.status === "pending_payment") {
    const p = PRODUCTS_BY_SLUG[existing.product_slug as string];
    const hours = existing.express ? EXPRESS_HOURS : (p?.standardHours ?? 24);
    deliverBy = new Date(Date.now() + hours * 3600_000).toISOString();
  }

  if (existing.status === "pending_payment") {
    await supabase
      .from("orders")
      .update({
        status: newStatus,
        stripe_payment_intent: paymentIntent,
        paid_at: new Date().toISOString(),
        payment_rechecked_at: new Date().toISOString(),
        ...(deliverBy ? { deliver_by: deliverBy } : {}),
      })
      .eq("id", existing.id)
      .eq("status", "pending_payment");
  }

  // Fizetett rendelésekhez: szerveroldalon is elindítjuk az olvasat feldolgozását,
  // hogy ne csak a köszönő-oldal polling indítsa el (ha a vásárló bezárja a tabot).
  try {
    const { processPaidOrderBySession } = await import("@/lib/orderProcessing.server");
    const result = await processPaidOrderBySession(sessionId);
    if (!result.ok) console.error("processPaidOrderBySession failed:", result.error);
  } catch (e) {
    console.error("processPaidOrderBySession failed:", e);
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutCompleted(event.data.object as CheckoutSessionLike);
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const supabase = await getSupabase();
      await supabase
        .from("orders")
        .update({ status: "failed", error_message: event.type })
        .eq("stripe_session_id", checkoutObjectId(event.data.object) ?? "")
        .eq("status", "pending_payment");
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

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any) {
  const sessionId = session.id;
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const supabase = getSupabase();
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
  await supabase
    .from("orders")
    .update({
      status: newStatus,
      stripe_payment_intent: paymentIntent,
      paid_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
    case "transaction.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
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
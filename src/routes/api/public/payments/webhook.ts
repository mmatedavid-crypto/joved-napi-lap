import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { PRODUCTS_BY_SLUG, EXPRESS_HOURS } from "@/lib/products";
import type { Database } from "@/integrations/supabase/types";
import { notifyAdmin } from "@/lib/telegram.server";

async function getSupabase() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

type CheckoutSessionLike = {
  id: string;
  payment_intent?: string | { id?: string } | null;
};
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type PaymentFailureCode = "stripe_async_payment_failed" | "stripe_checkout_expired";

function redactStripeId(value: string | null | undefined): string {
  if (!value) return "***";
  if (value.length <= 12) return `${value.slice(0, 4)}***`;
  return `${value.slice(0, 8)}***${value.slice(-4)}`;
}

function redactOrderId(value: string | null | undefined): string {
  if (!value) return "***";
  if (value.length <= 12) return `${value.slice(0, 4)}***`;
  return `${value.slice(0, 8)}***${value.slice(-4)}`;
}

function checkoutObjectId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const id = (raw as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}

function paymentFailureCode(eventType: string): PaymentFailureCode {
  return eventType === "checkout.session.expired"
    ? "stripe_checkout_expired"
    : "stripe_async_payment_failed";
}

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === "42703" ||
    /column .* does not exist/i.test(err.message ?? "") ||
    /Could not find .* column/i.test(err.message ?? "")
  );
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
    .select("id, category, status, product_slug, express, guest_email, price_huf, product_name")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!existing) {
    console.error("checkout.session.completed for unknown session", {
      session_id_redacted: redactStripeId(sessionId),
    });
    return;
  }
  if (existing.status === "delivered") {
    console.log("Order already delivered", {
      order_id_redacted: redactOrderId(existing.id),
    });
    return;
  }
  if (
    existing.status !== "pending_payment" &&
    existing.status !== "paid" &&
    existing.status !== "processing"
  ) {
    console.log("Order is not processable from webhook", {
      order_id_redacted: redactOrderId(existing.id),
      status: existing.status,
    });
    return;
  }

  const newStatus = "paid" as const;

  // Late-bind: a deliver_by-t a tényleges fizetés időpontjától számoljuk.
  let deliverBy: string | null = null;
  if (existing.category === "delayed" && existing.status === "pending_payment") {
    const p = PRODUCTS_BY_SLUG[existing.product_slug as string];
    const hours = existing.express ? EXPRESS_HOURS : (p?.standardHours ?? 24);
    deliverBy = new Date(Date.now() + hours * 3600_000).toISOString();
  }

  if (existing.status === "pending_payment") {
    const paidUpdate: OrderUpdate = {
      status: newStatus,
      stripe_payment_intent: paymentIntent,
      paid_at: new Date().toISOString(),
      payment_rechecked_at: new Date().toISOString(),
      ...(deliverBy ? { deliver_by: deliverBy } : {}),
    };
    const paidResult = await supabase
      .from("orders")
      .update(paidUpdate)
      .eq("id", existing.id)
      .eq("status", "pending_payment");

    if (isMissingColumnError(paidResult.error)) {
      const {
        stripe_payment_intent: _stripePaymentIntent,
        payment_rechecked_at: _paymentRecheckedAt,
        ...fallbackPaidUpdate
      } = paidUpdate;
      const legacyPaidUpdate: OrderUpdate = fallbackPaidUpdate;
      console.warn("orders reconciliation columns unavailable in webhook; using paid fallback");
      await supabase
        .from("orders")
        .update(legacyPaidUpdate)
        .eq("id", existing.id)
        .eq("status", "pending_payment");
    } else if (paidResult.error) {
      throw paidResult.error;
    }
  }

  // Fizetett rendelésekhez: szerveroldalon is elindítjuk az olvasat feldolgozását,
  // hogy ne csak a köszönő-oldal polling indítsa el (ha a vásárló bezárja a tabot).
  try {
    const { processPaidOrderBySession } = await import("@/lib/orderProcessing.server");
    const result = await processPaidOrderBySession(sessionId);
    if (!result.ok) {
      console.error("processPaidOrderBySession failed", {
        session_id_redacted: redactStripeId(sessionId),
        error_code: "paid_order_processing_failed",
      });
      void notifyAdmin("error", "Olvasat feldolgozás hibára futott", {
        order_id: existing.id,
        product: existing.product_slug,
        email: existing.guest_email ?? undefined,
      });
    }
  } catch {
    console.error("processPaidOrderBySession failed", {
      session_id_redacted: redactStripeId(sessionId),
      error_code: "paid_order_processing_exception",
    });
    void notifyAdmin("error", "Olvasat feldolgozás kivétel", {
      order_id: existing.id,
      product: existing.product_slug,
    });
  }

  void notifyAdmin("success", "Új fizetett rendelés", {
    termék: existing.product_name ?? PRODUCTS_BY_SLUG[existing.product_slug ?? ""]?.name ?? existing.product_slug,
    összeg: existing.price_huf != null ? `${existing.price_huf} Ft` : undefined,
    email: existing.guest_email ?? undefined,
    express: existing.express ? "igen" : "nem",
  });
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
      const sessId = checkoutObjectId(event.data.object) ?? "";
      await supabase
        .from("orders")
        .update({ status: "failed", error_message: paymentFailureCode(event.type) })
        .eq("stripe_session_id", sessId)
        .eq("status", "pending_payment");
      void notifyAdmin("warn", "Fizetés meghiúsult / lejárt", {
        reason: paymentFailureCode(event.type),
        session_id: redactStripeId(sessId),
      });
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
        } catch {
          console.error("Webhook error", {
            environment: rawEnv,
            error_code: "payment_webhook_failed",
          });
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});

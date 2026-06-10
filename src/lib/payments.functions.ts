import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type Stripe from "stripe";
import type { StripeEnv } from "@/lib/stripe.server";
import {
  PRODUCTS_BY_SLUG,
  EXPRESS_PRICE_ID,
  EXPRESS_PRICE_HUF,
  EXPRESS_HOURS,
} from "@/lib/products";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type OrderForPaymentRecheck = {
  id: string;
  status: string;
  category: string;
  product_slug: string;
  express: boolean;
  stripe_session_id?: string | null;
  stripe_environment?: string | null;
  stripe_payment_intent?: string | null;
  payment_rechecked_at?: string | null;
};

const CHECKOUT_GENERIC_ERROR =
  "Most nem sikerült elindítani a fizetést. Kérlek próbáld újra pár perc múlva.";
const PAYMENT_RECHECK_INTERVAL_MS = 15_000;
const ORDER_SELECT_BASE =
  "id, product_slug, product_name, category, price_huf, express, status, response_payload, deliver_by, delivered_at, created_at, guest_email, source_route";
const ORDER_SELECT_WITH_RECONCILIATION = `${ORDER_SELECT_BASE}, stripe_environment, stripe_payment_intent, payment_rechecked_at`;
const ORDER_SELECT_PROFILE_WITH_RECONCILIATION = `${ORDER_SELECT_BASE}, stripe_session_id, stripe_environment, stripe_payment_intent, payment_rechecked_at`;

function redactStripeId(value: string | null | undefined): string {
  if (!value) return "***";
  if (value.length <= 12) return `${value.slice(0, 4)}***`;
  return `${value.slice(0, 8)}***${value.slice(-4)}`;
}

async function resolveOrCreateCustomer(
  stripe: Stripe,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Érvénytelen felhasználói azonosító");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

interface CreateCheckoutInput {
  productSlug: string;
  express: boolean;
  customerEmail: string;
  userId?: string;
  inputPayload?: Record<string, unknown>;
  sourceRoute?: string;
  returnUrl: string;
  environment: StripeEnv;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: CreateCheckoutInput) => {
    if (!PRODUCTS_BY_SLUG[data.productSlug]) throw new Error("Ismeretlen termék");
    if (!data.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
      throw new Error("Érvénytelen email cím");
    }
    if (data.userId && !/^[a-zA-Z0-9_-]+$/.test(data.userId)) {
      throw new Error("Érvénytelen felhasználói azonosító");
    }
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const product = PRODUCTS_BY_SLUG[data.productSlug];
      const { createStripeClient } = await import("@/lib/stripe.server");
      const stripe = createStripeClient(data.environment);

      const lookupKeys = [product.priceId];
      const wantsExpress = data.express && product.category === "delayed";
      if (wantsExpress) lookupKeys.push(EXPRESS_PRICE_ID);

      const prices = await stripe.prices.list({ lookup_keys: lookupKeys, limit: 5 });
      const mainPrice = prices.data.find((p) => p.lookup_key === product.priceId);
      if (!mainPrice) throw new Error("A termék ára nem található");
      const expressPrice = wantsExpress
        ? prices.data.find((p) => p.lookup_key === EXPRESS_PRICE_ID)
        : undefined;
      if (wantsExpress && !expressPrice) throw new Error("Az express ár nem található");

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: data.customerEmail,
        userId: data.userId,
      });

      const totalHuf = product.priceHuf + (wantsExpress ? EXPRESS_PRICE_HUF : 0);
      const hours = wantsExpress ? EXPRESS_HOURS : (product.standardHours ?? 0);
      const deliverBy =
        product.category === "delayed"
          ? new Date(Date.now() + hours * 3600_000).toISOString()
          : null;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          { price: mainPrice.id, quantity: 1 },
          ...(expressPrice ? [{ price: expressPrice.id, quantity: 1 }] : []),
        ],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        payment_intent_data: {
          description: wantsExpress ? `${product.name} + Express` : product.name,
        },
        metadata: {
          product_slug: data.productSlug,
          category: product.category,
          express: wantsExpress ? "true" : "false",
          customer_email: data.customerEmail,
          ...(data.userId && { user_id: data.userId }),
        },
      });

      if (!session.client_secret) {
        throw new Error("A fizetési munkamenet nem indítható el. Próbáld újra később.");
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const orderInsert = {
        user_id: data.userId ?? null,
        guest_email: data.userId ? null : data.customerEmail,
        product_slug: data.productSlug,
        product_name: product.name,
        category: product.category,
        price_huf: totalHuf,
        express: wantsExpress,
        status: "pending_payment",
        stripe_session_id: session.id,
        stripe_environment: data.environment,
        input_payload: (data.inputPayload ?? null) as never,
        source_route: data.sourceRoute ?? null,
        deliver_by: deliverBy,
      };
      const orderResult = await insertOrderWithMigrationFallback(supabaseAdmin, orderInsert);
      const orderError = orderResult.error;

      if (orderError) {
        console.error("createCheckoutSession order insert failed:", {
          session_id_redacted: redactStripeId(session.id),
          productSlug: data.productSlug,
          error: orderError.message,
        });
        await expireUnusableCheckoutSession(stripe, session.id);
        throw new Error("Most nem sikerült előkészíteni a rendelést. Próbáld újra később.");
      }

      return { clientSecret: session.client_secret };
    } catch (error) {
      console.error("createCheckoutSession error:", error);
      return { error: safeCheckoutErrorMessage(error) };
    }
  });

async function insertOrderWithMigrationFallback(
  supabaseAdmin: (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"],
  orderInsert: Record<string, unknown>,
) {
  const result = await supabaseAdmin
    .from("orders")
    .insert(orderInsert as never)
    .select("id")
    .single();
  if (!isMissingColumnError(result.error)) return result;

  const {
    stripe_environment: _stripeEnvironment,
    payment_rechecked_at: _paymentRecheckedAt,
    ...safeInsert
  } = orderInsert;
  console.warn(
    "orders reconciliation columns unavailable; inserting order without fallback fields",
  );
  return supabaseAdmin
    .from("orders")
    .insert(safeInsert as never)
    .select("id")
    .single();
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

function safeCheckoutErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const allowedMessages = [
    "Ismeretlen termék",
    "Érvénytelen email cím",
    "Érvénytelen felhasználói azonosító",
    "A termék ára nem található",
    "Az express ár nem található",
    "A fizetési munkamenet nem indítható el. Próbáld újra később.",
    "Most nem sikerült előkészíteni a rendelést. Próbáld újra később.",
  ];

  return allowedMessages.includes(message) ? message : CHECKOUT_GENERIC_ERROR;
}

async function expireUnusableCheckoutSession(stripe: Stripe, sessionId: string): Promise<void> {
  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    console.warn("Could not expire checkout session without order:", error);
  }
}

export const getOrderBySession = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string }) => {
    if (!data.sessionId || typeof data.sessionId !== "string")
      throw new Error("Hiányzó session ID");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const orderResultWithReconciliation = await supabaseAdmin
      .from("orders")
      .select(ORDER_SELECT_WITH_RECONCILIATION)
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();

    if (isMissingColumnError(orderResultWithReconciliation.error)) {
      console.warn(
        "orders reconciliation columns unavailable; reading order without fallback fields",
      );
      const fallbackOrderResult = await supabaseAdmin
        .from("orders")
        .select(ORDER_SELECT_BASE)
        .eq("stripe_session_id", data.sessionId)
        .maybeSingle();
      if (fallbackOrderResult.error) throw fallbackOrderResult.error;

      const order = await reconcilePendingPayment(fallbackOrderResult.data, data.sessionId);
      return { order };
    }

    if (orderResultWithReconciliation.error) throw orderResultWithReconciliation.error;

    const order = await reconcilePendingPayment(orderResultWithReconciliation.data, data.sessionId);
    return { order };
  });

async function reconcilePendingPayment<T extends OrderForPaymentRecheck | null>(
  order: T,
  sessionId: string,
): Promise<T> {
  if (!order || order.status !== "pending_payment") return order;
  const env = order.stripe_environment;
  if (env !== "sandbox" && env !== "live") return order;

  const lastRecheck = order.payment_rechecked_at
    ? new Date(order.payment_rechecked_at).getTime()
    : 0;
  if (Number.isFinite(lastRecheck) && Date.now() - lastRecheck < PAYMENT_RECHECK_INTERVAL_MS) {
    return order;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const recheckedAt = new Date().toISOString();
  await supabaseAdmin
    .from("orders")
    .update({ payment_rechecked_at: recheckedAt })
    .eq("id", order.id)
    .eq("status", "pending_payment");

  try {
    const { createStripeClient } = await import("@/lib/stripe.server");
    const stripe = createStripeClient(env);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? order.stripe_payment_intent ?? null);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return { ...order, payment_rechecked_at: recheckedAt };
    }

    let deliverBy: string | null = null;
    if (order.category === "delayed") {
      const product = PRODUCTS_BY_SLUG[order.product_slug];
      const hours = order.express ? EXPRESS_HOURS : (product?.standardHours ?? 24);
      deliverBy = new Date(Date.now() + hours * 3600_000).toISOString();
    }

    const { data: paidOrder } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        stripe_payment_intent: paymentIntent,
        paid_at: new Date().toISOString(),
        payment_rechecked_at: recheckedAt,
        ...(deliverBy ? { deliver_by: deliverBy } : {}),
      })
      .eq("id", order.id)
      .eq("status", "pending_payment")
      .select(
        "id, product_slug, product_name, category, price_huf, express, status, response_payload, deliver_by, delivered_at, created_at, guest_email, source_route, stripe_environment, stripe_payment_intent, payment_rechecked_at",
      )
      .maybeSingle();

    if (paidOrder) {
      try {
        const { processPaidOrderBySession } = await import("@/lib/orderProcessing.server");
        await processPaidOrderBySession(sessionId);
      } catch (error) {
        console.warn("order reconciliation processing failed:", error);
      }
      return paidOrder as unknown as T;
    }
  } catch (error) {
    console.warn("checkout payment reconciliation failed:", error);
  }

  return { ...order, payment_rechecked_at: recheckedAt };
}

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orderResultWithReconciliation = await context.supabase
      .from("orders")
      .select(ORDER_SELECT_PROFILE_WITH_RECONCILIATION)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    let orders: OrderForPaymentRecheck[] = [];

    if (isMissingColumnError(orderResultWithReconciliation.error)) {
      console.warn(
        "orders reconciliation columns unavailable; reading profile orders without recheck",
      );
      const fallbackOrderResult = await context.supabase
        .from("orders")
        .select(`${ORDER_SELECT_BASE}, stripe_session_id`)
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (fallbackOrderResult.error) throw fallbackOrderResult.error;
      orders = fallbackOrderResult.data ?? [];
    } else {
      if (orderResultWithReconciliation.error) throw orderResultWithReconciliation.error;
      orders = orderResultWithReconciliation.data ?? [];
    }

    const reconciled = await Promise.all(
      orders.map(async (order) => {
        const sessionId =
          typeof order.stripe_session_id === "string" ? order.stripe_session_id : "";
        if (!sessionId) return order;
        return reconcilePendingPayment(order, sessionId);
      }),
    );

    return { orders: reconciled.map(stripPrivateOrderFields) };
  });

export const processMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) => {
    if (!data.orderId || typeof data.orderId !== "string") throw new Error("Hiányzó rendelés ID");
    return data;
  })
  .handler(async ({ context, data }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, user_id, status, stripe_session_id")
      .eq("id", data.orderId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw error;
    if (!order?.stripe_session_id) return { ok: false, error: "Rendelés nem található" };
    if (order.status !== "paid" && order.status !== "processing") {
      return { ok: false, error: "Még nincs feldolgozható állapotban" };
    }

    const { processPaidOrderBySession } = await import("@/lib/orderProcessing.server");
    return processPaidOrderBySession(order.stripe_session_id);
  });

function stripPrivateOrderFields<T extends Record<string, unknown>>(order: T) {
  const {
    stripe_session_id: _stripeSessionId,
    stripe_environment: _stripeEnvironment,
    stripe_payment_intent: _stripePaymentIntent,
    payment_rechecked_at: _paymentRecheckedAt,
    ...publicOrder
  } = order;
  return publicOrder;
}

// Generálja a fizetett olvasat tartalmát és megjelöli a rendelést "delivered"-ként.
// Idempotens: ha már delivered, nem fut újra.
export const processOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string }) => {
    if (!data.sessionId || typeof data.sessionId !== "string")
      throw new Error("Hiányzó session ID");
    return data;
  })
  .handler(async ({ data }) => {
    const { processPaidOrderBySession } = await import("@/lib/orderProcessing.server");
    return processPaidOrderBySession(data.sessionId);
  });

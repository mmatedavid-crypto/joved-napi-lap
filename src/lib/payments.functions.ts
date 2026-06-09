import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import {
  PRODUCTS_BY_SLUG,
  EXPRESS_PRICE_ID,
  EXPRESS_PRICE_HUF,
  EXPRESS_HOURS,
} from "@/lib/products";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
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
    if (data.userId && !/^[a-zA-Z0-9_-]+$/.test(data.userId)) throw new Error("Invalid userId");
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const product = PRODUCTS_BY_SLUG[data.productSlug];
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
      const { error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: data.userId ?? null,
          guest_email: data.userId ? null : data.customerEmail,
          product_slug: data.productSlug,
          product_name: product.name,
          category: product.category,
          price_huf: totalHuf,
          express: wantsExpress,
          status: "pending_payment",
          stripe_session_id: session.id,
          input_payload: (data.inputPayload ?? null) as never,
          source_route: data.sourceRoute ?? null,
          deliver_by: deliverBy,
        })
        .select("id")
        .single();

      if (orderError) {
        console.error("createCheckoutSession order insert failed:", {
          sessionId: session.id,
          productSlug: data.productSlug,
          error: orderError.message,
        });
        await expireUnusableCheckoutSession(stripe, session.id);
        throw new Error("Most nem sikerült előkészíteni a rendelést. Próbáld újra később.");
      }

      return { clientSecret: session.client_secret };
    } catch (error) {
      console.error("createCheckoutSession error:", error);
      return { error: getStripeErrorMessage(error) };
    }
  });

async function expireUnusableCheckoutSession(
  stripe: ReturnType<typeof createStripeClient>,
  sessionId: string,
): Promise<void> {
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
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "id, product_slug, product_name, category, price_huf, express, status, response_payload, deliver_by, delivered_at, created_at, guest_email",
      )
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();
    return { order };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, product_slug, product_name, category, price_huf, express, status, response_payload, deliver_by, delivered_at, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return { orders: data ?? [] };
  });

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

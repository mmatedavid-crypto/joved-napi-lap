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

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("orders").insert({
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
      });

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      console.error("createCheckoutSession error:", error);
      return { error: getStripeErrorMessage(error) };
    }
  });

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "id, product_slug, product_name, category, status, input_payload, user_id, guest_email",
      )
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();
    if (!order) return { ok: false, error: "Rendelés nem található" };
    if (order.status === "delivered") return { ok: true, alreadyDone: true };
    if (order.status !== "paid" && order.status !== "processing") {
      return { ok: false, error: "Még nincs kifizetve" };
    }

    // Lock as processing
    await supabaseAdmin.from("orders").update({ status: "processing" }).eq("id", order.id);

    try {
      const memoryContext = order.user_id
        ? await loadPaidMemoryContext(order.user_id, order.product_slug, order.input_payload)
        : "";
      const { generatePaidOrderReading } = await import("./paidReadings.server");
      const reading = await generatePaidOrderReading({
        productSlug: order.product_slug,
        productName: order.product_name,
        inputPayload: withMemoryContext(order.input_payload, memoryContext),
      });

      await supabaseAdmin
        .from("orders")
        .update({
          status: "delivered",
          response_payload: reading as never,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (order.user_id) {
        try {
          await supabaseAdmin.from("reading_memories").insert({
            user_id: order.user_id,
            reading_type: "paid",
            topic: order.product_name,
            question: memoryQuestion(order.input_payload),
            situation: memorySituation(order.input_payload),
            source_route: null,
            title: reading.title,
            summary: reading.body.slice(0, 700),
            one_sentence: reading.reading?.oneSentence ?? reading.title,
            anchors: memoryAnchors(order.product_slug, order.input_payload),
            metadata: {
              product_slug: order.product_slug,
              order_id: order.id,
            } as never,
          });
        } catch (memoryError) {
          console.warn("paid reading memory save failed:", memoryError);
        }
      }

      return { ok: true, response: reading };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed", error_message: message })
        .eq("id", order.id);
      return { ok: false, error: message };
    }
  });

function memoryQuestion(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const value = data.q ?? data.question;
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 500) : null;
}

function memorySituation(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const value = data.sit ?? data.status ?? data.cat ?? data.category;
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 160) : null;
}

function memoryAnchors(productSlug: string, payload: unknown): string[] {
  const anchors = [productSlug];
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    for (const key of ["sit", "status", "cat", "category", "sign", "number", "crystal", "title"]) {
      const value = data[key];
      if (typeof value === "string" && value.trim()) anchors.push(value.trim().slice(0, 80));
    }
    const cards = data.cards;
    if (Array.isArray(cards)) {
      for (const card of cards) {
        if (typeof card === "string" && card.trim()) anchors.push(card.trim().slice(0, 80));
      }
    }
  }
  return Array.from(new Set(anchors)).slice(0, 12);
}

function withMemoryContext(payload: unknown, memoryContext: string): unknown {
  if (!memoryContext) return payload;
  if (!payload || typeof payload !== "object") return { memoryContext };
  return { ...(payload as Record<string, unknown>), memoryContext };
}

async function loadPaidMemoryContext(
  userId: string,
  productSlug: string,
  payload: unknown,
): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const anchors = memoryAnchors(productSlug, payload);
    const { data } = await supabaseAdmin
      .from("reading_memories")
      .select(
        "reading_type, topic, question, situation, title, summary, one_sentence, anchors, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6);
    if (!data?.length) return "";
    const lines = data.map((memory) => {
      const label = memory.topic || memory.situation || memory.reading_type;
      return `${label}: ${memory.one_sentence || memory.summary}`;
    });
    const anchorLine = anchors.length ? `Aktuális kulcsok: ${anchors.join(", ")}` : "";
    return ["Korábbi felhasználói minták a prémium olvasathoz:", anchorLine, ...lines]
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
}

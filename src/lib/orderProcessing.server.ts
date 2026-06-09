type PaidOrderReading = {
  title: string;
  body: string;
  reading?: {
    oneSentence?: string;
  };
};

type ProcessOrderResult =
  | { ok: true; response?: PaidOrderReading; alreadyDone?: true; processing?: true }
  | { ok: false; error: string };

const PROCESSING_RETRY_AFTER_MS = 15 * 60 * 1000;

export async function processPaidOrderBySession(sessionId: string): Promise<ProcessOrderResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "id, product_slug, product_name, category, status, input_payload, user_id, guest_email, stripe_session_id, response_payload, updated_at",
    )
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  if (!order) return { ok: false, error: "Rendelés nem található" };
  if (order.status === "delivered") {
    const deliveredReading = normalizeDeliveredReading(order.response_payload);
    if (deliveredReading) {
      await queueDeliveredEmail({
        id: order.id,
        productName: order.product_name,
        userId: order.user_id,
        guestEmail: order.guest_email,
        stripeSessionId: order.stripe_session_id,
        reading: deliveredReading,
      });
    }
    return { ok: true, alreadyDone: true };
  }
  if (order.status !== "paid" && order.status !== "processing") {
    return { ok: false, error: "Még nincs kifizetve" };
  }

  const claimed = await claimOrderForProcessing(order);
  if (!claimed) return { ok: true, processing: true };

  try {
    const memoryContext = order.user_id
      ? await loadPaidMemoryContext(order.user_id, order.product_slug, order.input_payload)
      : "";
    const { generatePaidOrderReading } = await import("@/lib/paidReadings.server");
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

    await queueDeliveredEmail({
      id: order.id,
      productName: order.product_name,
      userId: order.user_id,
      guestEmail: order.guest_email,
      stripeSessionId: order.stripe_session_id,
      reading,
    });

    return { ok: true, response: reading };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed", error_message: message })
      .eq("id", order.id);
    return { ok: false, error: message };
  }
}

async function claimOrderForProcessing(order: {
  id: string;
  status: string;
  updated_at: string;
}): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();

  if (order.status === "processing") {
    const lastTouched = new Date(order.updated_at).getTime();
    if (Number.isFinite(lastTouched) && Date.now() - lastTouched < PROCESSING_RETRY_AFTER_MS) {
      return false;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "processing",
      error_message: null,
      updated_at: nowIso,
    })
    .eq("id", order.id)
    .eq("status", order.status)
    .eq("updated_at", order.updated_at)
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("order processing claim failed:", error.message);
    return false;
  }

  return Boolean(data);
}

function normalizeDeliveredReading(payload: unknown): { title?: string; body?: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title : undefined;
  const body = typeof data.body === "string" ? data.body : undefined;
  if (!title && !body) return null;
  return { title, body };
}

async function queueDeliveredEmail(order: {
  id: string;
  productName: string;
  userId: string | null;
  guestEmail: string | null;
  stripeSessionId: string | null;
  reading: { title?: string; body?: string };
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  try {
    const claimTime = new Date().toISOString();
    const { data: emailClaim, error: stateError } = await supabaseAdmin
      .from("orders")
      .update({
        delivery_email_queued_at: claimTime,
        delivery_email_error: null,
      })
      .eq("id", order.id)
      .is("delivery_email_queued_at", null)
      .select("id")
      .maybeSingle();

    if (stateError) {
      console.warn("order delivery email state unavailable:", stateError.message);
      return;
    }
    if (!emailClaim) return;

    const { enqueueTransactionalEmail, resolveOrderRecipientEmail } =
      await import("@/lib/email/sendTransactional.server");
    const recipientEmail = await resolveOrderRecipientEmail({
      user_id: order.userId,
      guest_email: order.guestEmail,
    });

    if (!recipientEmail) {
      await supabaseAdmin
        .from("orders")
        .update({
          delivery_email_queued_at: null,
          delivery_email_error: "missing_recipient_email",
        })
        .eq("id", order.id);
      return;
    }

    const result = await enqueueTransactionalEmail({
      templateName: "order-delivered",
      recipientEmail,
      idempotencyKey: `order-delivered:${order.id}`,
      templateData: {
        productName: order.productName,
        title: order.reading.title,
        body: order.reading.body,
        orderId: order.id,
        accessUrl: order.stripeSessionId
          ? `https://jovod.hu/koszonjuk?session_id=${encodeURIComponent(order.stripeSessionId)}`
          : undefined,
      },
    });

    if (!result.ok) {
      await supabaseAdmin
        .from("orders")
        .update({
          delivery_email_queued_at: null,
          delivery_email_error: result.error.slice(0, 500),
        })
        .eq("id", order.id);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("order delivered email queue failed:", message);
    try {
      await supabaseAdmin
        .from("orders")
        .update({
          delivery_email_queued_at: null,
          delivery_email_error: message.slice(0, 500),
        })
        .eq("id", order.id);
    } catch (updateError) {
      console.warn("order delivery email error state failed:", updateError);
    }
  }
}

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

type PaidMemoryRow = {
  reading_type: string;
  topic: string | null;
  question: string | null;
  situation: string | null;
  title: string | null;
  summary: string;
  one_sentence: string | null;
  anchors: string[];
  created_at: string;
};

function recentPaidMemories(memories: PaidMemoryRow[], days: number): PaidMemoryRow[] {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return memories.filter((memory) => new Date(memory.created_at).getTime() >= since);
}

function topPaidAnchors(memories: PaidMemoryRow[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const anchor of memories.flatMap((memory) => memory.anchors ?? [])) {
    const clean = anchor.trim();
    if (clean.length > 1) counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([anchor]) => anchor);
}

function buildPaidMemoryArc(memories: PaidMemoryRow[]): string[] {
  const weekly = recentPaidMemories(memories, 7);
  const monthly = recentPaidMemories(memories, 30);
  const weeklyThemes = topPaidAnchors(weekly);
  const monthlyThemes = topPaidAnchors(monthly);
  const latest = memories[0];
  const previous = memories[1];
  const lines = [
    weekly.length
      ? `Heti minta: ${weekly.length} korábbi olvasat, fő motívumok: ${weeklyThemes.join(", ") || "még szórt témák"}.`
      : "Heti minta: még nincs elég friss olvasat.",
    monthly.length
      ? `Havi ív: ${monthly.length} olvasat, visszatérő motívumok: ${monthlyThemes.join(", ") || "még alakuló fókusz"}.`
      : "Havi ív: még nincs elég adat.",
  ];
  if (latest && previous) {
    const overlap = (latest.anchors ?? []).filter((anchor) =>
      (previous.anchors ?? []).includes(anchor),
    );
    if (overlap.length) {
      lines.push(
        `Változás a múltkorihoz képest: más kérdésben is visszajön ez: ${overlap.slice(0, 2).join(", ")}.`,
      );
    } else {
      lines.push(
        "Változás a múltkorihoz képest: a fókusz elmozdult, ne kezeld ugyanannak a helyzetnek.",
      );
    }
  }
  return lines;
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
      .limit(20);
    if (!data?.length) return "";
    const memories = data as PaidMemoryRow[];
    const lines = memories.slice(0, 6).map((memory) => {
      const label = memory.topic || memory.situation || memory.reading_type;
      return `${label}: ${memory.one_sentence || memory.summary}`;
    });
    const anchorLine = anchors.length ? `Aktuális kulcsok: ${anchors.join(", ")}` : "";
    return [
      "Korábbi felhasználói minták a prémium olvasathoz:",
      anchorLine,
      ...buildPaidMemoryArc(memories),
      ...lines,
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
}

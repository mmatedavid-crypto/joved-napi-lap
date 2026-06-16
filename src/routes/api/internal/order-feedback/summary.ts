import { createFileRoute } from "@tanstack/react-router";

type FeedbackValue = "accurate" | "partial" | "missed";
type ReviewPriority = "high" | "medium" | "low";

type FeedbackRow = {
  product_slug: string | null;
  product_name: string | null;
  feedback: FeedbackValue;
  source: string | null;
  note: string | null;
  created_at: string;
};

type ProductFeedbackSummary = {
  productSlug: string;
  productName: string;
  total: number;
  accurate: number;
  partial: number;
  missed: number;
  negative: number;
  detailCount: number;
  negativeDetailCount: number;
  missRate: number;
  detailRate: number;
  needsAttention: boolean;
  reviewPriority: ReviewPriority;
  reviewRecommendation: string;
};

type OrderHealthRow = {
  product_slug: string | null;
  product_name: string | null;
  category: string | null;
  status: string | null;
  error_message: string | null;
  express: boolean | null;
  created_at: string;
  updated_at: string;
};

type OrderHealthSummary = {
  productSlug: string;
  productName: string;
  category: string;
  status: string;
  errorCode: string;
  total: number;
  express: number;
  staleProcessing: number;
  oldestCreatedAt: string | null;
  newestUpdatedAt: string | null;
  action: "manual_review_first" | "retry_watch" | "watch";
};

type DeliveryEmailState = "queued" | "missing" | "failed";

type DeliveryEmailHealthRow = {
  product_slug: string | null;
  product_name: string | null;
  category: string | null;
  delivery_email_error: string | null;
  delivery_email_queued_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

type DeliveryEmailHealthSummary = {
  productSlug: string;
  productName: string;
  category: string;
  emailState: DeliveryEmailState;
  errorCode: string;
  total: number;
  oldestDeliveredAt: string | null;
  newestUpdatedAt: string | null;
  action: "manual_review_first" | "retry_watch" | "watch";
};

const DEFAULT_DAYS = 30;
const MAX_DAYS = 180;
const ATTENTION_MIN_TOTAL = 3;
const ATTENTION_MISS_RATE = 0.34;
const LEGACY_BUTTON_NOTES = new Set(["Eltalált", "Részben talált", "Nem volt elég pontos"]);
const DEFAULT_STALE_PROCESSING_MINUTES = 15;
const MAX_STALE_PROCESSING_MINUTES = 180;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  const feedbackSecret = process.env.ORDER_FEEDBACK_SUMMARY_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(token && (token === feedbackSecret || token === serviceRoleKey));
}

function parseDays(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_DAYS);
  if (!Number.isFinite(parsed)) return DEFAULT_DAYS;
  return Math.max(1, Math.min(MAX_DAYS, Math.floor(parsed)));
}

function parseStaleProcessingMinutes(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_STALE_PROCESSING_MINUTES);
  if (!Number.isFinite(parsed)) return DEFAULT_STALE_PROCESSING_MINUTES;
  return Math.max(5, Math.min(MAX_STALE_PROCESSING_MINUTES, Math.floor(parsed)));
}

function normalizeOrderHealthErrorCode(value: string | null, status: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return status === "processing" ? "processing" : "none";
  if (/^[a-z0-9_:-]{3,80}$/i.test(trimmed)) return trimmed;
  return "internal_error";
}

function normalizeDeliveryEmailErrorCode(value: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return "none";
  if (/^[a-z0-9_:-]{3,80}$/i.test(trimmed)) return trimmed;
  return "internal_error";
}

function deliveryEmailState(row: DeliveryEmailHealthRow): DeliveryEmailState {
  if (row.delivery_email_error?.trim()) return "failed";
  if (row.delivery_email_queued_at) return "queued";
  return "missing";
}

function emptyCounts() {
  return {
    total: 0,
    accurate: 0,
    partial: 0,
    missed: 0,
    detailCount: 0,
    negativeDetailCount: 0,
  };
}

function hasWrittenDetail(row: FeedbackRow): boolean {
  const detail = row.note?.trim();
  if (!detail) return false;
  if (LEGACY_BUTTON_NOTES.has(detail)) return false;
  return detail.length >= 12;
}

function reviewPriorityFor(item: {
  total: number;
  missed: number;
  negative: number;
  negativeDetailCount: number;
  missRate: number;
  needsAttention: boolean;
}): ReviewPriority {
  if (item.negativeDetailCount >= 2) return "high";
  if (item.missed >= 2 && item.missRate >= 0.4) return "high";
  if (item.needsAttention) return "medium";
  if (item.negativeDetailCount >= 1) return "medium";
  if (item.negative >= 2 && item.total >= 5) return "medium";
  return "low";
}

function recommendationFor(
  priority: ReviewPriority,
  item: { negativeDetailCount: number },
): string {
  if (priority === "high") {
    return "manual_review_first";
  }
  if (priority === "medium" && item.negativeDetailCount > 0) {
    return "read_feedback_details";
  }
  if (priority === "medium") {
    return "watch_next_orders";
  }
  return "no_action";
}

function summarizeRows(rows: FeedbackRow[]): ProductFeedbackSummary[] {
  const byProduct = new Map<
    string,
    ReturnType<typeof emptyCounts> & { productSlug: string; productName: string }
  >();

  for (const row of rows) {
    const productSlug = row.product_slug || "unknown";
    const current = byProduct.get(productSlug) ?? {
      ...emptyCounts(),
      productSlug,
      productName: row.product_name || productSlug,
    };
    current.total += 1;
    current[row.feedback] += 1;
    if (hasWrittenDetail(row)) {
      current.detailCount += 1;
      if (row.feedback === "partial" || row.feedback === "missed") current.negativeDetailCount += 1;
    }
    if (!current.productName && row.product_name) current.productName = row.product_name;
    byProduct.set(productSlug, current);
  }

  return [...byProduct.values()]
    .map((item) => {
      const negative = item.partial + item.missed;
      const missRate = item.total > 0 ? Number((negative / item.total).toFixed(2)) : 0;
      const detailRate = item.total > 0 ? Number((item.detailCount / item.total).toFixed(2)) : 0;
      const needsAttention = item.total >= ATTENTION_MIN_TOTAL && missRate >= ATTENTION_MISS_RATE;
      const reviewPriority = reviewPriorityFor({
        total: item.total,
        missed: item.missed,
        negative,
        negativeDetailCount: item.negativeDetailCount,
        missRate,
        needsAttention,
      });
      return {
        productSlug: item.productSlug,
        productName: item.productName,
        total: item.total,
        accurate: item.accurate,
        partial: item.partial,
        missed: item.missed,
        negative,
        detailCount: item.detailCount,
        negativeDetailCount: item.negativeDetailCount,
        missRate,
        detailRate,
        needsAttention,
        reviewPriority,
        reviewRecommendation: recommendationFor(reviewPriority, {
          negativeDetailCount: item.negativeDetailCount,
        }),
      };
    })
    .sort((a, b) => {
      const priorityRank = { high: 2, medium: 1, low: 0 } as const;
      if (a.reviewPriority !== b.reviewPriority) {
        return priorityRank[b.reviewPriority] - priorityRank[a.reviewPriority];
      }
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      if (b.missRate !== a.missRate) return b.missRate - a.missRate;
      return b.total - a.total;
    });
}

function summarizeOrderHealth(
  rows: OrderHealthRow[],
  staleProcessingMinutes: number,
): OrderHealthSummary[] {
  const staleBefore = Date.now() - staleProcessingMinutes * 60_000;
  const byKey = new Map<string, OrderHealthSummary>();

  for (const row of rows) {
    const productSlug = row.product_slug || "unknown";
    const productName = row.product_name || productSlug;
    const category = row.category || "unknown";
    const status = row.status || "unknown";
    const errorCode = normalizeOrderHealthErrorCode(row.error_message, status);
    const key = `${productSlug}:${status}:${errorCode}`;
    const current =
      byKey.get(key) ??
      ({
        productSlug,
        productName,
        category,
        status,
        errorCode,
        total: 0,
        express: 0,
        staleProcessing: 0,
        oldestCreatedAt: null,
        newestUpdatedAt: null,
        action: "watch",
      } satisfies OrderHealthSummary);

    current.total += 1;
    if (row.express) current.express += 1;
    if (status === "processing" && new Date(row.updated_at).getTime() < staleBefore) {
      current.staleProcessing += 1;
    }
    if (!current.oldestCreatedAt || row.created_at < current.oldestCreatedAt) {
      current.oldestCreatedAt = row.created_at;
    }
    if (!current.newestUpdatedAt || row.updated_at > current.newestUpdatedAt) {
      current.newestUpdatedAt = row.updated_at;
    }
    if (status === "failed" || current.staleProcessing > 0) {
      current.action = status === "failed" ? "manual_review_first" : "retry_watch";
    }
    byKey.set(key, current);
  }

  return [...byKey.values()].sort((a, b) => {
    const actionRank = { manual_review_first: 2, retry_watch: 1, watch: 0 } as const;
    if (a.action !== b.action) return actionRank[b.action] - actionRank[a.action];
    if (b.total !== a.total) return b.total - a.total;
    return (b.newestUpdatedAt ?? "").localeCompare(a.newestUpdatedAt ?? "");
  });
}

function summarizeDeliveryEmailHealth(
  rows: DeliveryEmailHealthRow[],
): DeliveryEmailHealthSummary[] {
  const byKey = new Map<string, DeliveryEmailHealthSummary>();

  for (const row of rows) {
    const productSlug = row.product_slug || "unknown";
    const productName = row.product_name || productSlug;
    const category = row.category || "unknown";
    const emailState = deliveryEmailState(row);
    const errorCode = normalizeDeliveryEmailErrorCode(row.delivery_email_error);
    const key = `${productSlug}:${emailState}:${errorCode}`;
    const current =
      byKey.get(key) ??
      ({
        productSlug,
        productName,
        category,
        emailState,
        errorCode,
        total: 0,
        oldestDeliveredAt: null,
        newestUpdatedAt: null,
        action: "watch",
      } satisfies DeliveryEmailHealthSummary);

    current.total += 1;
    if (
      row.delivered_at &&
      (!current.oldestDeliveredAt || row.delivered_at < current.oldestDeliveredAt)
    ) {
      current.oldestDeliveredAt = row.delivered_at;
    }
    if (!current.newestUpdatedAt || row.updated_at > current.newestUpdatedAt) {
      current.newestUpdatedAt = row.updated_at;
    }
    if (emailState === "failed") current.action = "manual_review_first";
    if (emailState === "missing") current.action = "retry_watch";
    byKey.set(key, current);
  }

  return [...byKey.values()].sort((a, b) => {
    const actionRank = { manual_review_first: 2, retry_watch: 1, watch: 0 } as const;
    if (a.action !== b.action) return actionRank[b.action] - actionRank[a.action];
    if (b.total !== a.total) return b.total - a.total;
    return (b.newestUpdatedAt ?? "").localeCompare(a.newestUpdatedAt ?? "");
  });
}

async function handleSummary(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = parseDays(url.searchParams.get("days"));
  const staleProcessingMinutes = parseStaleProcessingMinutes(
    url.searchParams.get("staleProcessingMinutes"),
  );
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("order_feedback")
    .select("product_slug, product_name, feedback, source, note, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("order feedback summary failed:", {
      code: error.code,
      message: error.message,
    });
    return Response.json(
      { ok: false, error: "feedback_summary_unavailable" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: orderHealthData, error: orderHealthError } = await supabaseAdmin
    .from("orders")
    .select(
      "product_slug, product_name, category, status, error_message, express, created_at, updated_at",
    )
    .gte("created_at", since)
    .in("status", ["failed", "processing", "paid"])
    .order("created_at", { ascending: false })
    .limit(1000);

  if (orderHealthError) {
    console.error("order health summary failed:", {
      code: orderHealthError.code,
      message: orderHealthError.message,
    });
    return Response.json(
      { ok: false, error: "order_health_summary_unavailable" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: deliveryEmailHealthData, error: deliveryEmailHealthError } = await supabaseAdmin
    .from("orders")
    .select(
      "product_slug, product_name, category, delivery_email_error, delivery_email_queued_at, delivered_at, created_at, updated_at",
    )
    .gte("delivered_at", since)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false })
    .limit(1000);

  if (deliveryEmailHealthError) {
    console.error("delivery email health summary failed:", {
      code: deliveryEmailHealthError.code,
      message: deliveryEmailHealthError.message,
    });
    return Response.json(
      { ok: false, error: "delivery_email_health_summary_unavailable" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rows = (data ?? []) as FeedbackRow[];
  const products = summarizeRows(rows);
  const orderHealth = summarizeOrderHealth(
    (orderHealthData ?? []) as OrderHealthRow[],
    staleProcessingMinutes,
  );
  const deliveryEmailHealth = summarizeDeliveryEmailHealth(
    (deliveryEmailHealthData ?? []) as DeliveryEmailHealthRow[],
  );
  const totals = products.reduce(
    (acc, item) => ({
      total: acc.total + item.total,
      accurate: acc.accurate + item.accurate,
      partial: acc.partial + item.partial,
      missed: acc.missed + item.missed,
      negative: acc.negative + item.negative,
      detailCount: acc.detailCount + item.detailCount,
      negativeDetailCount: acc.negativeDetailCount + item.negativeDetailCount,
    }),
    {
      total: 0,
      accurate: 0,
      partial: 0,
      missed: 0,
      negative: 0,
      detailCount: 0,
      negativeDetailCount: 0,
    },
  );

  return Response.json(
    {
      ok: true,
      days,
      since,
      staleProcessingMinutes,
      generatedAt: new Date().toISOString(),
      totals,
      needsAttentionCount: products.filter((item) => item.needsAttention).length,
      reviewPriorityCounts: {
        high: products.filter((item) => item.reviewPriority === "high").length,
        medium: products.filter((item) => item.reviewPriority === "medium").length,
        low: products.filter((item) => item.reviewPriority === "low").length,
      },
      orderHealth: {
        totals: {
          open: orderHealth.reduce((acc, item) => acc + item.total, 0),
          failed: orderHealth
            .filter((item) => item.status === "failed")
            .reduce((acc, item) => acc + item.total, 0),
          staleProcessing: orderHealth.reduce((acc, item) => acc + item.staleProcessing, 0),
          express: orderHealth.reduce((acc, item) => acc + item.express, 0),
        },
        needsAttentionCount: orderHealth.filter((item) => item.action !== "watch").length,
        products: orderHealth,
      },
      deliveryEmailHealth: {
        totals: {
          delivered: deliveryEmailHealth.reduce((acc, item) => acc + item.total, 0),
          queued: deliveryEmailHealth
            .filter((item) => item.emailState === "queued")
            .reduce((acc, item) => acc + item.total, 0),
          missing: deliveryEmailHealth
            .filter((item) => item.emailState === "missing")
            .reduce((acc, item) => acc + item.total, 0),
          failed: deliveryEmailHealth
            .filter((item) => item.emailState === "failed")
            .reduce((acc, item) => acc + item.total, 0),
        },
        needsAttentionCount: deliveryEmailHealth.filter((item) => item.action !== "watch").length,
        products: deliveryEmailHealth,
      },
      products,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export const Route = createFileRoute("/api/internal/order-feedback/summary")({
  server: {
    handlers: {
      GET: ({ request }) => handleSummary(request),
    },
  },
});

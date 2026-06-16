import { createFileRoute } from "@tanstack/react-router";

type FeedbackValue = "accurate" | "partial" | "missed";

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
};

const DEFAULT_DAYS = 30;
const MAX_DAYS = 180;
const ATTENTION_MIN_TOTAL = 3;
const ATTENTION_MISS_RATE = 0.34;
const LEGACY_BUTTON_NOTES = new Set(["Eltalált", "Részben talált", "Nem volt elég pontos"]);

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
        needsAttention: item.total >= ATTENTION_MIN_TOTAL && missRate >= ATTENTION_MISS_RATE,
      };
    })
    .sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      if (b.missRate !== a.missRate) return b.missRate - a.missRate;
      return b.total - a.total;
    });
}

async function handleSummary(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = parseDays(url.searchParams.get("days"));
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

  const rows = (data ?? []) as FeedbackRow[];
  const products = summarizeRows(rows);
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
      generatedAt: new Date().toISOString(),
      totals,
      needsAttentionCount: products.filter((item) => item.needsAttention).length,
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

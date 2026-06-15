import { createFileRoute } from "@tanstack/react-router";
import {
  HOROSCOPE_PERIODS,
  allHoroscopeArticlePaths,
  type HoroscopePeriodHU,
} from "@/lib/horoscopeNews";

// Legacy warmup endpoint for scheduled jobs. It can trigger Roxy/AI work, so it
// must stay protected even though it does not expose personal data.

const MAX_LIMIT = 36;
const DEFAULT_LIMIT = 12;
const MAX_CONCURRENCY = 3;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  const prewarmSecret = process.env.HOROSCOPE_PREWARM_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(token && (token === prewarmSecret || token === serviceRoleKey));
}

function clampInt(value: string | null, def: number, min: number, max: number): number {
  const n = Number(value ?? def);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period");
  const limit = clampInt(url.searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const concurrency = clampInt(url.searchParams.get("concurrency"), 2, 1, MAX_CONCURRENCY);
  const all = allHoroscopeArticlePaths();
  const targets = (
    period && HOROSCOPE_PERIODS.includes(period as HoroscopePeriodHU)
      ? all.filter((t) => t.period === period)
      : all
  ).slice(0, limit);

  const { getHoroscopeNewsArticle } = await import("@/lib/horoscopeNews.server");
  const started = Date.now();
  const results: Array<{
    period: string;
    sign: string;
    ok: boolean;
    fallbackUsed?: boolean;
    latencyMs: number;
  }> = [];
  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (target) => {
        const t0 = Date.now();
        try {
          const article = await getHoroscopeNewsArticle({
            period: target.period,
            signSlug: target.signSlug,
          });
          return {
            period: target.period,
            sign: target.signSlug,
            ok: true,
            fallbackUsed: article.fallbackUsed,
            latencyMs: Date.now() - t0,
          };
        } catch {
          return {
            period: target.period,
            sign: target.signSlug,
            ok: false,
            latencyMs: Date.now() - t0,
          };
        }
      }),
    );
    results.push(...batchResults);
  }

  return Response.json(
    { ok: true, warmed: results.length, latencyMs: Date.now() - started, results },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export const Route = createFileRoute("/api/public/hooks/warm-horoscopes")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});

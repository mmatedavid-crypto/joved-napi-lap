import { createFileRoute } from "@tanstack/react-router";
import {
  HOROSCOPE_PERIODS,
  allHoroscopeArticlePaths,
  type HoroscopePeriodHU,
} from "@/lib/horoscopeNews";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 36;

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  const prewarmSecret = process.env.HOROSCOPE_PREWARM_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(token && (token === prewarmSecret || token === serviceRoleKey));
}

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(parsed)));
}

function selectedTargets(url: URL) {
  const period = url.searchParams.get("period");
  const signSlug = url.searchParams.get("sign");
  const limit = parseLimit(url.searchParams.get("limit"));
  const allTargets = allHoroscopeArticlePaths();
  const periodTargets =
    period && HOROSCOPE_PERIODS.includes(period as HoroscopePeriodHU)
      ? allTargets.filter((target) => target.period === period)
      : allTargets;
  const signTargets = signSlug
    ? periodTargets.filter((target) => target.signSlug === signSlug)
    : periodTargets;
  return signTargets.slice(0, limit);
}

async function handlePrewarm(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const targets = selectedTargets(url);
  const { getHoroscopeNewsArticle } = await import("@/lib/horoscopeNews.server");
  const started = Date.now();
  const results = [];

  for (const target of targets) {
    const itemStarted = Date.now();
    try {
      const article = await getHoroscopeNewsArticle({
        period: target.period,
        signSlug: target.signSlug,
      });
      results.push({
        period: target.period,
        sign: target.signSlug,
        ok: true,
        fallbackUsed: article.fallbackUsed,
        sourceCached: article.sourceCached,
        translationCached: article.translationCached,
        sections: article.sections.length,
        latencyMs: Date.now() - itemStarted,
      });
    } catch {
      results.push({
        period: target.period,
        sign: target.signSlug,
        ok: false,
        fallbackUsed: true,
        latencyMs: Date.now() - itemStarted,
      });
    }
  }

  return Response.json(
    {
      ok: true,
      warmed: results.length,
      fallbackCount: results.filter((item) => item.fallbackUsed).length,
      latencyMs: Date.now() - started,
      results,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export const Route = createFileRoute("/api/internal/horoscope-news/prewarm")({
  server: {
    handlers: {
      GET: ({ request }) => handlePrewarm(request),
      POST: ({ request }) => handlePrewarm(request),
    },
  },
});

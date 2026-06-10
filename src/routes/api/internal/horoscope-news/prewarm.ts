import { createFileRoute } from "@tanstack/react-router";
import {
  HOROSCOPE_PERIODS,
  allHoroscopeArticlePaths,
  type HoroscopePeriodHU,
} from "@/lib/horoscopeNews";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 36;
const DEFAULT_CONCURRENCY = 2;
const MAX_CONCURRENCY = 4;

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

function parseOffset(value: string | null): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function parseConcurrency(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_CONCURRENCY);
  if (!Number.isFinite(parsed)) return DEFAULT_CONCURRENCY;
  return Math.max(1, Math.min(MAX_CONCURRENCY, Math.floor(parsed)));
}

function selectedTargets(url: URL) {
  const period = url.searchParams.get("period");
  const signSlug = url.searchParams.get("sign");
  const limit = parseLimit(url.searchParams.get("limit"));
  const offset = parseOffset(url.searchParams.get("offset"));
  const concurrency = parseConcurrency(url.searchParams.get("concurrency"));
  const allTargets = allHoroscopeArticlePaths();
  const periodTargets =
    period && HOROSCOPE_PERIODS.includes(period as HoroscopePeriodHU)
      ? allTargets.filter((target) => target.period === period)
      : allTargets;
  const signTargets = signSlug
    ? periodTargets.filter((target) => target.signSlug === signSlug)
    : periodTargets;
  const targets = signTargets.slice(offset, offset + limit);
  return {
    targets,
    total: signTargets.length,
    offset,
    limit,
    concurrency,
    nextOffset: offset + targets.length < signTargets.length ? offset + targets.length : null,
  };
}

type PrewarmTarget = ReturnType<typeof allHoroscopeArticlePaths>[number];

async function warmTarget(
  target: PrewarmTarget,
  getHoroscopeNewsArticle: typeof import("@/lib/horoscopeNews.server").getHoroscopeNewsArticle,
) {
  const itemStarted = Date.now();
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
      sourceCached: article.sourceCached,
      translationCached: article.translationCached,
      sections: article.sections.length,
      latencyMs: Date.now() - itemStarted,
    };
  } catch {
    return {
      period: target.period,
      sign: target.signSlug,
      ok: false,
      fallbackUsed: true,
      latencyMs: Date.now() - itemStarted,
    };
  }
}

async function warmTargetsInBatches(
  targets: PrewarmTarget[],
  concurrency: number,
  getHoroscopeNewsArticle: typeof import("@/lib/horoscopeNews.server").getHoroscopeNewsArticle,
) {
  const results = [];
  for (let index = 0; index < targets.length; index += concurrency) {
    const batch = targets.slice(index, index + concurrency);
    results.push(
      ...(await Promise.all(batch.map((target) => warmTarget(target, getHoroscopeNewsArticle)))),
    );
  }
  return results;
}

async function handlePrewarm(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const selection = selectedTargets(url);
  const { getHoroscopeNewsArticle } = await import("@/lib/horoscopeNews.server");
  const started = Date.now();
  const results = await warmTargetsInBatches(
    selection.targets,
    selection.concurrency,
    getHoroscopeNewsArticle,
  );
  const fallbackCount = results.filter((item) => item.fallbackUsed).length;
  const qualityOkCount = results.length - fallbackCount;
  const retryTargets = results
    .filter((item) => item.fallbackUsed)
    .map((item) => ({ period: item.period, sign: item.sign }));

  return Response.json(
    {
      ok: true,
      totalTargets: selection.total,
      offset: selection.offset,
      limit: selection.limit,
      concurrency: selection.concurrency,
      nextOffset: selection.nextOffset,
      warmed: results.length,
      qualityOkCount,
      fallbackCount,
      retryTargets,
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

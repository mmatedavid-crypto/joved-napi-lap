import { cleanHUText } from "./huTextGuard";
import { SIGN_HU } from "./roxyNormalize";
import {
  PERIOD_LABEL,
  PERIOD_TO_ROXY,
  SIGN_BY_SLUG,
  SIGN_SLUGS,
  type HoroscopeNewsArticle,
  type HoroscopeNewsSection,
  type HoroscopePeriodHU,
} from "./horoscopeNews";

const NEWS_TRANSLATION_VERSION = "news-horo-hu-v1";
const DAY_SECONDS = 60 * 60 * 24;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ttlFor(period: HoroscopePeriodHU): number {
  if (period === "napi") return DAY_SECONDS;
  if (period === "heti") return DAY_SECONDS * 7;
  return DAY_SECONDS * 31;
}

function datedKey(period: HoroscopePeriodHU, dateKey: string): string {
  if (period === "napi") return dateKey;
  if (period === "heti") {
    const d = new Date(`${dateKey}T00:00:00.000Z`);
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }
  return dateKey.slice(0, 7);
}

function cacheDateKey(period: HoroscopePeriodHU, requested?: string): string {
  return datedKey(period, requested ?? todayKey());
}

async function readCache<T>(cacheKey: string): Promise<T | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const { data } = await supabaseAdmin
      .from("api_cache")
      .select("response_payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (!data) return null;
    if (data.expires_at && new Date(data.expires_at as string).getTime() < Date.now()) return null;
    return data.response_payload as T;
  } catch {
    return null;
  }
}

async function writeCache(
  cacheKey: string,
  endpoint: string,
  payload: unknown,
  ttlSeconds: number,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    await supabaseAdmin.from("api_cache").upsert(
      {
        provider: "roxy+ai",
        endpoint,
        cache_key: cacheKey,
        request_payload: {} as never,
        response_payload: payload as never,
        expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      },
      { onConflict: "cache_key" },
    );
  } catch {
    /* cache write must not break public pages */
  }
}

const ARTICLE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    lead: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          text: { type: "string" },
        },
        required: ["heading", "text"],
      },
    },
    luckyColor: { type: "string" },
    luckyNumber: { type: "number" },
    moonPhase: { type: "string" },
  },
  required: ["title", "lead", "sections", "luckyColor", "luckyNumber", "moonPhase"],
} as const;

type ArticleAI = {
  title: string;
  lead: string;
  sections: HoroscopeNewsSection[];
  luckyColor?: string;
  luckyNumber?: number;
  moonPhase?: string;
};

function cleanHoroscopeNewsText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const softened = value
    .replace(/\bengedd el\b/gi, "hagyd magad mögött")
    .replace(/\bfigyelj a jelekre\b/gi, "vedd észre a finom jelzéseket")
    .replace(/\bhallgass a szívedre\b/gi, "a saját érzéseidre is figyelj")
    .replace(/\blégy önmagad\b/gi, "maradj hiteles")
    .replace(/\bkommunikálj nyíltan és őszintén\b/gi, "fogalmazz tisztán");
  const cleaned = cleanHUText(softened);
  return cleaned?.replace(/(^|[.!?]\s+)([a-záéíóöőúüű])/g, (_, prefix: string, letter: string) =>
    `${prefix}${letter.toLocaleUpperCase("hu-HU")}`,
  );
}

function cleanHoroscopeNewsHeading(value: unknown): string | undefined {
  const cleaned = cleanHoroscopeNewsText(value);
  return cleaned ? cleaned.charAt(0).toLocaleUpperCase("hu-HU") + cleaned.slice(1) : undefined;
}

function normalizeArticle(
  raw: ArticleAI,
  meta: {
    period: HoroscopePeriodHU;
    sign: keyof typeof SIGN_SLUGS;
    signSlug: string;
    dateKey: string;
    sourceCached: boolean;
    translationCached: boolean;
    fallbackUsed: boolean;
  },
): HoroscopeNewsArticle | null {
  const title = cleanHoroscopeNewsText(raw.title);
  const lead = cleanHoroscopeNewsText(raw.lead);
  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((s) => ({
          heading: cleanHoroscopeNewsHeading(s.heading) ?? "",
          text: cleanHoroscopeNewsText(s.text) ?? "",
        }))
        .filter((s) => s.heading && s.text)
    : [];
  if (!title || !lead || !sections.length) return null;
  return {
    ...meta,
    signName: SIGN_HU[meta.sign],
    title,
    lead,
    sections,
    luckyColor: cleanHUText(raw.luckyColor),
    luckyNumber: typeof raw.luckyNumber === "number" ? raw.luckyNumber : undefined,
    moonPhase: cleanHUText(raw.moonPhase),
  };
}

function localFallbackArticle(opts: {
  period: HoroscopePeriodHU;
  sign: keyof typeof SIGN_SLUGS;
  signSlug: string;
  dateKey: string;
  sourceCached: boolean;
  translationCached: boolean;
  fallbackUsed: boolean;
}): HoroscopeNewsArticle {
  const signName = SIGN_HU[opts.sign];
  return {
    ...opts,
    signName,
    title: `${PERIOD_LABEL[opts.period]} ${signName} jegyűeknek`,
    lead: "A háttéradat most nem érhető el, ezért rövid, általános magyar tartalmat mutatunk.",
    sections: [
      {
        heading: "Mai irány",
        text: "Figyeld meg, hol kér több türelmet a napod, és hol lenne elég egy kisebb, tisztább lépés.",
      },
    ],
  };
}

export async function getHoroscopeNewsArticle(opts: {
  period: HoroscopePeriodHU;
  signSlug: string;
  dateKey?: string;
}): Promise<HoroscopeNewsArticle> {
  const sign = SIGN_BY_SLUG[opts.signSlug];
  const dateKey = cacheDateKey(opts.period, opts.dateKey);
  if (!sign) {
    return localFallbackArticle({
      period: opts.period,
      sign: "aries",
      signSlug: "kos",
      dateKey,
      sourceCached: false,
      translationCached: false,
      fallbackUsed: true,
    });
  }

  const periodRoxy = PERIOD_TO_ROXY[opts.period];
  const translationKey = `horo-news:${NEWS_TRANSLATION_VERSION}:${opts.period}:${sign}:${dateKey}`;
  const cached = await readCache<HoroscopeNewsArticle>(translationKey);
  if (cached) return { ...cached, translationCached: true };

  const { callRoxy } = await import("./roxy.server");
  const endpoint = `/astrology/horoscope/${sign}/${periodRoxy}`;
  const roxy = await callRoxy<unknown>({
    endpoint,
    method: "GET",
    cacheKey: `astro:${periodRoxy}:${sign}:${dateKey}`,
    ttlSeconds: ttlFor(opts.period),
  });

  if (!roxy.ok || !roxy.data) {
    return localFallbackArticle({
      period: opts.period,
      sign,
      signSlug: opts.signSlug,
      dateKey,
      sourceCached: false,
      translationCached: false,
      fallbackUsed: true,
    });
  }

  const { aiJSON } = await import("./ai.server");
  const translated = await aiJSON<ArticleAI>({
    system: [
      "Te magyar szerkesztőségi fordító vagy a Jövőd.hu-n.",
      "A RoxyAPI horoszkóp-forrását hűen fordítod magyarra.",
      "Ne rövidíts, ne vágj, ne értelmezz át, ne adj hozzá új állítást.",
      "Őrizd meg a forrás szerkezetét: amit a forrás külön témaként ad, legyen külön szekció.",
      "A finance/health témákat is csak horoszkóp-rovatként fordítsd; ne adj valós orvosi vagy pénzügyi tanácsot.",
      "Ne használj angol szót, endpointnevet, mezőnevet vagy AI-meta mondatot.",
      "Csak JSON-t adj vissza a séma szerint.",
    ].join("\n"),
    user: [
      `Időszak: ${PERIOD_LABEL[opts.period]}`,
      `Jegy: ${SIGN_HU[sign]}`,
      `Dátumkulcs: ${dateKey}`,
      "Fordítsd magyar cikké. A title legyen keresőbarát, de ne legyen bulváros.",
      "Forrás JSON:",
      JSON.stringify(roxy.data),
    ].join("\n\n"),
    schemaName: "HoroscopeNewsArticleHU",
    schema: ARTICLE_SCHEMA as unknown as Record<string, unknown>,
    readingType: `horoscope-news:${opts.period}`,
    // Közvetlen OpenAI hívás a saját OPENAI_API_KEY-vel. A Lovable Gateway-n
    // a gpt-5.5 SSR-ben 40+ másodperc volt, ami timeoutolt és fallbackra
    // ejtette az oldalt. Az OpenAI Responses API gyorsabb és stabilabb.
    providerPreference: "openai_first",
    openaiModel: "gpt-5.2",
  });

  const article =
    translated.ok && translated.data
      ? normalizeArticle(translated.data, {
          period: opts.period,
          sign,
          signSlug: opts.signSlug,
          dateKey,
          sourceCached: roxy.cached,
          translationCached: false,
          fallbackUsed: false,
        })
      : null;

  if (!article) {
    return localFallbackArticle({
      period: opts.period,
      sign,
      signSlug: opts.signSlug,
      dateKey,
      sourceCached: roxy.cached,
      translationCached: false,
      fallbackUsed: true,
    });
  }

  await writeCache(
    translationKey,
    `/ai/horoscope-news/${opts.period}`,
    article,
    ttlFor(opts.period),
  );
  return article;
}

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

const NEWS_TRANSLATION_VERSION = "news-horo-hu-v2";
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

const SIGN_FALLBACK_ARCHETYPE: Record<keyof typeof SIGN_SLUGS, string> = {
  aries:
    "A Kos lendülete most gyors választ keres, de a hét valódi ereje abban lehet, ha nem minden impulzusból lesz azonnal döntés.",
  taurus:
    "A Bika számára most a biztonság, a ritmus és a testközeli józanság adhat kapaszkodót; ami túl gyorsan kér választ, azt érdemes lassabban megvizsgálni.",
  gemini:
    "Az Ikrek figyelme könnyen több irányba szalad, ezért most az lehet a kulcs, hogy ne minden gondolatból legyen külön történet.",
  cancer:
    "A Rák érzékenyebb belső antennákkal figyel, de most nem minden régi emlék kér azonnali választ; elég lehet észrevenni, mi érint meg.",
  leo: "Az Oroszlán most könnyebben érzi, hol kap figyelmet és hol nem, de a valódi erő nem a bizonyításban, hanem a méltóságteljes jelenlétben van.",
  virgo:
    "A Szűz most rendet kereshet ott is, ahol még csak alakul a kép; a túl sok elemzés helyett egy tiszta, gyakorlati lépés vihet közelebb.",
  libra:
    "A Mérleg számára a kapcsolati egyensúly kerülhet előtérbe: nem az a kérdés, mindenkinek megfelelsz-e, hanem hogy te hol maradsz benne.",
  scorpio:
    "A Skorpió most mélyebbre lát a felszínnél, de nem minden sejtés bizonyíték; a tisztaságot az adhatja, ha nem a félelem vezeti az értelmezést.",
  sagittarius:
    "A Nyilas tágabb térre vágyhat, de most a szabadság akkor ad valódi könnyebbséget, ha nem menekülésből, hanem belső irányból születik.",
  capricorn:
    "A Bak számára a felelősség és az időzítés lehet a fő téma; nem mindent kell most megoldani, de amit vállalsz, annak legyen tiszta kerete.",
  aquarius:
    "A Vízöntő most kívülről láthat rá egy régi mintára, de a távolság mellett fontos lehet az is, hogy ne szakadj el attól, ami valóban számít.",
  pisces:
    "A Halak érzékenyebben veszi át a hangulatokat, ezért most különösen fontos lehet megkülönböztetni, mi a saját érzésed és mi az, amit másoktól hozol magaddal.",
};

const FALLBACK_COLORS: Record<keyof typeof SIGN_SLUGS, string> = {
  aries: "mélyvörös",
  taurus: "mohazöld",
  gemini: "világossárga",
  cancer: "ezüst",
  leo: "arany",
  virgo: "zsályazöld",
  libra: "rózsakvarc",
  scorpio: "bordó",
  sagittarius: "királykék",
  capricorn: "grafitszürke",
  aquarius: "türkiz",
  pisces: "gyöngyház",
};

function periodFocus(period: HoroscopePeriodHU): {
  leadPrefix: string;
  firstHeading: string;
  workHeading: string;
  loveHeading: string;
  attentionHeading: string;
} {
  if (period === "heti") {
    return {
      leadPrefix: "Ezen a héten",
      firstHeading: "Heti hangulat",
      workHeading: "Munka és ritmus",
      loveHeading: "Kapcsolatok",
      attentionHeading: "Mire figyelj a héten?",
    };
  }
  if (period === "havi") {
    return {
      leadPrefix: "Ebben a hónapban",
      firstHeading: "Havi irány",
      workHeading: "Munka és hosszabb táv",
      loveHeading: "Kapcsolati tér",
      attentionHeading: "Mire figyelj ebben a hónapban?",
    };
  }
  return {
    leadPrefix: "Ma",
    firstHeading: "Mai hangulat",
    workHeading: "Munka",
    loveHeading: "Szerelem",
    attentionHeading: "Mire figyelj ma?",
  };
}

function fallbackNumber(sign: keyof typeof SIGN_SLUGS, period: HoroscopePeriodHU): number {
  const signs = Object.keys(SIGN_SLUGS);
  const signIndex = Math.max(0, signs.indexOf(sign));
  const periodOffset = period === "napi" ? 1 : period === "heti" ? 3 : 6;
  return ((signIndex + periodOffset) % 9) + 1;
}

function cleanHoroscopeNewsText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const softened = value
    .replace(/\bengedd el\b/gi, "hagyd magad mögött")
    .replace(/\bfigyelj a jelekre\b/gi, "vedd észre a finom jelzéseket")
    .replace(/\bhallgass a szívedre\b/gi, "a saját érzéseidre is figyelj")
    .replace(/\blégy önmagad\b/gi, "maradj hiteles")
    .replace(/\bkommunikálj nyíltan és őszintén\b/gi, "fogalmazz tisztán");
  const cleaned = cleanHUText(softened);
  return cleaned?.replace(
    /(^|[.!?]\s+)([a-záéíóöőúüű])/g,
    (_, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase("hu-HU")}`,
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
  const focus = periodFocus(opts.period);
  const archetype = SIGN_FALLBACK_ARCHETYPE[opts.sign];
  return {
    ...opts,
    signName,
    title: `${PERIOD_LABEL[opts.period]} ${signName} jegyűeknek`,
    lead: `${focus.leadPrefix} a ${signName} jegy számára nem nagy jóslatot, hanem finomabb belső igazítást hozhat. ${archetype}`,
    sections: [
      {
        heading: focus.firstHeading,
        text: archetype,
      },
      {
        heading: focus.loveHeading,
        text: "Kapcsolatokban most az apró reakciók lehetnek beszédesek. Nem kell mindent végleges jelként olvasnod, de érdemes észrevenned, hol érzel valódi nyugalmat, és hol csak megszokott feszültséget.",
      },
      {
        heading: focus.workHeading,
        text: "A feladatoknál a túl nagy ígéret helyett a következetes, tiszta lépés adhat erőt. Amit most egyszerűbben is meg lehet oldani, azt ne bonyolítsd túl.",
      },
      {
        heading: focus.attentionHeading,
        text: "A minta inkább arra utalhat, hogy a tempódat kell pontosabban beállítanod: ne kapkodj, de ne is halogasd azt, amiről már tudod, hogy figyelmet kér.",
      },
    ],
    luckyColor: FALLBACK_COLORS[opts.sign],
    luckyNumber: fallbackNumber(opts.sign, opts.period),
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
    // a GPT-5.2 SSR-ben korábban túl lassú volt, ami timeoutolt és fallbackra
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

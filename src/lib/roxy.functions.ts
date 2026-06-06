// Roxy server functions. Browser only sees RPC stubs — ROXY_API_KEY stays
// on the server (see src/lib/roxy.server.ts). Every fn returns a uniform
// envelope so the UI can fall back to local Jövőd content if Roxy fails.
//
// Endpoints below are derived from the authoritative
// https://roxyapi.com/AGENTS.md reference. Comments cite the exact path.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JsonValue }
  | JsonValue[];

export type RoxyEnvelope = {
  ok: boolean;
  data: JsonValue | null;
  cached: boolean;
  fallbackUsed: boolean;
  providerCode?: string;
  message?: string;
};

const FAIL_MESSAGE =
  "Most nem sikerült lekérni a háttértudást. Próbáld újra később.";

async function runRoxy(opts: {
  endpoint: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  cacheKey: string;
  ttlSeconds: number | null;
}): Promise<RoxyEnvelope> {
  const { callRoxy } = await import("./roxy.server");
  const r = await callRoxy<JsonValue>(opts);
  if (!r.ok) {
    return {
      ok: false,
      data: null,
      cached: false,
      fallbackUsed: true,
      providerCode: r.providerCode,
      message: FAIL_MESSAGE,
    };
  }
  return { ok: true, data: r.data ?? null, cached: r.cached, fallbackUsed: false };
}

// ─── Shared validators ────────────────────────────────────────────────────

const BirthDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
const NameSchema = z.string().min(1).max(120);
const SignSchema = z.enum([
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]);
const SeedSchema = z.string().min(1).max(64);

function splitDate(d: string): { year: number; month: number; day: number } {
  const [y, m, dd] = d.split("-").map(Number);
  return { year: y, month: m, day: dd };
}

// ─── Tarot ────────────────────────────────────────────────────────────────
// POST /tarot/draw  body: { count, seed?, allowReversals?, allowDuplicates? }
// Response: { cards: [...] }
export const roxyTarotDraw = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      count: z.number().int().min(1).max(78),
      seed: SeedSchema.optional(),
      allowReversals: z.boolean().default(false),
    }).parse,
  )
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/tarot/draw",
      body: {
        count: data.count,
        seed: data.seed,
        allowReversals: data.allowReversals,
        allowDuplicates: false,
      },
      cacheKey: `tarot:draw:${data.count}:${data.seed ?? "nosd"}:${data.allowReversals ? 1 : 0}`,
      ttlSeconds: data.seed ? 60 * 60 * 24 * 7 : null,
    }),
  );

// "Mai lap" = seeded single draw deterministic per date.
export const roxyTarotDaily = createServerFn({ method: "POST" })
  .inputValidator(z.object({ dateKey: z.string().min(8).max(20) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/tarot/draw",
      body: { count: 1, seed: `daily:${data.dateKey}`, allowDuplicates: false },
      cacheKey: `tarot:daily:${data.dateKey}`,
      ttlSeconds: 60 * 60 * 24,
    }),
  );

// POST /tarot/spreads/three-card  body: { question?, seed? }
// Response: { positions: [{ card, ... }] }
export const roxyTarotThreeCard = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      seed: SeedSchema.optional(),
      question: z.string().min(1).max(280).optional(),
    }).parse,
  )
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/tarot/spreads/three-card",
      body: { seed: data.seed, question: data.question },
      cacheKey: `tarot:three:${data.seed ?? "nosd"}:${data.question ?? ""}`,
      ttlSeconds: data.seed ? 60 * 60 * 24 * 7 : null,
    }),
  );

// POST /tarot/spreads/love  body: { question?, seed? } (5 positions)
export const roxyTarotLove = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      seed: SeedSchema.optional(),
      question: z.string().min(1).max(280).optional(),
    }).parse,
  )
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/tarot/spreads/love",
      body: { seed: data.seed, question: data.question },
      cacheKey: `tarot:love:${data.seed ?? "nosd"}:${data.question ?? ""}`,
      ttlSeconds: data.seed ? 60 * 60 * 24 * 7 : null,
    }),
  );

// ─── Numerology ───────────────────────────────────────────────────────────
// POST /numerology/life-path  body: { year, month, day } (INTEGERS)
export const roxyNumerologyLifePath = createServerFn({ method: "POST" })
  .inputValidator(z.object({ birthDate: BirthDateSchema }).parse)
  .handler(async ({ data }) => {
    const ymd = splitDate(data.birthDate);
    return runRoxy({
      endpoint: "/numerology/life-path",
      body: ymd,
      cacheKey: `num:lifepath:${data.birthDate}`,
      ttlSeconds: 60 * 60 * 24 * 365,
    });
  });

// POST /numerology/chart  body: { fullName, year, month, day }
// Response (nested): { coreNumbers: { lifePath:{number,..}, expression, soulUrge, personality, birthDay, maturity }, profile, ... }
export const roxyNumerologyChart = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate: BirthDateSchema,
      fullName: NameSchema,
    }).parse,
  )
  .handler(async ({ data }) => {
    const ymd = splitDate(data.birthDate);
    return runRoxy({
      endpoint: "/numerology/chart",
      body: { ...ymd, fullName: data.fullName },
      cacheKey: `num:chart:${data.birthDate}:${data.fullName.toLowerCase().trim()}`,
      ttlSeconds: 60 * 60 * 24 * 365,
    });
  });

// POST /numerology/compatibility  body: { person1: {year,month,day,fullName?}, person2: {...} }
export const roxyNumerologyCompatibility = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate1: BirthDateSchema,
      birthDate2: BirthDateSchema,
      fullName1: NameSchema.optional(),
      fullName2: NameSchema.optional(),
    }).parse,
  )
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/numerology/compatibility",
      body: {
        person1: { ...splitDate(data.birthDate1), fullName: data.fullName1 },
        person2: { ...splitDate(data.birthDate2), fullName: data.fullName2 },
      },
      cacheKey: `num:compat:${data.birthDate1}:${data.birthDate2}:${(data.fullName1 ?? "").toLowerCase().trim()}:${(data.fullName2 ?? "").toLowerCase().trim()}`,
      ttlSeconds: 60 * 60 * 24 * 90,
    }),
  );

// ─── Astrology / Horoscope ────────────────────────────────────────────────
// GET /astrology/horoscope/{sign}/daily
export const roxyDailyHoroscope = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sign: SignSchema, dateKey: z.string().min(8).max(20) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: `/astrology/horoscope/${data.sign}/daily`,
      method: "GET",
      cacheKey: `astro:daily:${data.sign}:${data.dateKey}`,
      ttlSeconds: 60 * 60 * 24,
    }),
  );

// ─── I-Ching ──────────────────────────────────────────────────────────────
// POST /iching/daily/cast  body: { seed? }
export const roxyIchingDailyCast = createServerFn({ method: "POST" })
  .inputValidator(z.object({ seed: SeedSchema }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/iching/daily/cast",
      body: { seed: data.seed },
      cacheKey: `iching:cast:${data.seed}`,
      ttlSeconds: 60 * 60 * 24 * 7,
    }),
  );

// GET /iching/hexagrams/{number}
export const roxyIchingHexagram = createServerFn({ method: "POST" })
  .inputValidator(z.object({ number: z.number().int().min(1).max(64) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: `/iching/hexagrams/${data.number}`,
      method: "GET",
      cacheKey: `iching:hex:${data.number}`,
      ttlSeconds: 60 * 60 * 24 * 180,
    }),
  );

// ─── Biorhythm ────────────────────────────────────────────────────────────
// POST /biorhythm/daily  body: { birthDate, date?, seed? }
export const roxyBiorhythmDaily = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate: BirthDateSchema,
      date: BirthDateSchema.optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const date = data.date ?? new Date().toISOString().slice(0, 10);
    return runRoxy({
      endpoint: "/biorhythm/daily",
      body: { birthDate: data.birthDate, date },
      cacheKey: `bio:daily:${data.birthDate}:${date}`,
      ttlSeconds: 60 * 60 * 24,
    });
  });

// ─── Angel numbers ────────────────────────────────────────────────────────
// GET /angel-numbers/lookup?number=1111  (string param)
export const roxyAngelNumberLookup = createServerFn({ method: "POST" })
  .inputValidator(z.object({ number: z.string().regex(/^\d{1,12}$/) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: `/angel-numbers/lookup?number=${encodeURIComponent(data.number)}`,
      method: "GET",
      cacheKey: `angel:${data.number}`,
      ttlSeconds: 60 * 60 * 24 * 180,
    }),
  );

// ─── Dreams ───────────────────────────────────────────────────────────────
// GET /dreams/symbols/{slug}  (kebab-case english slug)
export const roxyDreamSymbol = createServerFn({ method: "POST" })
  .inputValidator(z.object({ slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: `/dreams/symbols/${encodeURIComponent(data.slug)}`,
      method: "GET",
      cacheKey: `dream:sym:${data.slug}`,
      ttlSeconds: 60 * 60 * 24 * 180,
    }),
  );

// ─── Crystals ─────────────────────────────────────────────────────────────
// GET /crystals/birthstone/{month}
export const roxyCrystalBirthstone = createServerFn({ method: "POST" })
  .inputValidator(z.object({ month: z.number().int().min(1).max(12) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: `/crystals/birthstone/${data.month}`,
      method: "GET",
      cacheKey: `crystal:birth:${data.month}`,
      ttlSeconds: 60 * 60 * 24 * 180,
    }),
  );

// GET /crystals/zodiac/{sign}
export const roxyCrystalZodiac = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sign: SignSchema }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: `/crystals/zodiac/${data.sign}`,
      method: "GET",
      cacheKey: `crystal:zodiac:${data.sign}`,
      ttlSeconds: 60 * 60 * 24 * 180,
    }),
  );

// ─── Location ─────────────────────────────────────────────────────────────
// GET /location/search?q=...   (used for future birth-place enrichment)
export const roxyLocationSearch = createServerFn({ method: "POST" })
  .inputValidator(z.object({ q: z.string().min(2).max(120) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: `/location/search?q=${encodeURIComponent(data.q)}`,
      method: "GET",
      cacheKey: `loc:${data.q.toLowerCase().trim()}`,
      ttlSeconds: 60 * 60 * 24 * 30,
    }),
  );
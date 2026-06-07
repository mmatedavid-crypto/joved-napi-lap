// Roxy server functions. Browser only sees RPC stubs — ROXY_API_KEY stays
// on the server (see src/lib/roxy.server.ts). Every fn returns a uniform
// envelope so the UI can fall back to local Jövőd content if Roxy fails.
//
// Endpoints below are derived from the authoritative
// https://roxyapi.com/AGENTS.md reference. Comments cite the exact path.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { guardAITextObject, polishCrystalNameHU } from "./huTextGuard";

type JsonValue = string | number | boolean | null | { [k: string]: JsonValue } | JsonValue[];

export type RoxyEnvelope = {
  ok: boolean;
  data: JsonValue | null;
  cached: boolean;
  fallbackUsed: boolean;
  providerCode?: string;
  message?: string;
};

const FAIL_MESSAGE = "Most nem sikerült lekérni a háttértudást. Próbáld újra később.";

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
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
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
  .inputValidator(
    z.object({
      slug: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-z0-9-]+$/),
    }).parse,
  )
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

// ─── Personal Daily Briefing (AI-enriched, Hungarian) ────────────────────
// Combines tarot/daily, horoscope/daily, biorhythm/daily, angel-numbers
// and crystals/birthstone, then runs the meaningful English fields through
// Lovable AI to produce a single warm Hungarian briefing. Cached per
// (sign, dob, dateKey, name) for 24h in api_cache so repeated visits are free.

export type PersonalBriefingHU = {
  oneLine: string; // 1 mondat összegzés
  horoMood: string;
  horoLove: string;
  horoWork: string;
  horoWarn: string;
  cardTitle: string;
  cardLine: string; // 1-2 mondat a lapról, mai értelemben
  bioLine?: string;
  angelTitle?: string;
  angelMessage?: string;
  crystalName?: string;
  crystalLine?: string;
};

export const roxyPersonalDailyBriefing = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate: BirthDateSchema,
      sign: SignSchema,
      name: NameSchema.optional(),
      dateKey: z.string().min(8).max(20),
      drawnCard: z
        .object({
          id: z.string().min(1).max(64),
          name: z.string().min(1).max(80),
          keywords: z.array(z.string().min(1).max(40)).max(8).optional(),
          general: z.string().min(1).max(600).optional(),
          daily: z.string().min(1).max(400).optional(),
        })
        .optional(),
    }).parse,
  )
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      cached: boolean;
      fallbackUsed: boolean;
      briefing: PersonalBriefingHU | null;
      message?: string;
    }> => {
      const { callRoxy } = await import("./roxy.server");
      const { aiJSON } = await import("./ai.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const nameKey = (data.name ?? "").toLowerCase().trim();
      const cardKey = data.drawnCard?.id ?? "no-card";
      const cacheKey = `enrich:daily:${data.sign}:${data.birthDate}:${data.dateKey}:${nameKey}:${cardKey}`;

      // 1. Cache lookup (24h)
      try {
        const { data: row } = await supabaseAdmin
          .from("api_cache")
          .select("response_payload, expires_at")
          .eq("cache_key", cacheKey)
          .maybeSingle();
        if (row && (!row.expires_at || new Date(row.expires_at as string).getTime() > Date.now())) {
          const cachedBriefing = guardPersonalBriefingHU(row.response_payload);
          if (cachedBriefing) {
            return {
              ok: true,
              cached: true,
              fallbackUsed: false,
              briefing: cachedBriefing,
            };
          }
        }
      } catch {
        /* ignore */
      }

      // 2. Pull raw Roxy data in parallel.
      const digits = data.dateKey.replace(/-/g, "");
      const month = Number(data.dateKey.slice(5, 7));
      // Tarot card: ONLY use what the user personally drew. We never auto-pull
      // a random card from Roxy for the briefing — that would feel impersonal.
      const [horoR, bioR, angelR, crysR] = await Promise.allSettled([
        callRoxy({
          endpoint: `/astrology/horoscope/${data.sign}/daily`,
          method: "GET",
          cacheKey: `astro:daily:${data.sign}:${data.dateKey}`,
          ttlSeconds: 60 * 60 * 24,
        }),
        callRoxy({
          endpoint: "/biorhythm/daily",
          body: { birthDate: data.birthDate, date: data.dateKey },
          cacheKey: `bio:daily:${data.birthDate}:${data.dateKey}`,
          ttlSeconds: 60 * 60 * 24,
        }),
        callRoxy({
          endpoint: `/angel-numbers/lookup?number=${digits}`,
          method: "GET",
          cacheKey: `angel:${digits}`,
          ttlSeconds: 60 * 60 * 24 * 180,
        }),
        callRoxy({
          endpoint: `/crystals/birthstone/${month}`,
          method: "GET",
          cacheKey: `crystal:birth:${month}`,
          ttlSeconds: 60 * 60 * 24 * 180,
        }),
      ]);

      const pick = <T>(r: PromiseSettledResult<{ ok: boolean; data: T | null }>): T | null =>
        r.status === "fulfilled" && r.value.ok ? (r.value.data as T) : null;

      const raw = {
        tarot: data.drawnCard
          ? {
              source: "user-drawn",
              name: data.drawnCard.name,
              keywords: data.drawnCard.keywords ?? [],
              huGeneral: data.drawnCard.general ?? null,
              huDaily: data.drawnCard.daily ?? null,
            }
          : null,
        horoscope: pick(horoR),
        biorhythm: pick(bioR),
        angel: pick(angelR),
        crystal: pick(crysR),
      };

      const hasAny = Object.values(raw).some((v) => v != null);
      if (!hasAny) {
        return {
          ok: false,
          cached: false,
          fallbackUsed: true,
          briefing: null,
          message: "Most nem értem el a háttértudást.",
        };
      }

      // 3. AI rewrite into warm Hungarian copy.
      const sys = [
        "Te a Jövőd.hu spirituális napló írója vagy.",
        "MINDIG magyarul írj, soha ne hagyj angol szót a kimenetben.",
        "Te FORDÍTÓ ÉS ÖSSZEFOGLALÓ vagy, NEM költő. Csak abból dolgozz, ami a 'nyersAdatok'-ban szerepel — ne találj ki új helyzetet, új tanácsot, új szimbólumot, új érzelmet.",
        "Ha egy nyers mező hiányzik vagy üres, HAGYD KI a kimenetből (ne tölts fel közhellyel, ne pótold magadtól).",
        "Hangnem: csendes, meleg, tegező, ítélkezés nélküli, költői de földhözragadt — NEM közhelyes és NEM coachos.",
        "TILTOTT panelmondatok és fordulatok: 'összességében', 'fontos megjegyezni', 'kommunikálj nyíltan és őszintén', 'as an AI', 'légy önmagad', 'higgy magadban', 'minden okkal történik', 'az univerzum melletted áll', 'engedd el', 'figyelj a jelekre', 'hallgass a szívedre', 'minden rendben lesz', 'minden a helyére kerül'. Ha a forrás ilyesmit sugall, fogalmazd át KONKRÉT magyar mondattá a forrás tartalmából — de csak abból.",
        "Ne használj emojit, angol endpoint- vagy mezőneveket, raw provider-szöveget, determinisztikus jövőállítást.",
        "Kristályoknál csak szimbolikus nyelv használható: 'hagyományosan ehhez társítják', 'ezt a minőséget jelképezi', 'önismereti jelként'. Soha ne írd, hogy gyógyít.",
        "Soha ne ígérj orvosi, jogi vagy pénzügyi eredményt. Ne diagnosztizálj. Ne mondj konkrét jövő-eseményt, amit a forrás nem említ.",
        "Hossz: minden mező 1-2 mondat, semmi felsorolás. 'oneLine' EGY mondat, max 18 szó, ne kezdődjön 'Ma' szóval.",
        "A 'cardTitle' SZÓ SZERINT a 'nyersAdatok.tarot.name' értéke. A 'cardLine' a 'nyersAdatok.tarot.huGeneral' és 'huDaily' tartalmából készül — természetes magyar újrafogalmazás, semmi új tartalom.",
        "A horoMood/Love/Work/Warn mezők a 'nyersAdatok.horoscope' angol mezőiből készülnek — folyékony magyarra fordítva, csak azt, ami a forrásban van.",
        "Ha bizonytalan vagy egy konkrét részletben, inkább MARADJ ÁLTALÁNOSABB a forrás keretén belül, mintsem hogy kitalálj.",
        "Csak érvényes JSON-t adj vissza a megadott séma szerint, kommentár nélkül. Magyar nyelv, természetes szórend.",
      ].join(" ");

      const userPayload = {
        kerdezo: { keresztnev: data.name ?? null, csillagjegy: data.sign, datum: data.dateKey },
        nyersAdatok: raw,
      };

      const schema = {
        type: "object",
        additionalProperties: false,
        properties: {
          oneLine: { type: "string" },
          horoMood: { type: "string" },
          horoLove: { type: "string" },
          horoWork: { type: "string" },
          horoWarn: { type: "string" },
          cardTitle: { type: "string" },
          cardLine: { type: "string" },
          bioLine: { type: "string" },
          angelTitle: { type: "string" },
          angelMessage: { type: "string" },
          crystalName: { type: "string" },
          crystalLine: { type: "string" },
        },
        required: [
          "oneLine",
          "horoMood",
          "horoLove",
          "horoWork",
          "horoWarn",
          "cardTitle",
          "cardLine",
        ],
      };

      const ai = await aiJSON<PersonalBriefingHU>({
        system: sys,
        user:
          "Készíts ebből a nyers, vegyes angol forrásból egy mai magyar olvasatot a felhasználónak.\n\n" +
          JSON.stringify(userPayload),
        schemaName: "PersonalBriefingHU",
        schema,
        readingType: "daily_briefing",
      });

      if (!ai.ok || !ai.data) {
        return {
          ok: false,
          cached: false,
          fallbackUsed: true,
          briefing: null,
          message: ai.error ?? "AI hiba",
        };
      }

      const briefing = guardPersonalBriefingHU(ai.data);
      if (!briefing) {
        return {
          ok: false,
          cached: false,
          fallbackUsed: true,
          briefing: null,
          message: "Most nem sikerült természetes magyar olvasatot készíteni.",
        };
      }

      // 4. Cache 24h.
      try {
        await supabaseAdmin.from("api_cache").upsert(
          {
            provider: "roxy+ai",
            endpoint: "/personal/daily-briefing",
            cache_key: cacheKey,
            request_payload: { sign: data.sign, dateKey: data.dateKey } as never,
            response_payload: briefing as never,
            expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          },
          { onConflict: "cache_key" },
        );
      } catch {
        /* ignore */
      }

      return { ok: true, cached: false, fallbackUsed: false, briefing };
    },
  );

function guardPersonalBriefingHU(value: unknown): PersonalBriefingHU | null {
  const guarded = guardAITextObject<PersonalBriefingHU>(
    value,
    ["oneLine", "horoMood", "horoLove", "horoWork", "horoWarn", "cardTitle", "cardLine"],
    {
      oneLine: { oneLine: true },
      crystalName: { allowCrystalName: true },
    },
  );
  if (!guarded) return null;
  return {
    ...guarded,
    crystalName: polishCrystalNameHU(guarded.crystalName) ?? guarded.crystalName,
  };
}

// ─── Generic AI Tarot reading (HU) ───────────────────────────────────────
// Single helper used by mai-lap, harom-lap, randi-elott, dontes-elott.
// Takes the user's actually drawn cards + question/category and returns
// a concrete, personal Hungarian reading. The AI ANCHORS on the magyar
// szövegekre (general/decision/love/warning/daily) — nem talál ki új
// jelentést. Cache: per (spread, card ids, question, category, dateKey).

export type TarotReadingHU = {
  oneLine: string;
  questionAnswer?: string;
  intro?: string;
  past?: string;
  present?: string;
  future?: string;
  together?: string;
  warn?: string;
  pro?: string;
  contra?: string;
  nextStep?: string;
  you?: string;
  between?: string;
  them?: string;
  cardMessage?: string;
};

const TarotCardInput = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  keywords: z.array(z.string().min(1).max(40)).max(8).optional(),
  general: z.string().max(600).optional(),
  love: z.string().max(600).optional(),
  decision: z.string().max(600).optional(),
  warning: z.string().max(600).optional(),
  daily: z.string().max(400).optional(),
});

export const aiTarotReadingHU = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      spread: z.enum(["single", "three", "decision-1", "decision-3", "love-1", "love-3"]),
      cards: z.array(TarotCardInput).min(1).max(5),
      question: z.string().max(500).optional(),
      category: z.string().max(60).optional(),
      dateKey: z.string().min(8).max(20).optional(),
    }).parse,
  )
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      cached: boolean;
      reading: TarotReadingHU | null;
      message?: string;
    }> => {
      const { aiJSON } = await import("./ai.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const {
        buildQualitySystemPrompt,
        buildQualityUserPrompt,
        QUALITY_OUTPUT_SCHEMA,
      } = await import("./readingQuality/prompts");
      const { guardQualityReading } = await import("./readingQuality/qualityGuard");
      const { READING_QUALITY_MODEL, SAFETY_NOTE, type QualityReading } = await import(
        "./readingQuality/styleRules"
      );
      type QR = Awaited<ReturnType<typeof aiJSON<typeof QUALITY_OUTPUT_SCHEMA>>>;
      void QR;

      const idsKey = data.cards.map((c) => c.id).join("+");
      const qKey = (data.question ?? "").toLowerCase().trim().slice(0, 120);
      const dateKey = data.dateKey ?? new Date().toISOString().slice(0, 10);
      const cacheKey = `aitarot-v5q:${data.spread}:${idsKey}:${data.category ?? ""}:${qKey}:${dateKey}`;

      try {
        const { data: row } = await supabaseAdmin
          .from("api_cache")
          .select("response_payload, expires_at")
          .eq("cache_key", cacheKey)
          .maybeSingle();
        if (row && (!row.expires_at || new Date(row.expires_at as string).getTime() > Date.now())) {
          return { ok: true, cached: true, reading: row.response_payload as TarotReadingHU };
        }
      } catch {
        /* ignore */
      }

      // Spread-specific szekciók — a sorsszám-olvasat etalonját követjük:
      // a readingQuality rendszerrel (buildQualitySystemPrompt) generáljuk az
      // olvasatot, majd a szekciókat visszamappeljük a TarotReadingHU mezőire.
      const isDailySingle =
        data.spread === "single" && !data.category && !data.question;

      type SectionMap = { heading: string; field: keyof TarotReadingHU };
      let sectionMap: SectionMap[];
      switch (data.spread) {
        case "three":
          sectionMap = [
            { heading: "Honnan jött", field: "past" },
            { heading: "Mi van most", field: "present" },
            { heading: "Merre mozdul", field: "future" },
            { heading: "Hogyan kapcsolódik a három", field: "together" },
            { heading: "Mire figyelj most?", field: "warn" },
          ];
          break;
        case "decision-3":
          sectionMap = [
            { heading: "Az alaphelyzet", field: "cardMessage" },
            { heading: "Mi szól mellette", field: "pro" },
            { heading: "Mi szól ellene", field: "contra" },
            { heading: "Mire figyelj?", field: "warn" },
            { heading: "Következő kis lépés", field: "nextStep" },
          ];
          break;
        case "decision-1":
          sectionMap = [
            { heading: "Mit üzen ez a lap a döntésedről?", field: "cardMessage" },
            { heading: "Mire figyelj?", field: "warn" },
          ];
          break;
        case "love-3":
          sectionMap = [
            { heading: "Amit te hozol a helyzetbe", field: "you" },
            { heading: "Ami köztetek történik", field: "between" },
            { heading: "Amit ő hozhat", field: "them" },
            { heading: "Mire figyelj?", field: "warn" },
          ];
          break;
        case "love-1":
          sectionMap = [
            { heading: "Mit üzen ez a lap a helyzetről?", field: "cardMessage" },
            { heading: "Mire figyelj?", field: "warn" },
          ];
          break;
        case "single":
        default:
          sectionMap = isDailySingle
            ? [
                { heading: "Mit üzen ma?", field: "cardMessage" },
                { heading: "Mire figyelj?", field: "warn" },
              ]
            : [
                { heading: "Mit üzen ez a lap?", field: "cardMessage" },
                { heading: "Mire figyelj?", field: "warn" },
              ];
      }

      const sourceData = {
        spread: data.spread,
        kerdes: data.question ?? null,
        kategoria: data.category ?? null,
        mod: isDailySingle ? "mai-lap" : "normal",
        cards: data.cards.map((c, i) => ({
          sorszam: i,
          nev: c.name,
          kulcsszavak: c.keywords ?? [],
          general: c.general ?? null,
          love: c.love ?? null,
          decision: c.decision ?? null,
          warning: c.warning ?? null,
          daily: c.daily ?? null,
        })),
        utmutato: isDailySingle
          ? "A felhasználó a mai napjához húzott egy lapot. Az olvasat fordítsa a lap fő minőségét személyes mai hangulattá: konkrét belső állapot, testi érzet, mai hétköznapi helyzet. Sose írd le a lap nevét a szekciók szövegében — a lapot a fejléc mutatja."
          : "A lap(ok) jelentését alkalmazd a megadott helyzetre/kérdésre. A lap a lencse, a helyzet a téma; minden szekció a megadott helyzetről szóljon, ne általában a lapról.",
      };

      const requiredSections = sectionMap.map((s) => s.heading);
      const started = Date.now();
      const ai = await aiJSON<QualityReading>({
        system: buildQualitySystemPrompt(),
        user: buildQualityUserPrompt({
          readingType: "tarot",
          mode: "free",
          userInput: { spread: data.spread, question: data.question, category: data.category },
          sourceData,
          requiredSections,
        }),
        schemaName: "QualityReading",
        schema: QUALITY_OUTPUT_SCHEMA as unknown as Record<string, unknown>,
        model: READING_QUALITY_MODEL,
        readingType: `tarot:${data.spread}`,
      });

      if (!ai.ok || !ai.data) {
        return { ok: false, cached: false, reading: null, message: ai.error ?? "AI hiba" };
      }
      const guard = guardQualityReading(ai.data, [data.spread]);
      if (!guard.ok) {
        return { ok: false, cached: false, reading: null, message: guard.issues.join("; ") };
      }

      // Map sections back to legacy TarotReadingHU shape so the UI files
      // don't need to change.
      const reading: TarotReadingHU = { oneLine: ai.data.oneSentence ?? "" };
      for (const { heading, field } of sectionMap) {
        const sec = ai.data.sections.find(
          (s) =>
            s.heading.trim().toLocaleLowerCase("hu-HU") ===
            heading.trim().toLocaleLowerCase("hu-HU"),
        );
        if (sec?.text) (reading as Record<string, string>)[field] = sec.text;
      }
      // Ha a felhasználó konkrét kérdést tett fel, az első érdemi szekciót
      // tükrözzük questionAnswer-ként is, hogy a régi UI fallback működjön.
      if (data.question && !reading.questionAnswer) {
        const firstField = sectionMap[0]?.field as keyof TarotReadingHU | undefined;
        if (firstField && reading[firstField]) {
          reading.questionAnswer = reading[firstField] as string;
        }
      }
      void SAFETY_NOTE;
      void started;

      try {
        await supabaseAdmin.from("api_cache").upsert(
          {
            provider: "ai",
            endpoint: "/ai/tarot-reading",
            cache_key: cacheKey,
            request_payload: { spread: data.spread, ids: idsKey } as never,
            response_payload: reading as never,
            expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          },
          { onConflict: "cache_key" },
        );
      } catch {
        /* ignore */
      }

      return { ok: true, cached: false, reading };
    },
  );

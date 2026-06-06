// Roxy server functions. Browser only sees RPC stubs — ROXY_API_KEY stays
// on the server (see src/lib/roxy.server.ts). Every fn returns a uniform
// envelope so the UI can fall back to local Jövőd content if Roxy fails.
//
// Endpoints below are derived from the authoritative
// https://roxyapi.com/AGENTS.md reference. Comments cite the exact path.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
          return {
            ok: true,
            cached: true,
            fallbackUsed: false,
            briefing: row.response_payload as PersonalBriefingHU,
          };
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

      // 4. Cache 24h.
      try {
        await supabaseAdmin.from("api_cache").upsert(
          {
            provider: "roxy+ai",
            endpoint: "/personal/daily-briefing",
            cache_key: cacheKey,
            request_payload: { sign: data.sign, dateKey: data.dateKey } as never,
            response_payload: ai.data as never,
            expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          },
          { onConflict: "cache_key" },
        );
      } catch {
        /* ignore */
      }

      return { ok: true, cached: false, fallbackUsed: false, briefing: ai.data };
    },
  );

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

      const idsKey = data.cards.map((c) => c.id).join("+");
      const qKey = (data.question ?? "").toLowerCase().trim().slice(0, 120);
      const dateKey = data.dateKey ?? new Date().toISOString().slice(0, 10);
      const cacheKey = `aitarot-v2:${data.spread}:${idsKey}:${data.category ?? ""}:${qKey}:${dateKey}`;

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

      const sys = [
        "Te a Jövőd.hu spirituális napló írója vagy.",
        "MINDIG magyarul írj, sose maradjon angol szó a kimenetben.",
        "A FELADATOD: a kihúzott lap(ok) jelentését (general/love/decision/warning/daily forrásmezők) ALKALMAZD a felhasználó konkrét helyzetére (kategória + kérdés). A lap a LENCSE, a helyzet a TÉMA. Minden mondatod a megadott helyzetről szóljon, NE a lapról általában.",
        "PÉLDA: ha kategória='randi előtt' és a Szeretők lap jött, NE azt írd, hogy 'a Szeretők a választásokról szól', hanem azt, hogy 'a randin most ott lesz egy belső választás — figyelj, melyik részed válaszol amikor megszólal'. Konkrétan a randira vonatkoztatva.",
        "PÉLDA: ha kategória='nem ír vissza' és a Remete lap jött, ne 'a Remete elvonulást jelent' — hanem 'most lehet, hogy ő épp magában van, nem ellened; ez a csend nem feltétlen elutasítás'. A helyzetre fordítva.",
        "SOHA ne találj ki új jövő-eseményt, új konkrét tényt a másik emberről (mit gondol, mit fog tenni). A forrás KERETÉT alkalmazd a helyzetre, de tényeket ne állíts a másikról.",
        "Ha egy forrásmező üres / hiányzik, HAGYD KI az adott kimeneti mezőt. Ne tölts fel közhellyel.",
        "Hangnem: csendes, meleg, tegező, ítélkezés nélküli, költői de földhözragadt. NEM közhelyes és NEM coachos.",
        "TILTOTT panelmondatok és fordulatok: 'összességében', 'fontos megjegyezni', 'kommunikálj nyíltan és őszintén', 'as an AI', 'légy önmagad', 'higgy magadban', 'minden okkal történik', 'az univerzum melletted áll', 'engedd el', 'figyelj a jelekre', 'hallgass a szívedre', 'minden rendben lesz', 'minden a helyére kerül'. Ezek helyett a forrás konkrét tartalmából építkezz.",
        "Ne használj emojit, angol endpoint- vagy mezőneveket, raw provider-szöveget, determinisztikus jövőállítást.",
        "Soha ne ígérj orvosi, jogi, pénzügyi eredményt. Ne diagnosztizálj.",
        "Hossz: minden mező 2-3 mondat, semmi felsorolás. 'oneLine' EGY tömör mondat, max 20 szó, ne kezdődjön 'Ma' szóval, és KONKRÉTAN a helyzetre szóljon.",
        "Ha van 'kerdes' mező, töltsd ki a 'questionAnswer' mezőt is: 2 mondatban válaszolj közvetlenül a feltett kérdésre, óvatosan, nem determinisztikusan. Ne kerüld meg a kérdést.",
        "Ha van 'kerdes' mező, legalább az 'oneLine' és a 'cardMessage'/'present' is közvetlenül a kérdés tárgyáról szóljon — a lap nyelvén.",
        "A 'three' spread: past=cards[0] (honnan jött ez a HELYZET), present=cards[1] (mi van most a HELYZETBEN), future=cards[2] (merre mozdul a HELYZET); together=hogyan kapcsolódik a három a helyzethez.",
        "A 'decision' spread: pro/contra a kategóriához konkrétan kötve — mi szól mellette / ellene EBBEN a döntésben, a lap energiája alapján. 'nextStep' egy konkrét, kis lépés ebben a helyzetben.",
        "A 'love' 3-as spread: you=mit hozol a HELYZETBE; between=mi van köztetek EBBEN a helyzetben; them=ő hogy érkezik EBBE a helyzetbe — a 'love' forrásmező nyelvén, a kategóriához kötve.",
        "A 'love-1' / 'decision-1' / 'single' spread esetén a 'cardMessage' EGYÉRTELMŰEN a megadott kategóriára/kérdésre szóljon: 'ebben a helyzetben…', 'ezen a randin…', 'erre a döntésre nézve…' — ne általános laptanulság.",
        "Csak érvényes JSON-t adj vissza a séma szerint, kommentár nélkül. Magyar nyelv, természetes szórend.",
      ].join(" ");

      const userPayload = {
        spread: data.spread,
        kerdes: data.question ?? null,
        kategoria: data.category ?? null,
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
      };

      const schema = {
        type: "object",
        additionalProperties: false,
        properties: {
          oneLine: { type: "string" },
          questionAnswer: { type: "string" },
          intro: { type: "string" },
          past: { type: "string" },
          present: { type: "string" },
          future: { type: "string" },
          together: { type: "string" },
          warn: { type: "string" },
          pro: { type: "string" },
          contra: { type: "string" },
          nextStep: { type: "string" },
          you: { type: "string" },
          between: { type: "string" },
          them: { type: "string" },
          cardMessage: { type: "string" },
        },
        required: ["oneLine"],
      };

      const ai = await aiJSON<TarotReadingHU>({
        system: sys,
        user:
          "Írj a felhasználónak egy konkrét, személyes magyar olvasatot a kihúzott lap(ok)ról az alábbi adatokból. Csak azokat a mezőket töltsd ki, amelyek illenek a spread-hez.\n\n" +
          JSON.stringify(userPayload),
        schemaName: "TarotReadingHU",
        schema,
      });

      if (!ai.ok || !ai.data) {
        return { ok: false, cached: false, reading: null, message: ai.error ?? "AI hiba" };
      }

      try {
        await supabaseAdmin.from("api_cache").upsert(
          {
            provider: "ai",
            endpoint: "/ai/tarot-reading",
            cache_key: cacheKey,
            request_payload: { spread: data.spread, ids: idsKey } as never,
            response_payload: ai.data as never,
            expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          },
          { onConflict: "cache_key" },
        );
      } catch {
        /* ignore */
      }

      return { ok: true, cached: false, reading: ai.data };
    },
  );

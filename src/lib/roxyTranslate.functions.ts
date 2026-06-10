// Szigorú magyar integráló réteg a Roxy nyers angol válaszai fölött. Minden fn:
//   1) lekéri a megfelelő Roxy endpointot (cache-elve a roxy.server-en),
//   2) átadja a NYERS angol payload-ot a Lovable AI Gateway-nek,
//   3) az AI-t SZIGORÚAN FORDÍTÓ/ÖSSZEFOGLALÓ módban használja: nem talál ki
//      új tartalmat, csak a kapott angol mezőket teszi folyékony magyarrá,
//      kihagyva a hiányzó mezőket. A magyar eredményt cache-eli az api_cache-be.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  controlledColorHU,
  controlledMoonPhaseHU,
  guardAITextObject,
  polishCrystalNameHU,
} from "./huTextGuard";
import {
  normalizeRoxyDraw,
  normalizeRoxyTarotDaily,
  type RoxyDrawnCard,
} from "./roxyNormalize";

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

const AI_TRANSLATION_CACHE_VERSION = "hu-v2";
const DAY_SECONDS = 60 * 60 * 24;
const STATIC_AI_TRANSLATION_TTL_SECONDS: number | null = null;

function aiCacheKey(...parts: Array<string | number>): string {
  return ["aitr", AI_TRANSLATION_CACHE_VERSION, ...parts].join(":");
}

// Közös fordító system prompt. KULCS: nem talál ki, csak fordít.
const TRANSLATOR_SYSTEM = [
  "Te a Jövőd.hu magyar fordítója vagy.",
  "FELADATOD: a kapott angol forrásmezőket FOLYÉKONY, természetes magyarra fordítani.",
  "SOHA ne találj ki új tényt, új helyzetet, új tanácsot, új szimbólumot — csak azt írd át, amit a forrás tartalmaz.",
  "Ha egy mező a forrásban hiányzik, üres vagy nem értelmezhető, HAGYD KI a kimenetből (ne tölts fel közhellyel).",
  "Hangnem: csendes, meleg, tegező, ítélkezés nélküli — költői, de földhözragadt. NEM coachos, NEM közhelyes.",
  "TILTOTT panelmondatok és fordulatok: 'összességében', 'fontos megjegyezni', 'kommunikálj nyíltan és őszintén', 'as an AI', 'légy önmagad', 'higgy magadban', 'minden okkal történik', 'az univerzum melletted áll', 'engedd el', 'figyelj a jelekre', 'hallgass a szívedre', 'minden rendben lesz', 'minden a helyére kerül'. Ha a forrásban ilyesmi van, fogalmazd át KONKRÉT magyar mondattá a forrás tartalmából — de csak abból.",
  "Ne használj emojit, angol endpoint- vagy mezőneveket, raw provider-szöveget, determinisztikus jövőállítást.",
  "Kristályoknál csak szimbolikus nyelv használható: 'hagyományosan ehhez társítják', 'ezt a minőséget jelképezi', 'önismereti jelként'. Soha ne írd, hogy gyógyít.",
  "Tömörség: minden mező 1-2 mondat, semmi felsorolás. Az 'oneLine' EGY mondat, max 18 szó, ne kezdődjön 'Ma' szóval.",
  "Soha ne ígérj orvosi, jogi, pénzügyi eredményt, ne diagnosztizálj, ne mondj konkrét jövő-eseményt.",
  "Magyar nyelv: természetes magyar szórend, ne tükörfordíts, ne hagyj angol szót a kimenetben.",
  "Csak érvényes JSON-t adj vissza a séma szerint, kommentár nélkül.",
].join(" ");

async function readCache(key: string): Promise<unknown | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const { data: row } = await supabaseAdmin
      .from("api_cache")
      .select("response_payload, expires_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (row && (!row.expires_at || new Date(row.expires_at as string).getTime() > Date.now())) {
      return row.response_payload;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function writeCache(key: string, endpoint: string, payload: unknown, ttlSec: number | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    await supabaseAdmin.from("api_cache").upsert(
      {
        provider: "roxy+ai",
        endpoint,
        cache_key: key,
        request_payload: {} as never,
        response_payload: payload as never,
        expires_at: ttlSec == null ? null : new Date(Date.now() + ttlSec * 1000).toISOString(),
      },
      { onConflict: "cache_key" },
    );
  } catch {
    /* ignore */
  }
}

async function translateWithAI<T>(opts: {
  source: unknown;
  domainHint: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const { aiJSON } = await import("./ai.server");
  const user = [
    `TERÜLET: ${opts.domainHint}.`,
    "Az alábbi nyers angol Roxy API válaszból fordítsd át a tartalmat folyékony magyarrá a megadott séma szerint.",
    "Csak a forrásban szereplő tartalmat add vissza, semmi újat ne találj ki. Ha egy mező hiányzik, hagyd ki a kimenetből.",
    "",
    "FORRÁS (JSON):",
    JSON.stringify(opts.source).slice(0, 8000),
  ].join("\n");
  const r = await aiJSON<T>({
    system: TRANSLATOR_SYSTEM,
    user,
    schemaName: opts.schemaName,
    schema: opts.schema,
    readingType: opts.domainHint,
  });
  return r.ok && r.data ? { ok: true, data: r.data } : { ok: false, data: null, error: r.error };
}

// ─── Horoszkóp ────────────────────────────────────────────────────────────

export type HoroscopeHU = {
  oneLine: string;
  mood?: string;
  love?: string;
  work?: string;
  warn?: string;
  luckyColor?: string;
  moonPhase?: string;
};

export const aiHoroscopeHU = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sign: SignSchema, dateKey: z.string().min(8).max(20) }).parse)
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      cached: boolean;
      reading: HoroscopeHU | null;
      message?: string;
    }> => {
      const cacheKey = aiCacheKey("horoscope", data.sign, data.dateKey);
      const cached = guardHoroscopeHU(await readCache(cacheKey));
      if (cached) return { ok: true, cached: true, reading: cached };

      const { callRoxy } = await import("./roxy.server");
      const r = await callRoxy<unknown>({
        endpoint: `/astrology/horoscope/${data.sign}/daily`,
        method: "GET",
        cacheKey: `astro:daily:${data.sign}:${data.dateKey}`,
        ttlSeconds: DAY_SECONDS,
      });
      if (!r.ok || !r.data)
        return {
          ok: false,
          cached: false,
          reading: null,
          message: "Most nem értem el a horoszkóp adatot.",
        };

      const schema = {
        type: "object",
        additionalProperties: false,
        properties: {
          oneLine: { type: "string" },
          mood: { type: "string" },
          love: { type: "string" },
          work: { type: "string" },
          warn: { type: "string" },
          luckyColor: { type: "string" },
          moonPhase: { type: "string" },
        },
        required: ["oneLine"],
      };
      const t = await translateWithAI<HoroscopeHU>({
        source: r.data,
        domainHint: "Napi horoszkóp egy csillagjegyre",
        schemaName: "HoroscopeHU",
        schema,
      });
      const reading = guardHoroscopeHU(t.data);
      if (!t.ok || !reading) return { ok: false, cached: false, reading: null, message: t.error };

      await writeCache(cacheKey, "/ai/horoscope", reading, DAY_SECONDS);
      return { ok: true, cached: false, reading };
    },
  );

function guardHoroscopeHU(value: unknown): HoroscopeHU | null {
  const guarded = guardAITextObject<HoroscopeHU>(value, ["oneLine"], {
    oneLine: { oneLine: true },
  });
  if (!guarded) return null;
  return {
    ...guarded,
    luckyColor: controlledColorHU(guarded.luckyColor),
    moonPhase: controlledMoonPhaseHU(guarded.moonPhase),
  };
}

// ─── Kristály ─────────────────────────────────────────────────────────────

export type CrystalHU = {
  name: string; // magyar kristály név
  symbol?: string;
  quality?: string;
  when?: string;
  oneLine?: string;
};

export const aiCrystalHU = createServerFn({ method: "POST" })
  .inputValidator(
    z.union([
      z.object({ mode: z.literal("month"), month: z.number().int().min(1).max(12) }),
      z.object({ mode: z.literal("zodiac"), sign: SignSchema }),
    ]).parse,
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; cached: boolean; reading: CrystalHU | null; message?: string }> => {
      const cacheKey =
        data.mode === "month"
          ? aiCacheKey("crystal", "month", data.month)
          : aiCacheKey("crystal", "zodiac", data.sign);
      const cached = guardCrystalHU(await readCache(cacheKey));
      if (cached) return { ok: true, cached: true, reading: cached };

      const { callRoxy } = await import("./roxy.server");
      const endpoint =
        data.mode === "month"
          ? `/crystals/birthstone/${data.month}`
          : `/crystals/zodiac/${data.sign}`;
      const cacheKeyRoxy =
        data.mode === "month" ? `crystal:birth:${data.month}` : `crystal:zodiac:${data.sign}`;
      const r = await callRoxy<unknown>({
        endpoint,
        method: "GET",
        cacheKey: cacheKeyRoxy,
        ttlSeconds: DAY_SECONDS * 180,
      });
      if (!r.ok || !r.data)
        return {
          ok: false,
          cached: false,
          reading: null,
          message: "Most nem értem el a kristály adatot.",
        };

      const schema = {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          symbol: { type: "string" },
          quality: { type: "string" },
          when: { type: "string" },
          oneLine: { type: "string" },
        },
        required: ["name"],
      };
      const t = await translateWithAI<CrystalHU>({
        source: r.data,
        domainHint:
          "Kristály jelentése (születési kő vagy csillagjegy kristály). A 'name' magyar kristálynév legyen (pl. Ametiszt, Rózsakvarc, Hegyikristály).",
        schemaName: "CrystalHU",
        schema,
      });
      const reading = guardCrystalHU(t.data);
      if (!t.ok || !reading) return { ok: false, cached: false, reading: null, message: t.error };

      await writeCache(cacheKey, "/ai/crystal", reading, STATIC_AI_TRANSLATION_TTL_SECONDS);
      return { ok: true, cached: false, reading };
    },
  );

function guardCrystalHU(value: unknown): CrystalHU | null {
  const guarded = guardAITextObject<CrystalHU>(value, ["name"], {
    name: { allowCrystalName: true },
    oneLine: { oneLine: true },
  });
  if (!guarded) return null;
  return { ...guarded, name: polishCrystalNameHU(guarded.name) ?? guarded.name };
}

// ─── Angyalszám ───────────────────────────────────────────────────────────

export type AngelHU = {
  title: string;
  message?: string;
  love?: string;
  decision?: string;
  warn?: string;
  oneLine?: string;
  rootNumber?: number;
};

export const aiAngelHU = createServerFn({ method: "POST" })
  .inputValidator(z.object({ number: z.string().regex(/^\d{1,12}$/) }).parse)
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; cached: boolean; reading: AngelHU | null; message?: string }> => {
      const cacheKey = aiCacheKey("angel", data.number);
      const cached = guardAngelHU(await readCache(cacheKey));
      if (cached) return { ok: true, cached: true, reading: cached };

      const { callRoxy } = await import("./roxy.server");
      const r = await callRoxy<unknown>({
        endpoint: `/angel-numbers/lookup?number=${encodeURIComponent(data.number)}`,
        method: "GET",
        cacheKey: `angel:${data.number}`,
        ttlSeconds: DAY_SECONDS * 180,
      });
      if (!r.ok || !r.data)
        return {
          ok: false,
          cached: false,
          reading: null,
          message: "Most nem értem el az angyalszám adatot.",
        };

      const schema = {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          message: { type: "string" },
          love: { type: "string" },
          decision: { type: "string" },
          warn: { type: "string" },
          oneLine: { type: "string" },
          rootNumber: { type: "number" },
        },
        required: ["title"],
      };
      const t = await translateWithAI<AngelHU>({
        source: r.data,
        domainHint: `Angyalszám jelentése (a szám: ${data.number}). A 'title' egy rövid magyar cím a szám üzenetéről.`,
        schemaName: "AngelHU",
        schema,
      });
      const reading = guardAngelHU(t.data);
      if (!t.ok || !reading) return { ok: false, cached: false, reading: null, message: t.error };

      await writeCache(cacheKey, "/ai/angel", reading, STATIC_AI_TRANSLATION_TTL_SECONDS);
      return { ok: true, cached: false, reading };
    },
  );

function guardAngelHU(value: unknown): AngelHU | null {
  return guardAITextObject<AngelHU>(value, ["title"], { oneLine: { oneLine: true } });
}

// ─── Álom ─────────────────────────────────────────────────────────────────

export type DreamHU = {
  title: string;
  surface?: string;
  notice?: string;
  oneLine?: string;
};

export const aiDreamHU = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      slug: z
        .string()
        .min(1)
        .max(64)
        .regex(/^[a-z0-9-]+$/),
    }).parse,
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; cached: boolean; reading: DreamHU | null; message?: string }> => {
      const cacheKey = aiCacheKey("dream", data.slug);
      const cached = guardDreamHU(await readCache(cacheKey));
      if (cached) return { ok: true, cached: true, reading: cached };

      const { callRoxy } = await import("./roxy.server");
      const r = await callRoxy<unknown>({
        endpoint: `/dreams/symbols/${encodeURIComponent(data.slug)}`,
        method: "GET",
        cacheKey: `dream:sym:${data.slug}`,
        ttlSeconds: DAY_SECONDS * 180,
      });
      if (!r.ok || !r.data)
        return {
          ok: false,
          cached: false,
          reading: null,
          message: "Most nem értem el az álom adatot.",
        };

      const schema = {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          surface: { type: "string" },
          notice: { type: "string" },
          oneLine: { type: "string" },
        },
        required: ["title"],
      };
      const t = await translateWithAI<DreamHU>({
        source: r.data,
        domainHint: `Álom-szimbólum jelentése (szimbólum slug: ${data.slug}). A 'title' a szimbólum magyar neve. 'surface' = mit hozhat felszínre, 'notice' = mire érdemes figyelni — belső tükör, nem jóslat.`,
        schemaName: "DreamHU",
        schema,
      });
      const reading = guardDreamHU(t.data);
      if (!t.ok || !reading) return { ok: false, cached: false, reading: null, message: t.error };

      await writeCache(cacheKey, "/ai/dream", reading, STATIC_AI_TRANSLATION_TTL_SECONDS);
      return { ok: true, cached: false, reading };
    },
  );

function guardDreamHU(value: unknown): DreamHU | null {
  return guardAITextObject<DreamHU>(value, ["title"], { oneLine: { oneLine: true } });
}

// ─── Számmisztika (sorsszám) ──────────────────────────────────────────────

export type NumerologyHU = {
  lifePathNumber: number;
  title: string;
  meaning: string;
  strengths?: string;
  shadow?: string;
  love?: string;
  work?: string;
  personalYearNumber?: number;
  personalYearMeaning?: string;
  expressionNumber?: number;
  expressionMeaning?: string;
  soulUrgeNumber?: number;
  soulUrgeMeaning?: string;
  personalityNumber?: number;
  personalityMeaning?: string;
  maturityNumber?: number;
  maturityMeaning?: string;
  birthDayNumber?: number;
  birthDayMeaning?: string;
  oneLine?: string;
};

function splitDate(d: string): { year: number; month: number; day: number } {
  const [y, m, dd] = d.split("-").map(Number);
  return { year: y, month: m, day: dd };
}

export const aiNumerologyHU = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      fullName: z.string().min(1).max(120).optional(),
    }).parse,
  )
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      cached: boolean;
      reading: NumerologyHU | null;
      message?: string;
    }> => {
      const nameKey = (data.fullName ?? "").toLowerCase().trim();
      const cacheKey = aiCacheKey("numerology", data.birthDate, nameKey || "birthdate-only");
      const cached = guardNumerologyHU(await readCache(cacheKey));
      if (cached) return { ok: true, cached: true, reading: cached };

      const { callRoxy } = await import("./roxy.server");
      const ymd = splitDate(data.birthDate);
      const chart = data.fullName
        ? await callRoxy<unknown>({
            endpoint: "/numerology/chart",
            body: { ...ymd, fullName: data.fullName },
            cacheKey: `num:chart:${data.birthDate}:${nameKey}`,
            ttlSeconds: DAY_SECONDS * 365,
          })
        : await callRoxy<unknown>({
            endpoint: "/numerology/life-path",
            body: ymd,
            cacheKey: `num:lifepath:${data.birthDate}`,
            ttlSeconds: DAY_SECONDS * 365,
          });
      if (!chart.ok || !chart.data)
        return {
          ok: false,
          cached: false,
          reading: null,
          message: "Most nem értem el a számmisztika adatot.",
        };

      const schema = {
        type: "object",
        additionalProperties: false,
        properties: {
          lifePathNumber: { type: "number" },
          title: { type: "string" },
          meaning: { type: "string" },
          strengths: { type: "string" },
          shadow: { type: "string" },
          love: { type: "string" },
          work: { type: "string" },
          personalYearNumber: { type: "number" },
          personalYearMeaning: { type: "string" },
          expressionNumber: { type: "number" },
          expressionMeaning: { type: "string" },
          soulUrgeNumber: { type: "number" },
          soulUrgeMeaning: { type: "string" },
          personalityNumber: { type: "number" },
          personalityMeaning: { type: "string" },
          maturityNumber: { type: "number" },
          maturityMeaning: { type: "string" },
          birthDayNumber: { type: "number" },
          birthDayMeaning: { type: "string" },
          oneLine: { type: "string" },
        },
        required: ["lifePathNumber", "title", "meaning"],
      };
      const t = await translateWithAI<NumerologyHU>({
        source: chart.data,
        domainHint:
          "Sorsszám / számmisztika olvasat. A 'lifePathNumber' a forrásban szereplő sorsszám (Life Path Number). 'title' egy rövid magyar cím (pl. 'A vezető', 'A híd', 'Az álmodó'). Ha a forrásban szerepel: expression = Kifejeződésed, soulUrge = Belső vágyad, personality = Külső képed, maturity = Érettségi számod, birthDay = Születésnap-számod. Csak létező számokhoz írj rövid magyar meaning mezőt. A 'personalYearNumber' a forrásból (personal year), ha szerepel.",
        schemaName: "NumerologyHU",
        schema,
      });
      const reading = guardNumerologyHU(t.data);
      if (!t.ok || !reading) return { ok: false, cached: false, reading: null, message: t.error };

      await writeCache(cacheKey, "/ai/numerology", reading, STATIC_AI_TRANSLATION_TTL_SECONDS);
      return { ok: true, cached: false, reading };
    },
  );

function guardNumerologyHU(value: unknown): NumerologyHU | null {
  return guardAITextObject<NumerologyHU>(value, ["lifePathNumber", "title", "meaning"], {
    oneLine: { oneLine: true },
  });
}

// ─── Tarot ────────────────────────────────────────────────────────────────
// Roxy /tarot/daily és /tarot/draw nyers angol mezőit fordítjuk magyarra
// kártya-szinten. Per-kártya cache → ugyanazt a lapot soha nem fordítjuk
// kétszer. Az UI a Roxy localId-ból építi a magyar nevet + képet.

export type TarotCardHU = {
  cardName: string;
  reversed: boolean;
  meaning: string;
  love?: string;
  career?: string;
  finances?: string;
  health?: string;
  spirituality?: string;
  oneLine?: string;
};

export type TarotSlot = {
  roxy: RoxyDrawnCard;
  hu: TarotCardHU;
};

const TAROT_CARD_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    cardName: { type: "string" },
    meaning: { type: "string" },
    love: { type: "string" },
    career: { type: "string" },
    finances: { type: "string" },
    health: { type: "string" },
    spirituality: { type: "string" },
    oneLine: { type: "string" },
  },
  required: ["cardName", "meaning"],
};

function guardTarotCardHU(value: unknown, reversed: boolean): TarotCardHU | null {
  const guarded = guardAITextObject<Omit<TarotCardHU, "reversed">>(
    value,
    ["cardName", "meaning"],
    { oneLine: { oneLine: true } },
  );
  if (!guarded) return null;
  return { ...guarded, reversed };
}

async function translateOneTarotCard(card: RoxyDrawnCard): Promise<TarotCardHU | null> {
  const orient = card.reversed ? "r" : "u";
  const key = aiCacheKey("tarot", "card", card.roxyId || card.localId || card.roxyName, orient);
  const cached = guardTarotCardHU(await readCache(key), card.reversed);
  if (cached) return cached;

  // Ha a Roxy nem küldött forrásszöveget, nincs mit fordítani.
  const hasSource =
    card.meaningEn ||
    card.loveEn ||
    card.careerEn ||
    card.financesEn ||
    card.healthEn ||
    card.spiritualityEn;
  if (!hasSource) return null;

  const source = {
    cardName: card.roxyName,
    reversed: card.reversed,
    keywords: card.keywordsEn ?? [],
    meaning: card.meaningEn ?? null,
    love: card.loveEn ?? null,
    career: card.careerEn ?? null,
    finances: card.financesEn ?? null,
    health: card.healthEn ?? null,
    spirituality: card.spiritualityEn ?? null,
  };

  const t = await translateWithAI<Omit<TarotCardHU, "reversed">>({
    source,
    domainHint: `Tarot lap jelentése (${card.reversed ? "fordított" : "álló"} állás). A 'cardName' a lap magyar neve (pl. 'Kelyhek ásza', 'A Bolond'). Minden mezőt csak akkor adj vissza, ha a forrásban szerepel — semmit ne találj ki. A 'meaning' 3-5 mondat, a témaspecifikus mezők 2-3 mondat.`,
    schemaName: "TarotCardHU",
    schema: TAROT_CARD_SCHEMA,
  });
  const reading = guardTarotCardHU(t.data, card.reversed);
  if (!t.ok || !reading) return null;

  await writeCache(key, "/ai/tarot-card", reading, STATIC_AI_TRANSLATION_TTL_SECONDS);
  return reading;
}

async function translateCards(cards: RoxyDrawnCard[]): Promise<TarotSlot[]> {
  const huList = await Promise.all(cards.map((c) => translateOneTarotCard(c)));
  return cards
    .map((roxy, i) => {
      const hu = huList[i];
      return hu ? ({ roxy, hu } as TarotSlot) : null;
    })
    .filter((s): s is TarotSlot => s !== null);
}

// "Mai lap" — Roxy /tarot/daily + per-kártya magyarítás.
export const aiTarotDailyHU = createServerFn({ method: "POST" })
  .inputValidator(z.object({ dateKey: z.string().min(8).max(20) }).parse)
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      cached: boolean;
      slot: TarotSlot | null;
      message?: string;
    }> => {
      const { callRoxy } = await import("./roxy.server");
      const r = await callRoxy<unknown>({
        endpoint: "/tarot/daily",
        body: { seed: `daily:${data.dateKey}`, date: data.dateKey },
        cacheKey: `tarot:daily:${data.dateKey}`,
        ttlSeconds: DAY_SECONDS,
      });
      if (!r.ok || !r.data)
        return { ok: false, cached: false, slot: null, message: "Most nem értem el a napi lapot." };
      const payload = normalizeRoxyTarotDaily(r.data);
      if (!payload.card)
        return { ok: false, cached: false, slot: null, message: "Üres válasz a forrásból." };
      const slots = await translateCards([payload.card]);
      if (slots.length === 0)
        return {
          ok: false,
          cached: false,
          slot: null,
          message: "A magyarítás most nem sikerült.",
        };
      return { ok: true, cached: r.cached, slot: slots[0] };
    },
  );

// Általános húzás (1..5 lap) — Roxy /tarot/draw + per-kártya magyarítás.
export const aiTarotDrawHU = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      count: z.number().int().min(1).max(5),
      seed: z.string().min(1).max(80).optional(),
      allowReversals: z.boolean().optional(),
    }).parse,
  )
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      cached: boolean;
      slots: TarotSlot[];
      message?: string;
    }> => {
      const { callRoxy } = await import("./roxy.server");
      const r = await callRoxy<unknown>({
        endpoint: "/tarot/draw",
        body: {
          count: data.count,
          allowReversals: data.allowReversals ?? true,
          seed: data.seed,
        },
        cacheKey: `tarot:draw:${data.count}:${data.seed ?? "nosd"}:${data.allowReversals ? 1 : 0}`,
        ttlSeconds: data.seed ? DAY_SECONDS * 7 : null,
      });
      if (!r.ok || !r.data)
        return { ok: false, cached: false, slots: [], message: "Most nem érkezett meg a húzás." };
      const cards = normalizeRoxyDraw(r.data);
      if (cards.length === 0)
        return { ok: false, cached: false, slots: [], message: "Üres válasz a forrásból." };
      const slots = await translateCards(cards);
      if (slots.length === 0)
        return {
          ok: false,
          cached: false,
          slots: [],
          message: "A magyarítás most nem sikerült.",
        };
      return { ok: true, cached: r.cached, slots };
    },
  );

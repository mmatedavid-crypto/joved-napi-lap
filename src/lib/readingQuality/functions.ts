import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeRoxyCompat } from "../roxyNormalize";
import {
  buildQualitySystemPrompt,
  buildQualityUserPrompt,
  QUALITY_OUTPUT_SCHEMA,
  READING_QUALITY_PROMPT_VERSION,
} from "./prompts";
import {
  calculateCompatibilityProfile,
  composeCompatibilityReading,
  type CompatibilityProfile,
} from "./compatibilityEngine";
import {
  calculateNumerologyProfile,
  composeNumerologyReading,
  type NumerologyProfile,
} from "./numerologyEngine";
import { guardQualityReading } from "./qualityGuard";
import { composeHoroscopeReading } from "./horoscopeEngine";
import { READING_QUALITY_MODEL, SAFETY_NOTE, type QualityReading } from "./styleRules";

const BirthDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function splitDate(d: string): { year: number; month: number; day: number } {
  const [year, month, day] = d.split("-").map(Number);
  return { year, month, day };
}

type QualityEnvelopeBase = {
  ok: boolean;
  cached: boolean;
  fallbackUsed: boolean;
  reading: QualityReading | null;
  message?: string;
};
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type QualityEnvelope<TExtra extends Record<string, unknown> | object = {}> = QualityEnvelopeBase &
  TExtra;

async function generateQualityReading(opts: {
  readingType: "numerology" | "compatibility" | "tarot" | "horoscope";
  userInput: unknown;
  sourceData: unknown;
  requiredSections: string[];
  anchors: string[];
  fallback: QualityReading;
}): Promise<{ reading: QualityReading; fallbackUsed: boolean }> {
  const { aiJSON } = await import("../ai.server");
  const started = Date.now();
  const ai = await aiJSON<QualityReading>({
    system: buildQualitySystemPrompt(),
    user: buildQualityUserPrompt({
      readingType: opts.readingType,
      mode: "free",
      userInput: opts.userInput,
      sourceData: opts.sourceData,
      requiredSections: opts.requiredSections,
    }),
    schemaName: "QualityReading",
    schema: QUALITY_OUTPUT_SCHEMA as unknown as Record<string, unknown>,
    model: READING_QUALITY_MODEL,
    readingType: opts.readingType,
  });

  if (ai.ok && ai.data) {
    const guard = guardQualityReading(ai.data, opts.anchors);
    if (guard.ok) {
      return {
        reading: {
          ...ai.data,
          safetyNote: ai.data.safetyNote || SAFETY_NOTE,
          meta: {
            ...ai.data.meta,
            model: READING_QUALITY_MODEL,
            promptVersion: READING_QUALITY_PROMPT_VERSION,
            latencyMs: Date.now() - started,
            fallbackUsed: false,
            readingType: opts.readingType,
          },
        },
        fallbackUsed: false,
      };
    }
  }

  return {
    reading: {
      ...opts.fallback,
      meta: {
        ...opts.fallback.meta,
        model: READING_QUALITY_MODEL,
        promptVersion: READING_QUALITY_PROMPT_VERSION,
        latencyMs: Date.now() - started,
        fallbackUsed: true,
        readingType: opts.readingType,
      },
    },
    fallbackUsed: true,
  };
}

async function readCachedReading(cacheKey: string): Promise<QualityReading | null> {
  const { readReadingCache } = await import("./readingCache.server");
  return readReadingCache(cacheKey);
}

async function writeCachedReading(
  cacheKey: string,
  endpoint: string,
  reading: QualityReading,
  ttlSeconds: number,
): Promise<void> {
  const { writeReadingCache } = await import("./readingCache.server");
  await writeReadingCache(cacheKey, endpoint, reading, ttlSeconds);
}

export const qualityNumerologyReading = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate: BirthDate,
      fullName: z.string().min(1).max(120).optional(),
      preferredName: z.string().min(1).max(60).optional(),
    }).parse,
  )
  .handler(async ({ data }): Promise<QualityEnvelope<{ profile: NumerologyProfile | null }>> => {
    const profile = calculateNumerologyProfile({
      birthDate: data.birthDate,
      fullName: data.fullName,
    });
    const fallback = composeNumerologyReading(profile);
    const cacheKey = `reading_ai:${READING_QUALITY_PROMPT_VERSION}:numerology:${data.birthDate}:${(data.fullName ?? "").toLowerCase().trim()}:${(data.preferredName ?? "").toLowerCase().trim()}`;
    const hit = await readCachedReading(cacheKey);
    if (hit) {
      return { ok: true, cached: true, fallbackUsed: false, reading: hit, profile };
    }
    const generated = await generateQualityReading({
      readingType: "numerology",
      userInput: data,
      sourceData: {
        profile,
        localFallback: fallback,
        preferredName: data.preferredName,
        nameNote: data.preferredName
          ? `A felhasználót MINDIG így szólítsd a szövegben, ha nevet írsz: "${data.preferredName}". Ne használd a teljes nevét vagy a családnevét megszólításnak.`
          : undefined,
      },
      requiredSections: [
        "A sorsszámod",
        "Mit mutat rólad?",
        "Belső hajtóerőd",
        "Amit mások először látnak belőled",
        "Szerelemben",
        "Munkában",
        "Árnyékoldal",
        "Az idei személyes éved",
      ],
      anchors: [
        String(profile.lifePathNumber),
        String(profile.personalYearNumber),
        data.fullName ?? "",
      ],
      fallback,
    });
    if (!generated.fallbackUsed && generated.reading) {
      // 30 napig kacheljük — a sorsszám és a személyes év stabil
      await writeCachedReading(cacheKey, "ai:numerology", generated.reading, 60 * 60 * 24 * 30);
    }
    return {
      ok: true,
      cached: false,
      fallbackUsed: generated.fallbackUsed,
      reading: generated.reading,
      profile,
    };
  });

export const qualityCompatibilityReading = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDateA: BirthDate,
      birthDateB: BirthDate,
      fullNameA: z.string().min(1).max(120).optional(),
      fullNameB: z.string().min(1).max(120).optional(),
      status: z.string().max(80).optional(),
      memoryContext: z.string().max(1600).optional(),
    }).parse,
  )
  .handler(async ({ data }): Promise<QualityEnvelope<{ profile: CompatibilityProfile | null }>> => {
    const compatCacheKey = `reading_ai:${READING_QUALITY_PROMPT_VERSION}:compat:${data.birthDateA}:${data.birthDateB}:${(data.fullNameA ?? "").toLowerCase().trim()}:${(data.fullNameB ?? "").toLowerCase().trim()}:${(data.status ?? "").toLowerCase().trim()}:${(data.memoryContext ?? "").toLowerCase().trim().slice(0, 160)}`;
    const compatHit = await readCachedReading(compatCacheKey);
    if (compatHit) {
      return {
        ok: true,
        cached: true,
        fallbackUsed: false,
        reading: compatHit,
        profile: null,
      };
    }
    let roxy: unknown = null;
    try {
      const { callRoxy } = await import("../roxy.server");
      const r = await callRoxy<unknown>({
        endpoint: "/numerology/compatibility",
        body: {
          person1: { ...splitDate(data.birthDateA), fullName: data.fullNameA },
          person2: { ...splitDate(data.birthDateB), fullName: data.fullNameB },
        },
        cacheKey: `num:compat:${data.birthDateA}:${data.birthDateB}:${(data.fullNameA ?? "").toLowerCase().trim()}:${(data.fullNameB ?? "").toLowerCase().trim()}`,
        ttlSeconds: 60 * 60 * 24 * 90,
      });
      roxy = r.ok ? r.data : null;
    } catch {
      roxy = null;
    }
    const normalized = normalizeRoxyCompat(roxy);
    const profile = calculateCompatibilityProfile({
      birthDateA: data.birthDateA,
      birthDateB: data.birthDateB,
      fullNameA: data.fullNameA,
      fullNameB: data.fullNameB,
      status: data.status,
      communication: normalized.communication,
      attraction: normalized.attraction,
      longTerm: normalized.longTerm,
    });
    if (normalized.score) profile.score = normalized.score;
    const fallback = composeCompatibilityReading(profile);
    const generated = await generateQualityReading({
      readingType: "compatibility",
      userInput: data,
      sourceData: {
        profile,
        roxy: normalized,
        localFallback: fallback,
        memoryContext: data.memoryContext,
      },
      requiredSections: [
        "Összeillés",
        "A kapcsolat alapmintája",
        "A helyzet szerint",
        "Miért erős köztetek?",
        "Hol akadhattok el?",
        "Kommunikáció",
        "Vonzalom",
        "Biztonság vagy szabadság?",
        "Hosszú táv",
        "Mire kell figyelni?",
      ],
      anchors: [
        String(profile.personA.lifePathNumber),
        String(profile.personB.lifePathNumber),
        data.status ?? "",
      ],
      fallback,
    });
    if (!generated.fallbackUsed && generated.reading) {
      await writeCachedReading(compatCacheKey, "ai:compat", generated.reading, 60 * 60 * 24 * 30);
    }
    return {
      ok: true,
      cached: false,
      fallbackUsed: generated.fallbackUsed,
      reading: generated.reading,
      profile,
    };
  });

export const qualityHoroscopeReading = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sign: z.enum([
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
      ]),
      dateKey: z.string().min(8).max(20),
    }).parse,
  )
  .handler(async ({ data }): Promise<QualityEnvelope> => {
    const horoCacheKey = `reading_ai:${READING_QUALITY_PROMPT_VERSION}:horoscope:${data.sign}:${data.dateKey}`;
    const horoHit = await readCachedReading(horoCacheKey);
    if (horoHit) {
      return { ok: true, cached: true, fallbackUsed: false, reading: horoHit };
    }
    let roxy: unknown = null;
    try {
      const { callRoxy } = await import("../roxy.server");
      const r = await callRoxy<unknown>({
        endpoint: `/astrology/horoscope/${data.sign}/daily`,
        method: "GET",
        cacheKey: `astro:daily:${data.sign}:${data.dateKey}`,
        ttlSeconds: 60 * 60 * 24,
      });
      roxy = r.ok ? r.data : null;
    } catch {
      roxy = null;
    }
    const fallback = composeHoroscopeReading({
      sign: data.sign,
      dateKey: data.dateKey,
      roxySource: roxy,
    });
    const generated = await generateQualityReading({
      readingType: "horoscope",
      userInput: data,
      sourceData: { roxy, localFallback: fallback },
      requiredSections: ["Mai hangulat", "Szerelem", "Munka", "Mire figyelj?"],
      anchors: [data.sign, data.dateKey],
      fallback,
    });
    if (!generated.fallbackUsed && generated.reading) {
      // 24h-ig kacheljük — egy adott jegy + dátum kombinációra elég egyszer kérni
      await writeCachedReading(horoCacheKey, "ai:horoscope", generated.reading, 60 * 60 * 24);
    }
    return {
      ok: true,
      cached: false,
      fallbackUsed: generated.fallbackUsed,
      reading: generated.reading,
    };
  });

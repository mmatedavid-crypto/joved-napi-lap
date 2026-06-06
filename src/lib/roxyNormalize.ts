// Pure mapping helpers. Client-safe (no secrets, no DB). Translates raw Roxy
// payloads into Jövőd's Hungarian structures. We DO NOT show raw Roxy text
// to the user — these mappers extract numbers/flags only.

// Major Arcana canonical order 0..21 maps to our local card ids.
export const MAJOR_ARCANA_ID_BY_INDEX = [
  "bolond", "mago", "fopapno", "csaszarno", "csaszar",
  "fopap", "szeretok", "diadalszeker", "ero", "remete",
  "kerek", "igazsag", "akasztott", "halal", "mertekletesseg",
  "ordog", "torony", "csillag", "hold", "nap", "itelet", "vilag",
] as const;

// Common English → local id fallbacks if Roxy returns names instead of indices.
const ENGLISH_NAME_TO_ID: Record<string, string> = {
  "the fool": "bolond",
  "the magician": "mago",
  "the high priestess": "fopapno",
  "the empress": "csaszarno",
  "the emperor": "csaszar",
  "the hierophant": "fopap",
  "the lovers": "szeretok",
  "the chariot": "diadalszeker",
  "strength": "ero",
  "the hermit": "remete",
  "wheel of fortune": "kerek",
  "justice": "igazsag",
  "the hanged man": "akasztott",
  "death": "halal",
  "temperance": "mertekletesseg",
  "the devil": "ordog",
  "the tower": "torony",
  "the star": "csillag",
  "the moon": "hold",
  "the sun": "nap",
  "judgement": "itelet",
  "judgment": "itelet",
  "the world": "vilag",
};

export function roxyCardToLocalId(raw: unknown): string | null {
  if (raw == null) return null;
  // numeric index 0..21
  if (typeof raw === "number" && raw >= 0 && raw < 22) {
    return MAJOR_ARCANA_ID_BY_INDEX[raw] ?? null;
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const idx = obj.number ?? obj.index ?? obj.id;
    if (typeof idx === "number" && idx >= 0 && idx < 22) {
      return MAJOR_ARCANA_ID_BY_INDEX[idx] ?? null;
    }
    const name = obj.name ?? obj.card ?? obj.title;
    if (typeof name === "string") return ENGLISH_NAME_TO_ID[name.toLowerCase().trim()] ?? null;
  }
  if (typeof raw === "string") {
    return ENGLISH_NAME_TO_ID[raw.toLowerCase().trim()] ?? null;
  }
  return null;
}

// ─── Numerology ────────────────────────────────────────────────────────────

export type RoxyChart = {
  lifePath?: number;
  expression?: number;
  soulUrge?: number;
  personality?: number;
  birthDay?: number;
  maturity?: number;
  personalYear?: number;
  karmic?: number[];
};

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
    if (typeof v === "object" && v !== null) {
      const inner = v as Record<string, unknown>;
      if (typeof inner.number === "number") return inner.number;
      if (typeof inner.value === "number") return inner.value;
    }
  }
  return undefined;
}

export function normalizeRoxyChart(raw: unknown): RoxyChart {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;
  return {
    lifePath: pickNumber(data, ["life_path", "lifePath", "lifepath"]),
    expression: pickNumber(data, ["expression", "destiny"]),
    soulUrge: pickNumber(data, ["soul_urge", "soulUrge", "heart_desire", "heartDesire"]),
    personality: pickNumber(data, ["personality"]),
    birthDay: pickNumber(data, ["birth_day", "birthDay", "birthday"]),
    maturity: pickNumber(data, ["maturity"]),
    personalYear: pickNumber(data, ["personal_year", "personalYear"]),
    karmic: Array.isArray(data.karmic_lessons) ? (data.karmic_lessons as number[]) :
            Array.isArray(data.karmicLessons) ? (data.karmicLessons as number[]) : undefined,
  };
}

export type RoxyCompat = {
  score?: number;
  lifePathA?: number;
  lifePathB?: number;
  communication?: number;
  attraction?: number;
  longTerm?: number;
};

export function normalizeRoxyCompat(raw: unknown): RoxyCompat {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;
  return {
    score: pickNumber(data, ["compatibility_score", "compatibilityScore", "score", "overall"]),
    lifePathA: pickNumber(data, ["life_path_1", "lifePath1", "person1_life_path"]),
    lifePathB: pickNumber(data, ["life_path_2", "lifePath2", "person2_life_path"]),
    communication: pickNumber(data, ["communication"]),
    attraction: pickNumber(data, ["attraction", "romance"]),
    longTerm: pickNumber(data, ["long_term", "longTerm", "longevity"]),
  };
}
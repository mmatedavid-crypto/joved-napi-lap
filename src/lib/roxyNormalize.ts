// Pure mapping helpers. Client-safe (no secrets, no DB). Translates raw Roxy
// payloads into Jövőd's Hungarian structures. We DO NOT show raw Roxy text
// to the user — these mappers extract numbers/flags only.

// Major Arcana canonical order 0..21 maps to our local card ids.
export const MAJOR_ARCANA_ID_BY_INDEX = [
  "bolond",
  "mago",
  "fopapno",
  "csaszarno",
  "csaszar",
  "fopap",
  "szeretok",
  "diadalszeker",
  "ero",
  "remete",
  "kerek",
  "igazsag",
  "akasztott",
  "halal",
  "mertekletesseg",
  "ordog",
  "torony",
  "csillag",
  "hold",
  "nap",
  "itelet",
  "vilag",
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
  strength: "ero",
  "the hermit": "remete",
  "wheel of fortune": "kerek",
  justice: "igazsag",
  "the hanged man": "akasztott",
  death: "halal",
  temperance: "mertekletesseg",
  "the devil": "ordog",
  "the tower": "torony",
  "the star": "csillag",
  "the moon": "hold",
  "the sun": "nap",
  judgement: "itelet",
  judgment: "itelet",
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
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<
    string,
    unknown
  >;
  // Roxy /numerology/chart nests numbers under `coreNumbers`, each carrying { number, ... }.
  const core = (
    data.coreNumbers && typeof data.coreNumbers === "object" ? data.coreNumbers : data
  ) as Record<string, unknown>;
  return {
    lifePath: pickNumber(core, ["lifePath", "life_path", "lifepath"]),
    expression: pickNumber(core, ["expression", "destiny"]),
    soulUrge: pickNumber(core, ["soulUrge", "soul_urge", "heartDesire", "heart_desire"]),
    personality: pickNumber(core, ["personality"]),
    birthDay: pickNumber(core, ["birthDay", "birth_day", "birthday"]),
    maturity: pickNumber(core, ["maturity"]),
    personalYear: pickNumber(data, ["personalYear", "personal_year"]),
    karmic: Array.isArray(data.karmicLessons)
      ? (data.karmicLessons as number[])
      : Array.isArray(data.karmic_lessons)
        ? (data.karmic_lessons as number[])
        : undefined,
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
  const data = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<
    string,
    unknown
  >;
  return {
    score: pickNumber(data, [
      "compatibilityScore",
      "compatibility_score",
      "score",
      "overall",
      "percentage",
    ]),
    lifePathA: pickNumber(data, ["lifePath1", "life_path_1", "person1_life_path"]),
    lifePathB: pickNumber(data, ["lifePath2", "life_path_2", "person2_life_path"]),
    communication: pickNumber(data, ["communication"]),
    attraction: pickNumber(data, ["attraction", "romance"]),
    longTerm: pickNumber(data, ["longTerm", "long_term", "longevity"]),
  };
}

// ─── Tarot draw ────────────────────────────────────────────────────────────
// Roxy /tarot/draw -> { cards: [DrawnCard] }
// Roxy /tarot/spreads/* -> { positions: [{ card: DrawnCard, ... }] }
// DrawnCard: { id, name, arcana, suit, number, position, reversed, keywords, meaning, imageUrl }

export type RoxyDrawnCard = {
  roxyId: string; // e.g. "the-fool", "ace-of-cups"
  roxyName: string; // english name
  arcana: "major" | "minor" | "unknown";
  suit?: string;
  number?: number;
  reversed: boolean;
  localId: string | null; // mapped to our card id when Major Arcana
};

// Roxy Major Arcana ids → our local Hungarian ids.
const ROXY_MAJOR_ID_TO_LOCAL: Record<string, string> = {
  "the-fool": "bolond",
  "the-magician": "mago",
  "the-high-priestess": "fopapno",
  "the-empress": "csaszarno",
  "the-emperor": "csaszar",
  "the-hierophant": "fopap",
  "the-lovers": "szeretok",
  "the-chariot": "diadalszeker",
  strength: "ero",
  "the-hermit": "remete",
  "wheel-of-fortune": "kerek",
  justice: "igazsag",
  "the-hanged-man": "akasztott",
  death: "halal",
  temperance: "mertekletesseg",
  "the-devil": "ordog",
  "the-tower": "torony",
  "the-star": "csillag",
  "the-moon": "hold",
  "the-sun": "nap",
  judgement: "itelet",
  judgment: "itelet",
  "the-world": "vilag",
};

// Roxy Minor Arcana suit names → our local suit slug.
const ROXY_SUIT_TO_LOCAL: Record<string, string> = {
  cups: "kelyhek",
  pentacles: "ermek",
  coins: "ermek",
  swords: "kardok",
  wands: "botok",
  rods: "botok",
};

// Roxy rank words (lowercased) → our local rank id.
const ROXY_RANK_TO_LOCAL: Record<string, string> = {
  ace: "asz",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  page: "aprod",
  knight: "lovag",
  queen: "kiralyno",
  king: "kiraly",
};

// Map a Roxy minor card id (e.g. "ace-of-cups", "two-of-wands", "knight-of-pentacles")
// or its English name ("Ace of Cups") to our local id like "kelyhek-asz".
function roxyMinorToLocal(
  roxyId: string | undefined,
  roxyName: string | undefined,
  suit: string | undefined,
  number: number | undefined,
): string | null {
  const localSuit =
    (suit && ROXY_SUIT_TO_LOCAL[suit.toLowerCase()]) ||
    null;

  // Try parsing the slug-style id first: "<rank>-of-<suit>"
  const idLow = (roxyId ?? "").toLowerCase().trim();
  const idMatch = idLow.match(/^([a-z]+)-of-([a-z]+)$/);
  if (idMatch) {
    const rankWord = idMatch[1];
    const suitWord = idMatch[2];
    const ls = ROXY_SUIT_TO_LOCAL[suitWord];
    const lr = ROXY_RANK_TO_LOCAL[rankWord];
    if (ls && lr) return `${ls}-${lr}`;
  }

  // Try parsing the English name: "Ace of Cups", "Two of Wands"
  const nameLow = (roxyName ?? "").toLowerCase().trim();
  const nameMatch = nameLow.match(/^([a-z]+)\s+of\s+([a-z]+)$/);
  if (nameMatch) {
    const rankWord = nameMatch[1];
    const suitWord = nameMatch[2];
    const ls = ROXY_SUIT_TO_LOCAL[suitWord];
    const lr = ROXY_RANK_TO_LOCAL[rankWord];
    if (ls && lr) return `${ls}-${lr}`;
  }

  // Fall back: combine suit + number if both present.
  if (localSuit && typeof number === "number" && number >= 1 && number <= 10) {
    return `${localSuit}-${number === 1 ? "asz" : String(number)}`;
  }

  return null;
}

function normalizeOneDrawn(raw: unknown): RoxyDrawnCard | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const roxyId = typeof c.id === "string" ? c.id : "";
  const roxyName = typeof c.name === "string" ? c.name : "";
  const arcanaRaw = typeof c.arcana === "string" ? c.arcana.toLowerCase() : "";
  const arcana: RoxyDrawnCard["arcana"] =
    arcanaRaw === "major" ? "major" : arcanaRaw === "minor" ? "minor" : "unknown";
  const suit = typeof c.suit === "string" ? c.suit : undefined;
  const number = typeof c.number === "number" ? c.number : undefined;
  return {
    roxyId,
    roxyName,
    arcana,
    suit,
    number,
    reversed: c.reversed === true,
    localId:
      arcana === "major"
        ? (ROXY_MAJOR_ID_TO_LOCAL[roxyId] ?? null)
        : arcana === "minor"
          ? roxyMinorToLocal(roxyId, roxyName, suit, number)
          : (ROXY_MAJOR_ID_TO_LOCAL[roxyId] ?? roxyMinorToLocal(roxyId, roxyName, suit, number)),
  };
}

export function normalizeRoxyDraw(raw: unknown): RoxyDrawnCard[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.cards)) {
    return r.cards.map(normalizeOneDrawn).filter((x): x is RoxyDrawnCard => x !== null);
  }
  if (Array.isArray(r.positions)) {
    return r.positions
      .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>).card : null))
      .map(normalizeOneDrawn)
      .filter((x): x is RoxyDrawnCard => x !== null);
  }
  return [];
}

// Hungarian suit names for Minor Arcana fallback display.
export function huSuitName(suit?: string): string {
  switch ((suit ?? "").toLowerCase()) {
    case "cups":
      return "Kelyhek";
    case "pentacles":
    case "coins":
      return "Érmék";
    case "swords":
      return "Kardok";
    case "wands":
    case "rods":
      return "Botok";
    default:
      return "";
  }
}

// ─── I-Ching ───────────────────────────────────────────────────────────────

export type RoxyHexagram = {
  number?: number; // 1..64
  symbol?: string; // unicode hexagram glyph
  pinyin?: string;
  // Raw english fields (judgment, image, interpretation) are NOT shown to
  // the user. UI uses our local Hungarian text keyed by `number`.
};

export type RoxyIchingCast = {
  primary?: RoxyHexagram;
  resulting?: RoxyHexagram;
  changingLines?: number[];
};

function pickHex(obj: unknown): RoxyHexagram | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  return {
    number: typeof o.number === "number" ? o.number : undefined,
    symbol: typeof o.symbol === "string" ? o.symbol : undefined,
    pinyin: typeof o.pinyin === "string" ? o.pinyin : undefined,
  };
}

export function normalizeRoxyIching(raw: unknown): RoxyIchingCast {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  return {
    primary: pickHex(r.hexagram ?? r.primary),
    resulting: pickHex(r.resultingHexagram ?? r.resulting),
    changingLines: Array.isArray(r.changingLinePositions)
      ? (r.changingLinePositions as number[])
      : Array.isArray(r.changingLines)
        ? (r.changingLines as number[])
        : undefined,
  };
}

// ─── Biorhythm ─────────────────────────────────────────────────────────────

export type RoxyBiorhythm = {
  physical?: number; // -1..1
  emotional?: number;
  intellectual?: number;
};

export function normalizeRoxyBiorhythm(raw: unknown): RoxyBiorhythm {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const data = (r.data && typeof r.data === "object" ? r.data : r) as Record<string, unknown>;
  const cycles = (data.cycles && typeof data.cycles === "object" ? data.cycles : data) as Record<
    string,
    unknown
  >;
  return {
    physical: pickNumber(cycles, ["physical"]),
    emotional: pickNumber(cycles, ["emotional"]),
    intellectual: pickNumber(cycles, ["intellectual"]),
  };
}

export function bioPhraseHU(v?: number): string {
  if (v == null) return "";
  if (v >= 0.5) return "felfelé tartó hullám — érdemes most belevágni";
  if (v >= 0) return "stabil, kiegyensúlyozott";
  if (v >= -0.5) return "lassuló — érdemes több pihenőt beiktatni";
  return "mélyponton — ne erőltesd, amit halaszthatsz";
}

// ─── Astrology / daily horoscope ───────────────────────────────────────────
// Returns moonPhase / moonSign for the "Mai iránytű" compass too.

export type RoxyHoroscope = {
  date?: string;
  energyRating?: number;
  luckyNumber?: number;
  luckyColor?: string;
  moonPhase?: string; // english
  moonSign?: string; // english lowercase sign
};

export function normalizeRoxyHoroscope(raw: unknown): RoxyHoroscope {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  return {
    date: typeof r.date === "string" ? r.date : undefined,
    energyRating: typeof r.energyRating === "number" ? r.energyRating : undefined,
    luckyNumber: typeof r.luckyNumber === "number" ? r.luckyNumber : undefined,
    luckyColor: typeof r.luckyColor === "string" ? r.luckyColor : undefined,
    moonPhase: typeof r.moonPhase === "string" ? r.moonPhase : undefined,
    moonSign: typeof r.moonSign === "string" ? r.moonSign : undefined,
  };
}

// Hungarian translations of the small, controlled vocabulary we render.

export const SIGN_HU: Record<string, string> = {
  aries: "Kos",
  taurus: "Bika",
  gemini: "Ikrek",
  cancer: "Rák",
  leo: "Oroszlán",
  virgo: "Szűz",
  libra: "Mérleg",
  scorpio: "Skorpió",
  sagittarius: "Nyilas",
  capricorn: "Bak",
  aquarius: "Vízöntő",
  pisces: "Halak",
};

export const SIGNS_HU_ORDERED = [
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
] as const;

// Determine zodiac sign from an ISO birth date (YYYY-MM-DD). Uses tropical
// date ranges. Returns one of SIGNS_HU_ORDERED, or null if input is invalid.
export function zodiacFromDob(iso?: string): string | null {
  if (!iso || iso.length < 10) return null;
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  if (!m || !d) return null;
  const md = m * 100 + d;
  if (md >= 321 && md <= 419) return "aries";
  if (md >= 420 && md <= 520) return "taurus";
  if (md >= 521 && md <= 620) return "gemini";
  if (md >= 621 && md <= 722) return "cancer";
  if (md >= 723 && md <= 822) return "leo";
  if (md >= 823 && md <= 922) return "virgo";
  if (md >= 923 && md <= 1022) return "libra";
  if (md >= 1023 && md <= 1121) return "scorpio";
  if (md >= 1122 && md <= 1221) return "sagittarius";
  if (md >= 1222 || md <= 119) return "capricorn";
  if (md >= 120 && md <= 218) return "aquarius";
  return "pisces";
}

const MOON_PHASE_HU: Record<string, string> = {
  "new moon": "Újhold",
  "waxing crescent": "Növekvő sarló",
  "first quarter": "Növekvő félhold",
  "waxing gibbous": "Növekvő telihold előtt",
  "full moon": "Telihold",
  "waning gibbous": "Fogyó telihold után",
  "last quarter": "Fogyó félhold",
  "waning crescent": "Fogyó sarló",
};

export function moonPhaseHU(en?: string): string | null {
  if (!en) return null;
  return MOON_PHASE_HU[en.toLowerCase()] ?? null;
}

// ─── Angel numbers ─────────────────────────────────────────────────────────

export type RoxyAngel = {
  number?: string;
  rootNumber?: number;
  // English narrative ignored; we render local Hungarian copy keyed by rootNumber.
};

export function normalizeRoxyAngel(raw: unknown): RoxyAngel {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const data = (r.data && typeof r.data === "object" ? r.data : r) as Record<string, unknown>;
  return {
    number:
      typeof data.number === "string"
        ? data.number
        : typeof data.number === "number"
          ? String(data.number)
          : undefined,
    rootNumber: pickNumber(data, [
      "rootNumber",
      "root_number",
      "digitRoot",
      "digit_root",
      "reduced",
    ]),
  };
}

// ─── Crystals ──────────────────────────────────────────────────────────────

export type RoxyCrystal = {
  name?: string; // english crystal name — kept for badge only
  hungarianName?: string;
};

const CRYSTAL_NAME_HU: Record<string, string> = {
  amethyst: "Ametiszt",
  "rose quartz": "Rózsakvarc",
  "clear quartz": "Hegyikristály",
  citrine: "Citrin",
  carnelian: "Karneol",
  obsidian: "Obszidián",
  moonstone: "Holdkő",
  labradorite: "Labradorit",
  "lapis lazuli": "Lapis lazuli",
  "tiger's eye": "Tigrisszem",
  "tigers eye": "Tigrisszem",
  "black tourmaline": "Fekete turmalin",
  selenite: "Szelenit",
  fluorite: "Fluorit",
  malachite: "Malachit",
  pyrite: "Pirit",
  hematite: "Hematit",
  jade: "Jade",
  agate: "Achát",
  garnet: "Gránát",
  aquamarine: "Akvamarin",
  emerald: "Smaragd",
  sapphire: "Zafír",
  ruby: "Rubin",
  topaz: "Topáz",
  opal: "Opál",
  turquoise: "Türkiz",
  peridot: "Peridot",
  onyx: "Ónix",
  diamond: "Gyémánt",
};

export function normalizeRoxyCrystal(raw: unknown): RoxyCrystal {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const data = (r.data && typeof r.data === "object" ? r.data : r) as Record<string, unknown>;
  // Roxy can return a single crystal object or an array; we take the first.
  let candidate: Record<string, unknown> | null = null;
  if (typeof data.name === "string") candidate = data;
  else if (
    Array.isArray(data.crystals) &&
    data.crystals.length > 0 &&
    typeof data.crystals[0] === "object"
  ) {
    candidate = data.crystals[0] as Record<string, unknown>;
  } else if (Array.isArray(r) && r.length > 0 && typeof (r as unknown[])[0] === "object") {
    candidate = (r as unknown[])[0] as Record<string, unknown>;
  }
  if (!candidate) return {};
  const name = typeof candidate.name === "string" ? candidate.name : undefined;
  return {
    name,
    hungarianName: name ? (CRYSTAL_NAME_HU[name.toLowerCase()] ?? name) : undefined,
  };
}

// ─── Dreams ────────────────────────────────────────────────────────────────
// Free-text dream interpretation isn't a single Roxy endpoint — we do simple
// Hungarian keyword → english slug mapping and call /dreams/symbols/{slug}.

const DREAM_KEYWORD_TO_SLUG: Array<[RegExp, string]> = [
  [/\b(rep[üu]l(?:és|tem|ni|ök)?)\b/i, "flying"],
  [/\b(esés|esem|estem|leestem|zuhan)\b/i, "falling"],
  [/\b(v[íi]z|tenger|óceán|folyó|tó)\b/i, "water"],
  [/\b(k[íi]gy[óo])\b/i, "snake"],
  [/\b(pók)\b/i, "spider"],
  [/\b(h[áa]z|otthon|lak[áa]s)\b/i, "house"],
  [/\b(hal[áa]l|halott|temetés)\b/i, "death"],
  [/\b(fog|fogam|fogaim)\b/i, "teeth"],
  [/\b(autó|vez(?:etés|etek|et))\b/i, "car"],
  [/\b(üldöz|menek[üu]l)\b/i, "chase"],
  [/\b(t[űu]z|égett|égő)\b/i, "fire"],
  [/\b(csecsem[őo]|baba|gyerek)\b/i, "baby"],
  [/\b(eskü?vő|h[áa]zass[áa]g)\b/i, "wedding"],
  [/\b(meztelen)\b/i, "naked"],
  [/\b(p[éé]nz)\b/i, "money"],
  [/\b(lépcs[őo])\b/i, "stairs"],
  [/\b(macska)\b/i, "cat"],
  [/\b(kutya)\b/i, "dog"],
];

export function dreamTextToSlug(text: string): string | null {
  if (!text) return null;
  for (const [re, slug] of DREAM_KEYWORD_TO_SLUG) {
    if (re.test(text)) return slug;
  }
  return null;
}

export type RoxyDreamSymbol = {
  slug?: string;
  hungarianName?: string;
};

const DREAM_HU_NAME: Record<string, string> = {
  flying: "Repülés",
  falling: "Esés",
  water: "Víz",
  snake: "Kígyó",
  spider: "Pók",
  house: "Ház",
  death: "Halál",
  teeth: "Fogak",
  car: "Autó",
  chase: "Üldözés",
  fire: "Tűz",
  baby: "Csecsemő",
  wedding: "Esküvő",
  naked: "Meztelenség",
  money: "Pénz",
  stairs: "Lépcső",
  cat: "Macska",
  dog: "Kutya",
};

export function normalizeRoxyDreamSymbol(raw: unknown, slug: string): RoxyDreamSymbol {
  void raw; // english text not shown to user
  return { slug, hungarianName: DREAM_HU_NAME[slug] ?? slug };
}

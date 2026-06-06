type GuardOptions = {
  oneLine?: boolean;
  allowCrystalName?: boolean;
};

const FORBIDDEN_HU = [
  "összességében",
  "fontos megjegyezni",
  "kommunikálj nyíltan és őszintén",
  "as an ai",
  "légy önmagad",
  "higgy magadban",
  "minden okkal történik",
  "az univerzum melletted áll",
  "engedd el",
  "figyelj a jelekre",
  "hallgass a szívedre",
  "minden rendben lesz",
  "minden a helyére kerül",
];

const RAW_ENGLISH_RE =
  /\b(today|tomorrow|daily|general|overall|horoscope|zodiac|love|romance|career|work|money|health|wealth|lucky|color|moon|phase|energy|warning|advice|relationship|communication|attraction|interpretation|meaning|symbol|dream|healing|provider|endpoint)\b/i;

const CRYSTAL_NAME_HU: Record<string, string> = {
  amethyst: "Ametiszt",
  "rose quartz": "Rózsakvarc",
  "clear quartz": "Hegyikristály",
  quartz: "Hegyikristály",
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

const COLOR_HU: Record<string, string> = {
  red: "vörös",
  crimson: "bíbor",
  pink: "rózsaszín",
  orange: "narancs",
  yellow: "sárga",
  gold: "arany",
  green: "zöld",
  emerald: "smaragdzöld",
  blue: "kék",
  navy: "tengerkék",
  indigo: "indigó",
  purple: "lila",
  violet: "ibolya",
  white: "fehér",
  silver: "ezüst",
  black: "fekete",
  brown: "barna",
  grey: "szürke",
  gray: "szürke",
  turquoise: "türkiz",
};

const MOON_PHASE_HU: Record<string, string> = {
  "new moon": "Újhold",
  "waxing crescent": "Növekvő sarló",
  "first quarter": "Növekvő félhold",
  "waxing gibbous": "Növekvő hold",
  "full moon": "Telihold",
  "waning gibbous": "Fogyó hold",
  "last quarter": "Fogyó félhold",
  "waning crescent": "Fogyó sarló",
};

export function polishCrystalNameHU(value?: string): string | undefined {
  if (!value) return undefined;
  const key = value.toLowerCase().trim();
  return CRYSTAL_NAME_HU[key] ?? cleanHUText(value, { allowCrystalName: true });
}

export function controlledColorHU(value?: string): string | undefined {
  if (!value) return undefined;
  const clean = value.toLowerCase().trim();
  return COLOR_HU[clean] ?? cleanHUText(value);
}

export function controlledMoonPhaseHU(value?: string): string | undefined {
  if (!value) return undefined;
  const clean = value.toLowerCase().trim();
  return MOON_PHASE_HU[clean] ?? cleanHUText(value);
}

export function cleanHUText(value: unknown, options: GuardOptions = {}): string | undefined {
  if (typeof value !== "string") return undefined;
  let text = value.replace(/\s+/g, " ").trim();
  if (!text) return undefined;

  text = text
    .replace(/\bkarrier\b/gi, "munka")
    .replace(/\bkommunikáció\b/gi, "kapcsolódás")
    .replace(/\bwellness\b/gi, "jóllét")
    .replace(/\bfortune\b/gi, "szerencse")
    .replace(/\bprediction\b/gi, "jelzés");

  const lower = text.toLowerCase();
  if (FORBIDDEN_HU.some((phrase) => lower.includes(phrase))) return undefined;
  if (!options.allowCrystalName && RAW_ENGLISH_RE.test(text)) return undefined;
  if (/\bgyógyít(ja|ó|ás|ani)?\b/i.test(text)) return undefined;
  if (/\bas an ai\b/i.test(text)) return undefined;

  if (options.oneLine) {
    text = text.replace(/^ma\s+/i, "");
    if (text.length > 180) return undefined;
  }

  return text;
}

export function guardAITextObject<T extends object>(
  value: unknown,
  required: Array<keyof T>,
  options: Partial<Record<keyof T, GuardOptions>> = {},
): T | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(input)) {
    if (typeof raw === "string") {
      const fieldOptions = options[key as keyof T] ?? {};
      const cleaned =
        fieldOptions.allowCrystalName && key.toLowerCase().includes("name")
          ? polishCrystalNameHU(raw)
          : cleanHUText(raw, fieldOptions);
      if (cleaned) output[key] = cleaned;
      continue;
    }
    if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
  }

  for (const key of required) {
    if (output[String(key)] == null || output[String(key)] === "") return null;
  }

  return output as T;
}

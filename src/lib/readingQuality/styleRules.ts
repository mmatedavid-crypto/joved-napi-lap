export const READING_QUALITY_PROMPT_VERSION = "jovod-reading-quality-v4-natural";
export const READING_QUALITY_MODEL = "gpt-5.2";

export const SAFETY_NOTE = "Ez önismereti olvasat, nem orvosi, jogi vagy pénzügyi tanács.";

export const JOVOD_TONE_RULES = [
  "Magyarul írj, tegezve, természetes, figyelmes hangon.",
  "Használd a kapott bemenetet konkrétan, de ne magyarázd túl.",
  "Ne legyen magazinos horoszkóp-közhely vagy AI-szerű óvatosság.",
  "Ne találj ki alá nem támasztott tényt vagy konkrét jövőbeli eseményt.",
  "Ne adj orvosi, jogi vagy pénzügyi tanácsot.",
];

export const FORBIDDEN_READING_PHRASES = [
  "összességében",
  "fontos megjegyezni",
  "kommunikálj nyíltan és őszintén",
  "mint AI",
  "as an AI",
  "a csillagok azt mondják",
  "mindenképpen",
  "biztosan",
  "garantáltan",
  "ez fog történni",
];

export const DETERMINISTIC_PHRASES = [
  "biztosan visszajön",
  "biztosan szeret",
  "szakíts",
  "házasodj",
  "fektess be",
  "garantált eredmény",
  "elkerülhetetlen",
];

export const GENERIC_FILLER_PHRASES = [
  "légy önmagad",
  "higgy magadban",
  "minden okkal történik",
  "az univerzum melletted áll",
  "engedd el",
  "figyelj a jelekre",
  "hallgass a szívedre",
  "minden rendben lesz",
  "minden a helyére kerül",
  "jó kapcsolat lehet, ha kommunikáltok",
];

export const QUALITY_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
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
    oneSentence: { type: "string" },
    safetyNote: { type: "string" },
  },
  required: ["title", "sections", "oneSentence", "safetyNote"],
} as const;

export type QualitySection = {
  heading: string;
  text: string;
};

export type QualityReading = {
  title: string;
  sections: QualitySection[];
  oneSentence: string;
  safetyNote: string;
  meta?: {
    promptVersion?: string;
    model?: string;
    latencyMs?: number;
    fallbackUsed?: boolean;
    readingType?: string;
    qualityIssues?: string[];
  };
};

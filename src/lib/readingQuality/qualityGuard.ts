import {
  DETERMINISTIC_PHRASES,
  FORBIDDEN_READING_PHRASES,
  GENERIC_FILLER_PHRASES,
  type QualityReading,
} from "./styleRules";

export type QualityGuardResult = {
  ok: boolean;
  issues: string[];
};

const ENGLISH_WORD_RE =
  /\b(today|tomorrow|overall|horoscope|zodiac|love|career|relationship|communication|attraction|meaning|interpretation|advice|the|and|you|your)\b/i;
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const MEDICAL_LEGAL_FINANCIAL_RE =
  /\b(diagnózis|gyógyszer|orvosi kezelés|jogi tanács|perelj|részvény|kripto|befektetés|hiteltermék)\b/i;

function includesAny(text: string, phrases: string[]): string[] {
  const lower = text.toLocaleLowerCase("hu-HU");
  return phrases.filter((p) => lower.includes(p.toLocaleLowerCase("hu-HU")));
}

export function textFromReading(reading: QualityReading): string {
  return [
    reading.title,
    ...reading.sections.flatMap((s) => [s.heading, s.text]),
    reading.oneSentence,
    reading.safetyNote,
  ]
    .filter(Boolean)
    .join("\n");
}

export function guardReadingText(text: string, _anchors: string[] = []): QualityGuardResult {
  // Megengedő guard: csak valódi hibák (angol nyelv, emoji, orvosi/jogi/pénzügyi
  // tanács, "as an AI" típusú meta) miatt utasítjuk el az AI választ.
  // A korábbi szigorú szűrők (filler, anchors, generic szavak) gyakran rendben
  // levő, jó minőségű GPT választ is leblokkoltak, és a soványabb lokális
  // fallback szöveghez vezettek.
  const issues: string[] = [];
  const hardForbidden = ["mint AI", "as an AI"];
  const forbidden = includesAny(text, hardForbidden);
  if (forbidden.length) issues.push(`tiltott fordulat: ${forbidden.join(", ")}`);
  if (ENGLISH_WORD_RE.test(text)) issues.push("nyers angol szó a szövegben");
  if (EMOJI_RE.test(text)) issues.push("emoji a szövegben");
  if (MEDICAL_LEGAL_FINANCIAL_RE.test(text)) issues.push("orvosi/jogi/pénzügyi tanácsnak hat");

  // FORBIDDEN_READING_PHRASES, DETERMINISTIC_PHRASES, GENERIC_FILLER_PHRASES:
  // csak megfigyelésre, nem blokkolunk velük (megőrizve az importokat).
  void FORBIDDEN_READING_PHRASES;
  void DETERMINISTIC_PHRASES;
  void GENERIC_FILLER_PHRASES;

  return { ok: issues.length === 0, issues };
}

export function guardQualityReading(
  reading: QualityReading,
  anchors: string[] = [],
): QualityGuardResult {
  const base = guardReadingText(textFromReading(reading), anchors);
  if (!reading.sections.length) base.issues.push("nincs szekciózott olvasat");
  if (!reading.oneSentence) base.issues.push("hiányzó egymondatos összegzés");
  return { ok: base.issues.length === 0, issues: base.issues };
}

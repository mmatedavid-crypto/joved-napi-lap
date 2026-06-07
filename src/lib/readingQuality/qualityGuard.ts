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

export function guardReadingText(text: string, anchors: string[] = []): QualityGuardResult {
  const issues: string[] = [];
  const forbidden = includesAny(text, FORBIDDEN_READING_PHRASES);
  const deterministic = includesAny(text, DETERMINISTIC_PHRASES);
  const filler = includesAny(text, GENERIC_FILLER_PHRASES);

  if (forbidden.length) issues.push(`tiltott fordulat: ${forbidden.join(", ")}`);
  if (deterministic.length) issues.push(`determinisztikus állítás: ${deterministic.join(", ")}`);
  if (filler.length) issues.push(`közhelyes panel: ${filler.join(", ")}`);
  if (ENGLISH_WORD_RE.test(text)) issues.push("nyers angol szó vagy szolgáltatói fordulat");
  if (EMOJI_RE.test(text)) issues.push("emoji szerepel a szövegben");
  if (MEDICAL_LEGAL_FINANCIAL_RE.test(text)) issues.push("orvosi/jogi/pénzügyi tanácsnak hat");

  const lower = text.toLocaleLowerCase("hu-HU");
  const meaningfulAnchors = anchors.map((a) => a.trim()).filter((a) => a.length >= 3);
  const anchorHits = meaningfulAnchors.filter((a) =>
    lower.includes(a.toLocaleLowerCase("hu-HU")),
  ).length;
  if (meaningfulAnchors.length >= 2 && anchorHits === 0) {
    issues.push("nem használja a konkrét bemeneti kapaszkodókat");
  }

  const genericSignals = ["kapcsolódás", "egyensúly", "változás", "lehetőség", "figyelem"];
  const genericHits = genericSignals.filter((w) => lower.includes(w)).length;
  if (text.length < 550 && genericHits >= 4 && anchorHits === 0) {
    issues.push("túl általános: sok univerzális szó, kevés személyes kapaszkodó");
  }

  return { ok: issues.length === 0, issues };
}

export function guardQualityReading(
  reading: QualityReading,
  anchors: string[] = [],
): QualityGuardResult {
  const base = guardReadingText(textFromReading(reading), anchors);
  if (!reading.sections.length) base.issues.push("nincs szekciózott olvasat");
  if (!reading.oneSentence || reading.oneSentence.length > 180) {
    base.issues.push("hiányzó vagy túl hosszú egymondatos összegzés");
  }
  return { ok: base.issues.length === 0, issues: base.issues };
}

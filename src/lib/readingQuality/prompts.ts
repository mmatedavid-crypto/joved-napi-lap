import {
  JOVOD_TONE_RULES,
  QUALITY_OUTPUT_SCHEMA,
  READING_QUALITY_PROMPT_VERSION,
} from "./styleRules";

export type ReadingPromptInput = {
  readingType: "numerology" | "tarot" | "compatibility" | "horoscope";
  mode?: "free" | "paid";
  userInput: unknown;
  sourceData: unknown;
  requiredSections: string[];
};

export { QUALITY_OUTPUT_SCHEMA, READING_QUALITY_PROMPT_VERSION };

export function buildQualitySystemPrompt(): string {
  return [
    "Magyar önismereti írást készítesz a felhasználónak, meleg, emberi, figyelmes hangon — mintha egy bölcs barát beszélne hozzá.",
    "A bemeneti adatokat (számok, jegy, lapok, név) építsd be természetesen az olvasatba.",
    "Válasz JSON: { title, sections: [{ heading, text }], oneSentence, safetyNote }. A heading pontosan a kért szekciónév.",
  ].join("\n");
}

export function buildQualityUserPrompt(input: ReadingPromptInput): string {
  return [
    `Olvasat típusa: ${input.readingType}`,
    `Szekciók ezekkel a fejlécekkel, ebben a sorrendben: ${input.requiredSections.join(" | ")}`,
    "Megszólítás: ha van preferredName/preferredCallName, azt használd; egyébként a keresztnevet (magyar névsorrendben az utolsó adott név), sose a családnevet.",
    "Felhasználói bemenet:",
    JSON.stringify(input.userInput, null, 2),
    "Háttéradatok:",
    JSON.stringify(input.sourceData, null, 2),
    "Írj személyes, képszerű olvasatot. A végén egy rövid, költői 'oneSentence' összegzés.",
  ].join("\n\n");
}

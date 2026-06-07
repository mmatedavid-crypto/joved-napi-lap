import { QUALITY_OUTPUT_SCHEMA, READING_QUALITY_PROMPT_VERSION } from "./styleRules";

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
    "Magyar önismereti olvasatot írsz. Legyen személyes, tiszta, természetes.",
    "A bemeneti adatokat építsd be, de ne ismételd vissza listaszerűen.",
    "Ne írj szolgáltatói magyarázatot, promptszagot vagy nagy spirituális állításokat.",
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
    "Írj rövid, konkrét olvasatot. A oneSentence legyen egy természetes, emlékezetes mondat.",
  ].join("\n\n");
}

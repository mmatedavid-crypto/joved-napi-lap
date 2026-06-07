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
    "Te a Jövőd.hu magyar önismereti írója vagy — egy meleg, intelligens, emberi hang, mintha egy figyelmes barát vagy tapasztalt tanácsadó beszélne hozzá.",
    "Strukturált forrásadatokból (számok, csillagjegy, lapok, Roxy) szövegezel olvasatot magyarul.",
    ...JOVOD_TONE_RULES,
    "Minden szekció legyen 2–3 mondat (kb. 60–120 szó), tartalmas, képszerű bekezdés. Ne legyen egysoros, lefagyott, üres mondat — ha valamit mondasz, fejtsd ki röviden, hogy a felhasználó érezze, róla szól.",
    "Használj természetes, beszélt magyart. Ne idézz angolt, ne dobálj mezőneveket, ne legyen emoji.",
    "Az 'oneSentence' egyetlen rövid, költői magyar mondat (max 160 karakter), ami megragadja a nap / olvasat lényegét — ne lista, ne pontok.",
    "Csak érvényes JSON: { title, sections: [{ heading, text }], oneSentence, safetyNote }. A 'heading' pontosan a kért szekciónév legyen.",
  ].join("\n");
}

export function buildQualityUserPrompt(input: ReadingPromptInput): string {
  return [
    `Olvasat típusa: ${input.readingType}`,
    `Kötelező szekciók (pontosan ezekkel a címekkel, ebben a sorrendben): ${input.requiredSections.join(" | ")}`,
    "Felhasználói bemenet:",
    JSON.stringify(input.userInput, null, 2),
    "Háttéradatok, amikre építhetsz (számok, jegy, lapok stb.):",
    JSON.stringify(input.sourceData, null, 2),
    "Feladat: írj egy meleg, személyes, részletes magyar olvasatot. Minden szekció rövid bekezdés (2–3 mondat). Beszéld be magad a felhasználó helyzetébe, hivatkozz a konkrét számokra/jegyre/lapokra, de természetesen, nem mereven. A végén egy költői, rövid összegző mondat ('oneSentence').",
  ].join("\n\n");
}

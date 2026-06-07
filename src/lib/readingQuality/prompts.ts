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
    "Te a Jövőd.hu magyar interpretációs írója vagy.",
    "Strukturált forrásadatokból személyes, pontos, magyar önismereti olvasatot írsz.",
    ...JOVOD_TONE_RULES,
    "A RoxyAPI és a lokális adatok forrásanyagok. A végső hang mindig a Jövőd.hu hangja.",
    "Ne mutass nyers Roxy-szöveget, angol mezőnevet vagy szolgáltatói választ.",
    "Ne írj determinisztikus jövőállítást. Használj óvatos, de nem semmitmondó megfogalmazást: arra utalhat, inkább azt mutatja, érdemes lehet észrevenned.",
    "Tiltott fordulatok: összességében; fontos megjegyezni; kommunikálj nyíltan és őszintén; mint AI; a csillagok azt mondják; mindenképpen; biztosan; garantáltan; ez fog történni.",
    "Ha a szöveg ugyanúgy illene bárkire, nem elég jó. Használd a konkrét számokat, lapokat, kérdést, nevet, dátumot, pozíciót és kapcsolat-státuszt.",
    "Csak érvényes JSON-t adj vissza a séma szerint: { title, sections: [{ heading, text }], oneSentence, safetyNote }.",
  ].join("\n");
}

export function buildQualityUserPrompt(input: ReadingPromptInput): string {
  return [
    `Prompt verzió: ${READING_QUALITY_PROMPT_VERSION}`,
    `Olvasat típusa: ${input.readingType}`,
    `Minőségi mód: ${input.mode ?? "free"}`,
    `Kötelező szekciók: ${input.requiredSections.join(" | ")}`,
    "Felhasználói bemenet:",
    JSON.stringify(input.userInput, null, 2),
    "Strukturált forrásadat:",
    JSON.stringify(input.sourceData, null, 2),
    "Feladat: írj magyar, személyes, konkrét olvasatot. A forrás szimbolikáját tartsd meg, de ne legyen sablonos horoszkóp-magazin szöveg.",
  ].join("\n\n");
}

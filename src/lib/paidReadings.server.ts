import { composePaidOrderReading, type PaidReadingPayload } from "./paidReadings";

const PAID_READING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    body: { type: "string" },
  },
  required: ["title", "body"],
} as const;

const DEEP_PAID_PRODUCTS = new Set([
  "harom_lap_mely",
  "kelta_kereszt",
  "dontes_komplex",
  "parkapcsolat_elemzes",
  "szammisztika_eletut",
]);

const FORBIDDEN_PAID_PATTERNS = [
  /\b(today|overall|relationship|communication|advice|the|and|you|your)\b/i,
  /összességében|fontos megjegyezni|mint AI|as an AI/i,
  /biztosan|garantáltan|mindenképpen|ez fog történni/i,
  /gyógyít|meggyógyít|diagnózis|befektetési|jogi tanács/i,
  /😊|🙂|✨|❤️|🔮/,
];

function isGoodPaidReading(reading: PaidReadingPayload): boolean {
  const body = `${reading.title}\n${reading.body}`;
  if (body.length < 900) return false;
  if (FORBIDDEN_PAID_PATTERNS.some((pattern) => pattern.test(body))) return false;
  if (reading.body.split(/\n\n+/).length < 4) return false;
  return true;
}

function isDeepPaidProduct(productSlug: string): boolean {
  return DEEP_PAID_PRODUCTS.has(productSlug);
}

function resolvePremiumModels(productSlug: string): { openaiModel: string; lovableModel: string } {
  const deep = isDeepPaidProduct(productSlug);
  return {
    openaiModel:
      process.env.OPENAI_PREMIUM_READING_MODEL ??
      (deep
        ? (process.env.OPENAI_DEEP_READING_MODEL ?? process.env.OPENAI_READING_MODEL ?? "gpt-5.2")
        : (process.env.OPENAI_READING_MODEL ?? "gpt-5.2")),
    lovableModel:
      process.env.LOVABLE_PREMIUM_READING_MODEL ??
      (deep
        ? (process.env.LOVABLE_DEEP_READING_MODEL ?? "openai/gpt-5.2")
        : (process.env.LOVABLE_AI_MODEL ?? "openai/gpt-5.2")),
  };
}

export async function generatePaidOrderReading(opts: {
  productSlug: string;
  productName: string;
  inputPayload: unknown;
}): Promise<PaidReadingPayload> {
  const draft = composePaidOrderReading(opts.productSlug, opts.productName, opts.inputPayload);
  try {
    const { aiJSON } = await import("./ai.server");
    const { openaiModel, lovableModel } = resolvePremiumModels(opts.productSlug);
    const deep = isDeepPaidProduct(opts.productSlug);
    const ai = await aiJSON<PaidReadingPayload>({
      system: [
        "Te a Jövőd.hu prémium magyar olvasatírója vagy.",
        deep
          ? "Mély, fizetős elemzést írsz: legyen nyugodt, pontos, személyes és több rétegű."
          : "Azonnali fizetős olvasatot írsz: legyen rövid, éles, személyes és késznek érződő.",
        "A kapott draft tartalmát emeld prémium szintre, de ne találj ki új tényt.",
        "Ha az inputban memoryContext szerepel, finoman építsd be mint visszatérő témát vagy korábbi mintát. Ne mondd, hogy adatbázisból emlékszel; természetesen fogalmazz.",
        "Magyarul, tegezve, elegánsan, misztikusan, de józanul írj.",
        "Ne legyen chatbot-szerű vagy magazinos. Ne ígérj biztos jövőt, visszatérést, szerelmet, egészségi vagy pénzügyi eredményt.",
        deep
          ? "A body legyen jól tagolt, címsorokkal, 1800-3200 karakter között."
          : "A body legyen jól tagolt, címsorokkal, 900-1800 karakter között.",
        "Csak JSON-t adj vissza: { title, body }.",
      ].join("\n"),
      user: [
        `Termék: ${opts.productName}`,
        `Termék slug: ${opts.productSlug}`,
        "Felhasználói input:",
        JSON.stringify(opts.inputPayload ?? {}, null, 2),
        "Biztonságos helyi prémium draft:",
        JSON.stringify(draft, null, 2),
      ].join("\n\n"),
      schemaName: "PaidReading",
      schema: PAID_READING_SCHEMA as unknown as Record<string, unknown>,
      providerPreference: "openai_first",
      allowLovableFallback: false,
      openaiModel,
      lovableModel,
      readingType: `paid:${opts.productSlug}`,
    });
    if (ai.ok && ai.data && isGoodPaidReading(ai.data)) return ai.data;
  } catch {
    // The local premium draft is the safe fallback.
  }
  return draft;
}

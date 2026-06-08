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

function isGoodPaidReading(reading: PaidReadingPayload): boolean {
  const body = `${reading.title}\n${reading.body}`;
  if (body.length < 900) return false;
  if (/\b(today|overall|relationship|communication|advice|the|and|you|your)\b/i.test(body)) {
    return false;
  }
  if (/összességében|fontos megjegyezni|mint AI|as an AI|biztosan|garantáltan/i.test(body)) {
    return false;
  }
  return true;
}

export async function generatePaidOrderReading(opts: {
  productSlug: string;
  productName: string;
  inputPayload: unknown;
}): Promise<PaidReadingPayload> {
  const draft = composePaidOrderReading(opts.productSlug, opts.productName, opts.inputPayload);
  try {
    const { aiJSON } = await import("./ai.server");
    const premiumOpenAiModel =
      process.env.OPENAI_PREMIUM_READING_MODEL ?? process.env.OPENAI_READING_MODEL ?? "gpt-5.2";
    const premiumLovableModel =
      process.env.LOVABLE_PREMIUM_READING_MODEL ?? process.env.LOVABLE_AI_MODEL ?? "openai/gpt-5.5";
    const ai = await aiJSON<PaidReadingPayload>({
      system: [
        "Te a Jövőd.hu prémium magyar olvasatírója vagy.",
        "Fizetős termékhez írsz: a válasz legyen érezhetően jobb, mélyebb és személyesebb, mint az ingyenes olvasat.",
        "A kapott draft tartalmát emeld fizetős szintre: személyesebb, pontosabb, folyékonyabb, de ne találj ki új tényt.",
        "Ha az inputban memoryContext szerepel, finoman építsd be mint visszatérő témát vagy korábbi mintát. Ne mondd, hogy adatbázisból emlékszel; természetesen fogalmazz.",
        "Mindig magyarul írj, tegezve, elegánsan, misztikusan, de józanul.",
        "Ne legyen chatbot-szerű, ne legyen magazinos horoszkóp, ne legyen túl hosszú körítés.",
        "Ne ígérj biztos jövőt, visszatérést, szerelmet, halált, betegséget vagy pénzügyi eredményt.",
        "A body legyen jól tagolt, címsorokkal, 900-1800 karakter között instant terméknél, 1800-3200 karakter között mély elemzésnél.",
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
      openaiModel: premiumOpenAiModel,
      lovableModel: premiumLovableModel,
      readingType: `paid:${opts.productSlug}`,
    });
    if (ai.ok && ai.data && isGoodPaidReading(ai.data)) return ai.data;
  } catch {
    // The local premium draft is the safe fallback.
  }
  return draft;
}

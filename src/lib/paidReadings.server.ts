import {
  composePaidOrderReading,
  paidReadingInputBrief,
  type PaidReadingPayload,
} from "./paidReadings";

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

const INSTANT_PAID_AI_TIMEOUT_MS = Number(process.env.PAID_READING_TIMEOUT_MS ?? 45_000);
const DEEP_PAID_AI_TIMEOUT_MS = Number(process.env.PAID_DEEP_READING_TIMEOUT_MS ?? 90_000);

const FORBIDDEN_PAID_PATTERNS = [
  /\b(today|overall|relationship|communication|advice|the|and|you|your)\b/i,
  /összességében|fontos megjegyezni|mint AI|as an AI/i,
  /biztosan|garantáltan|mindenképpen|ez fog történni/i,
  /gyógyít|meggyógyít|diagnózis|befektetési|jogi tanács/i,
  /^#{1,6}\s|\*\*|```/m,
  /😊|🙂|✨|❤️|🔮/,
];

type PaidReadingQualityResult = {
  ok: boolean;
  issues: string[];
  chars: number;
  sections: number;
  contextHits: number;
  requiredContextHits: number;
  contextSections: number;
  requiredContextSections: number;
};

function paidReadingMinimumLength(productSlug: string): number {
  return isDeepPaidProduct(productSlug) ? 1600 : 900;
}

function paidReadingMinimumSections(productSlug: string): number {
  return isDeepPaidProduct(productSlug) ? 5 : 4;
}

function hasPaidSafetyFrame(body: string): boolean {
  const lower = body.toLocaleLowerCase("hu-HU");
  return (
    lower.includes("önismereti") && (lower.includes("szimbolikus") || lower.includes("nem orvosi"))
  );
}

const CONTEXT_STOPWORDS = new Set([
  "hogy",
  "mert",
  "vagy",
  "amit",
  "arra",
  "ezt",
  "most",
  "ilyen",
  "olvasat",
  "szemelyes",
  "személyes",
  "kerdes",
  "kérdés",
  "helyzet",
  "kapcsolat",
  "elemzes",
  "elemzés",
]);

function normalizeContextText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("hu-HU");
}

function collectContextStrings(value: unknown, depth = 0): string[] {
  if (depth > 4 || value == null) return [];
  if (typeof value === "string") return [value];
  if (typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => collectContextStrings(item, depth + 1));
  if (typeof value !== "object") return [];

  const usefulKeys = new Set([
    "question",
    "situation",
    "status",
    "dream",
    "text",
    "emotion",
    "symbol",
    "number",
    "sign",
    "zodiac",
    "name",
    "preferredName",
    "callName",
    "fullName",
    "fullNameA",
    "fullNameB",
    "myName",
    "hisName",
    "dob",
    "birthDate",
    "birthDateA",
    "birthDateB",
    "myDob",
    "hisDob",
    "q",
    "cat",
    "sit",
    "category",
    "cardName",
    "cards",
    "cardSpread",
    "position",
    "orientation",
    "keywords",
    "meaning",
    "oneLine",
    "freeSynthesis",
    "together",
    "attention",
    "compatibilitySnapshot",
    "personA",
    "personB",
    "lifePathNumber",
    "expressionNumber",
    "soulUrgeNumber",
    "personalityNumber",
    "relationshipNumber",
    "score",
    "freeReadingSummary",
    "sections",
    "heading",
    "comparisonContext",
    "memoryContext",
    "followupContext",
    "articleLead",
    "topic",
  ]);

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    usefulKeys.has(key) ? collectContextStrings(nested, depth + 1) : [],
  );
}

function inputContextAnchors(inputPayload: unknown): string[] {
  const anchors = new Set<string>();
  for (const raw of collectContextStrings(inputPayload)) {
    const normalized = normalizeContextText(raw);
    for (const match of normalized.matchAll(/[a-z0-9]{3,}/g)) {
      const word = match[0];
      if (word.length < 4 && !/^\d+$/.test(word)) continue;
      if (CONTEXT_STOPWORDS.has(word)) continue;
      anchors.add(word);
    }
  }
  return [...anchors].slice(0, 16);
}

function countContextHits(body: string, anchors: string[]): number {
  if (!anchors.length) return 0;
  const normalizedBody = normalizeContextText(body);
  return anchors.filter((anchor) => normalizedBody.includes(anchor)).length;
}

function countContextSections(body: string, anchors: string[]): number {
  if (!anchors.length) return 0;
  return body
    .split(/\n\n+/)
    .map((section) => normalizeContextText(section))
    .filter((section) => anchors.some((anchor) => section.includes(anchor))).length;
}

function paidReadingMinimumContextHits(productSlug: string, anchors: string[]): number {
  if (anchors.length < 2) return 0;
  if (!isDeepPaidProduct(productSlug)) return 1;
  return Math.min(3, Math.max(2, Math.ceil(anchors.length * 0.18)));
}

function paidReadingMinimumContextSections(productSlug: string, anchors: string[]): number {
  if (anchors.length < 2) return 0;
  return isDeepPaidProduct(productSlug) ? 2 : 1;
}

function inspectPaidReadingQuality(
  reading: PaidReadingPayload,
  productSlug: string,
  inputPayload?: unknown,
): PaidReadingQualityResult {
  const body = `${reading.title}\n${reading.body}`;
  const sections = reading.body.split(/\n\n+/).filter((part) => part.trim().length > 0).length;
  const issues: string[] = [];
  const minLength = paidReadingMinimumLength(productSlug);
  const minSections = paidReadingMinimumSections(productSlug);
  const anchors = inputContextAnchors(inputPayload);
  const contextHits = countContextHits(body, anchors);
  const requiredContextHits = paidReadingMinimumContextHits(productSlug, anchors);
  const contextSections = countContextSections(reading.body, anchors);
  const requiredContextSections = paidReadingMinimumContextSections(productSlug, anchors);
  if (body.length < minLength) issues.push(`too_short:${body.length}<${minLength}`);
  if (FORBIDDEN_PAID_PATTERNS.some((pattern) => pattern.test(body))) issues.push("forbidden_text");
  if (sections < minSections) issues.push(`too_few_sections:${sections}<${minSections}`);
  if (!hasPaidSafetyFrame(reading.body)) issues.push("missing_safety_frame");
  if (requiredContextHits > 0 && contextHits === 0) issues.push("missing_user_context");
  else if (contextHits < requiredContextHits) {
    issues.push(`weak_user_context:${contextHits}<${requiredContextHits}`);
  }
  if (requiredContextSections > 0 && contextSections < requiredContextSections) {
    issues.push(`thin_user_context_sections:${contextSections}<${requiredContextSections}`);
  }
  return {
    ok: issues.length === 0,
    issues,
    chars: body.length,
    sections,
    contextHits,
    requiredContextHits,
    contextSections,
    requiredContextSections,
  };
}

function isGoodPaidReading(
  reading: PaidReadingPayload,
  productSlug: string,
  inputPayload?: unknown,
): boolean {
  return inspectPaidReadingQuality(reading, productSlug, inputPayload).ok;
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

function paidReadingTimeoutMs(productSlug: string): number {
  return isDeepPaidProduct(productSlug) ? DEEP_PAID_AI_TIMEOUT_MS : INSTANT_PAID_AI_TIMEOUT_MS;
}

export async function generatePaidOrderReading(opts: {
  productSlug: string;
  productName: string;
  inputPayload: unknown;
}): Promise<PaidReadingPayload> {
  const draft = composePaidOrderReading(opts.productSlug, opts.productName, opts.inputPayload);
  const inputBrief = paidReadingInputBrief(opts.inputPayload);
  const { openaiModel, lovableModel } = resolvePremiumModels(opts.productSlug);
  const generatedAt = new Date().toISOString();
  try {
    const { aiJSON } = await import("./ai.server");
    const deep = isDeepPaidProduct(opts.productSlug);
    const ai = await aiJSON<PaidReadingPayload>({
      system: [
        "Írj természetes, választékos magyar olvasatot a megadott adatokból és a kiinduló vázlat tényeiből.",
        "Beszélj közvetlenül az olvasóhoz. Ne magyarázd a feladatot, ne dicsérd a saját szövegedet, és ne ismételd vissza szó szerint a kérdését.",
        "Minden bekezdés mondjon valami újat és konkrétat. Kerüld a ködös spirituális közhelyeket, a túl sok ellentétpárt, a gondolatjeles felsorolásokat és a hatásvadász egyszavas kijelentéseket.",
        "Legalább két külön szakaszban kösd vissza az olvasatot a felhasználó megadott kérdéséhez, helyzetéhez, nevéhez, dátumához vagy előző rövid olvasatához. Ne csak a címben vagy az első bekezdésben jelenjen meg a saját kontextusa.",
        "A lapot, számot vagy jegyet önismereti tükörként értelmezd. Ne állíts biztos jövőt, egészségi, jogi vagy pénzügyi eredményt.",
        deep
          ? "Írj 5-7 rövid, jól elkülönülő részt, összesen 1800-3000 karakterben."
          : "Írj 4-5 rövid, jól elkülönülő részt, összesen 900-1500 karakterben.",
        "A címsorok egyszerű szövegsorok legyenek. Ne használj Markdown-jeleket vagy emojit. Az utolsó rész legyen egy valóban elvégezhető mai lépés, utána egy rövid önismereti biztonsági keret.",
        "Csak JSON-t adj vissza: { title, body }.",
      ].join("\n"),
      user: [
        `Termék: ${opts.productName}`,
        `Termék slug: ${opts.productSlug}`,
        inputBrief ? `Ügyfélhelyzet röviden:\n${inputBrief}` : "",
        "Felhasználói input:",
        JSON.stringify(opts.inputPayload ?? {}, null, 2),
        "Kiinduló biztonsági vázlat:",
        JSON.stringify(draft, null, 2),
      ].join("\n\n"),
      schemaName: "PaidReading",
      schema: PAID_READING_SCHEMA as unknown as Record<string, unknown>,
      providerPreference: "openai_first",
      allowLovableFallback: false,
      openaiModel,
      lovableModel,
      readingType: `paid:${opts.productSlug}`,
      timeoutMs: paidReadingTimeoutMs(opts.productSlug),
    });
    if (ai.ok && ai.data) {
      if (isGoodPaidReading(ai.data, opts.productSlug, opts.inputPayload)) {
        return {
          ...ai.data,
          generation: {
            source: "ai",
            provider: ai.meta?.provider,
            model: ai.meta?.model ?? openaiModel,
            latencyMs: ai.meta?.latencyMs,
            fallbackUsed: ai.meta?.fallbackUsed ?? false,
            generatedAt,
          },
        };
      }
      const quality = inspectPaidReadingQuality(ai.data, opts.productSlug, opts.inputPayload);
      console.warn("[paid_reading_quality_rejected]", {
        productSlug: opts.productSlug,
        readingType: `paid:${opts.productSlug}`,
        chars: quality.chars,
        sections: quality.sections,
        contextHits: quality.contextHits,
        requiredContextHits: quality.requiredContextHits,
        contextSections: quality.contextSections,
        requiredContextSections: quality.requiredContextSections,
        issues: quality.issues,
      });
      return withLocalPremiumDraftMeta(draft, {
        generatedAt,
        qualityRejected: true,
        qualityIssues: quality.issues,
        attemptedModel: ai.meta?.model ?? openaiModel,
        latencyMs: ai.meta?.latencyMs,
      });
    }
    return withLocalPremiumDraftMeta(draft, {
      generatedAt,
      qualityRejected: false,
      qualityIssues: [sanitizeGenerationIssue(ai.error ?? "ai_unavailable")],
      attemptedModel: ai.meta?.model ?? openaiModel,
      latencyMs: ai.meta?.latencyMs,
    });
  } catch {
    // The local premium draft is the safe fallback.
    return withLocalPremiumDraftMeta(draft, {
      generatedAt,
      qualityRejected: false,
      qualityIssues: ["ai_exception"],
      attemptedModel: openaiModel,
    });
  }
  return withLocalPremiumDraftMeta(draft, {
    generatedAt,
    qualityRejected: false,
    qualityIssues: ["unknown_paid_generation_fallback"],
    attemptedModel: openaiModel,
  });
}

function withLocalPremiumDraftMeta(
  draft: PaidReadingPayload,
  opts: {
    generatedAt: string;
    qualityRejected: boolean;
    qualityIssues: string[];
    attemptedModel: string;
    latencyMs?: number;
  },
): PaidReadingPayload {
  return {
    ...draft,
    generation: {
      source: "local_premium_draft",
      model: opts.attemptedModel,
      latencyMs: opts.latencyMs,
      fallbackUsed: true,
      qualityRejected: opts.qualityRejected,
      qualityIssues: opts.qualityIssues.map(sanitizeGenerationIssue),
      generatedAt: opts.generatedAt,
    },
  };
}

function sanitizeGenerationIssue(issue: string): string {
  if (/^http_\d{3}$/.test(issue)) return issue;
  if (
    /^(parse_failed|invalid_json|network|ai_unavailable|ai_exception|no_ai_provider_available)$/.test(
      issue,
    )
  ) {
    return issue;
  }
  if (
    /^(too_short|too_few_sections|forbidden_text|missing_safety_frame|missing_user_context|weak_user_context|thin_user_context_sections)/.test(
      issue,
    )
  ) {
    return issue.slice(0, 120);
  }
  return "paid_generation_fallback";
}

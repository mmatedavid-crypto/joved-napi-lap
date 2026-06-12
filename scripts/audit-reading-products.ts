import { readFileSync } from "node:fs";
import { PRODUCTS } from "../src/lib/products";
import { composePaidOrderReading } from "../src/lib/paidReadings";
import { CARDS } from "../src/data/cards";
import { composeThreeCardTarot } from "../src/lib/readingQuality/tarotEngine";
import {
  calculateNumerologyProfile,
  composeNumerologyReading,
} from "../src/lib/readingQuality/numerologyEngine";
import {
  calculateCompatibilityProfile,
  composeCompatibilityReading,
} from "../src/lib/readingQuality/compatibilityEngine";
import { composeHoroscopeReading } from "../src/lib/readingQuality/horoscopeEngine";
import { textFromReading } from "../src/lib/readingQuality/qualityGuard";

const demoPayloads: Record<string, Record<string, unknown>> = {
  napi_lap_ai: { cardName: "A Csillag", question: "Mire figyeljek ma?" },
  mai_iranytu_ai: { name: "Anna", dob: "1992-04-17", sign: "Rák", personalYear: 4 },
  angyalszam_ai: { number: "1111", root: 11 },
  kristaly_ai: { mode: "month", month: 2, crystal: "Ametiszt" },
  alomfejtes_rovid: {
    text: "Egy régi házban jártam, víz folyt a lépcsőkön, és kerestem egy szobát.",
    emotion: "fear",
  },
  horoszkop_szemelyre: { name: "Dávid", sign: "Bak", personalYear: 8 },
  extra_huzas: { cardName: "Az Erő", question: "Mi a következő jó lépés?" },
  harom_lap_mely: {
    cards: ["A Szeretők", "A Remete", "A Csillag"],
    question: "Komolyan gondolja ezt a kapcsolatot?",
    category: "randi / ismerkedés",
  },
  kelta_kereszt: {
    cards: ["A Mágus", "A Főpapnő", "Az Igazság"],
    question: "Merre tartsak a következő hónapban?",
    category: "élethelyzet",
  },
  dontes_komplex: {
    cards: ["A Császár", "A Hold", "A Nap"],
    q: "Elfogadjam az új munkalehetőséget?",
    cat: "munka",
    mode: "tarot",
  },
  parkapcsolat_elemzes: {
    myName: "Kovács Anna",
    hisName: "Nagy Péter",
    myDob: "1992-04-17",
    hisDob: "1990-01-14",
    sit: "ex / visszatérő történet",
    q: "Visszajön, és ha igen, maradni is tud?",
  },
  szammisztika_eletut: { name: "Kovács Éva Anna", dob: "1988-11-29" },
};

const extraPaidChecks: Array<{
  name: string;
  slug: string;
  productName: string;
  payload: Record<string, unknown>;
  expect: string[];
}> = [
  {
    name: "kristaly_ai:zodiac",
    slug: "kristaly_ai",
    productName: "Kristály ajánlás — személyesen",
    payload: { mode: "zodiac", sign: "cancer" },
    expect: ["Holdkő", "Rák"],
  },
  {
    name: "harom_lap_mely:partial_payload",
    slug: "harom_lap_mely",
    productName: "Három lap — mély elemzés",
    payload: {
      cards: ["A Szeretők"],
      question: "Miért ismétlődik ez a helyzet?",
      category: "kapcsolat",
    },
    expect: ["Múlt", "Jelen", "Jövő", "A három lap együtt"],
  },
  {
    name: "dontes_komplex:partial_payload",
    slug: "dontes_komplex",
    productName: "Döntés előtt — komplex elemzés",
    payload: {
      cards: ["A Hold"],
      q: "Váltsak irányt most?",
      cat: "munka",
    },
    expect: ["Múlt", "Jelen", "Jövő", "Mit tisztít a döntés"],
  },
];

const forbidden = [
  "összességében",
  "fontos megjegyezni",
  "kommunikálj nyíltan és őszintén",
  "mint AI",
  "as an AI",
  "biztosan",
  "garantáltan",
  "ez fog történni",
];

function inspect(name: string, title: string, body: string, minLength: number, sections?: number) {
  const issues: string[] = [];
  if (body.length < minLength) issues.push(`rövid (${body.length} karakter)`);
  if (sections != null) {
    if (sections < 4) issues.push("kevés szekció");
  } else if ((body.match(/\n\n/g) ?? []).length < 3) {
    issues.push("kevés szekció/tagolás");
  }
  if (/\b(today|overall|relationship|communication|advice|the|and|you|your)\b/i.test(body)) {
    issues.push("angol szó gyanú");
  }
  if (name === "kelta_kereszt") {
    if (!body.includes("10. Lehetséges kifutás")) issues.push("nem 10 pozíciós kelta kereszt");
    if (!body.includes("A tíz lap együtt")) issues.push("hiányzik a kelta szintézis");
  }
  const lower = body.toLocaleLowerCase("hu-HU");
  const found = forbidden.filter((phrase) => lower.includes(phrase));
  if (found.length) issues.push(`tiltott fordulat: ${found.join(", ")}`);
  return { name, title, chars: body.length, ok: issues.length === 0, issues };
}

const paid = PRODUCTS.map((product) => {
  const reading = composePaidOrderReading(
    product.slug,
    product.name,
    demoPayloads[product.slug] ?? {},
  );
  return inspect(
    product.slug,
    reading.title,
    reading.body,
    product.category === "instant" ? 900 : 1400,
  );
});

for (const check of extraPaidChecks) {
  const reading = composePaidOrderReading(check.slug, check.productName, check.payload);
  const result = inspect(check.name, reading.title, reading.body, 900);
  for (const expected of check.expect) {
    if (!`${reading.title}\n${reading.body}`.includes(expected)) {
      result.ok = false;
      result.issues.push(`hiányzó kontextus: ${expected}`);
    }
  }
  paid.push(result);
}

const freeReadings = [
  {
    name: "free:tarot_three_card",
    reading: composeThreeCardTarot({
      readingType: "3 lapos húzás",
      cards: [CARDS[6], CARDS[9], CARDS[16]],
      question: "Komolyan gondolja ezt a kapcsolatot?",
      category: "randi / ismerkedés",
    }),
  },
  {
    name: "free:numerology",
    reading: composeNumerologyReading(
      calculateNumerologyProfile({ birthDate: "1988-11-29", fullName: "Kovács Éva Anna" }),
    ),
  },
  {
    name: "free:compatibility",
    reading: composeCompatibilityReading(
      calculateCompatibilityProfile({
        birthDateA: "1992-04-17",
        birthDateB: "1990-01-14",
        fullNameA: "Kovács Anna",
        fullNameB: "Nagy Péter",
        status: "ex / visszatérő történet",
      }),
    ),
  },
  {
    name: "free:horoscope",
    reading: composeHoroscopeReading({ sign: "capricorn", dateKey: "2026-06-08" }),
  },
].map((item) =>
  inspect(
    item.name,
    item.reading.title,
    textFromReading(item.reading),
    900,
    item.reading.sections.length,
  ),
);

const contextChecks = [
  {
    name: "context:paid_dream_emotion",
    body: composePaidOrderReading(
      "alomfejtes_rovid",
      "Álomfejtés — rövid olvasat",
      demoPayloads.alomfejtes_rovid,
    ).body,
    required: ["félelem"],
  },
  {
    name: "context:paid_decision_question",
    body: composePaidOrderReading(
      "dontes_komplex",
      "Döntés előtt — komplex elemzés",
      demoPayloads.dontes_komplex,
    ).body,
    required: ["Elfogadjam az új munkalehetőséget", "munka"],
  },
  {
    name: "context:paid_horoscope_sign",
    body: composePaidOrderReading(
      "horoszkop_szemelyre",
      "Horoszkóp — személyre szabott",
      demoPayloads.horoszkop_szemelyre,
    ).body,
    required: ["Bak", "felelősség", "személyes"],
  },
  {
    name: "context:paid_ex_return",
    body: composePaidOrderReading(
      "parkapcsolat_elemzes",
      "Párkapcsolat — mély elemzés",
      demoPayloads.parkapcsolat_elemzes,
    ).body,
    required: ["visszatér", "rövid", "tartós"],
  },
  {
    name: "context:paid_numerology_deeper_than_free",
    body: composePaidOrderReading(
      "szammisztika_eletut",
      "Számmisztika — életút elemzés",
      demoPayloads.szammisztika_eletut,
    ).body,
    required: ["A fizetős elemzés mélyebb rétege", "A név rétegei", "Következő 30 nap"],
  },
  {
    name: "context:free_ex_return",
    body: textFromReading(
      composeCompatibilityReading(
        calculateCompatibilityProfile({
          birthDateA: "1992-04-17",
          birthDateB: "1990-01-14",
          fullNameA: "Kovács Anna",
          fullNameB: "Nagy Péter",
          status: "ex / visszatérő történet",
        }),
      ),
    ),
    required: ["visszatér", "rövid", "tartós"],
  },
].map((item) => {
  const lower = item.body.toLocaleLowerCase("hu-HU");
  const missing = item.required.filter((word) => !lower.includes(word.toLocaleLowerCase("hu-HU")));
  return {
    name: item.name,
    title: item.name,
    chars: item.body.length,
    ok: missing.length === 0,
    issues: missing.map((word) => `hiányzó kontextus: ${word}`),
  };
});

console.log(JSON.stringify({ paid, free: freeReadings, context: contextChecks }, null, 2));
const failed = [...paid, ...freeReadings, ...contextChecks].filter((item) => !item.ok);
const policyFailures: string[] = [];
const paidServer = readFileSync("src/lib/paidReadings.server.ts", "utf8");
const aiServer = readFileSync("src/lib/ai.server.ts", "utf8");

if (!paidServer.includes('providerPreference: "openai_first"')) {
  policyFailures.push("paid readings must prefer the strongest OpenAI/GPT route");
}
if (!paidServer.includes("allowLovableFallback: false")) {
  policyFailures.push("paid readings must not fall back to a weaker gateway model");
}
if (!paidServer.includes('"gpt-5.2"') || !aiServer.includes('"gpt-5.2"')) {
  policyFailures.push("paid reading model defaults must reference GPT-5.2");
}
if (
  !paidServer.includes("PAID_READING_TIMEOUT_MS") ||
  !paidServer.includes("PAID_DEEP_READING_TIMEOUT_MS") ||
  !paidServer.includes("function paidReadingTimeoutMs") ||
  !paidServer.includes("timeoutMs: paidReadingTimeoutMs(opts.productSlug)")
) {
  policyFailures.push("paid readings must use longer AI timeouts before falling back");
}
if (
  !paidServer.includes("paidReadingMinimumLength(productSlug)") ||
  !paidServer.includes("isDeepPaidProduct(productSlug) ? 1600 : 900") ||
  !paidServer.includes("paidReadingMinimumSections(productSlug)") ||
  !paidServer.includes("isGoodPaidReading(ai.data, opts.productSlug, opts.inputPayload)") ||
  !paidServer.includes("inputContextAnchors(inputPayload)") ||
  !paidServer.includes("countContextHits(body, anchors)") ||
  !paidServer.includes("function paidReadingMinimumContextHits") ||
  !paidServer.includes("requiredContextHits") ||
  !paidServer.includes("weak_user_context") ||
  !paidServer.includes("contextHits < requiredContextHits") ||
  !paidServer.includes("missing_user_context") ||
  !paidServer.includes("contextHits: quality.contextHits") ||
  !paidServer.includes("requiredContextHits: quality.requiredContextHits") ||
  !paidServer.includes("inspectPaidReadingQuality(ai.data, opts.productSlug, opts.inputPayload)") ||
  !paidServer.includes("[paid_reading_quality_rejected]") ||
  !paidServer.includes("issues: quality.issues") ||
  !paidServer.includes("hasPaidSafetyFrame") ||
  !paidServer.includes("missing_safety_frame") ||
  !paidServer.includes("önismereti") ||
  !paidServer.includes("Minden bekezdés mondjon valami újat és konkrétat") ||
  !paidServer.includes("Ne használj Markdown-jeleket vagy emojit")
) {
  policyFailures.push("paid AI quality gate must be stricter for deep paid products");
}
if (
  !paidServer.includes("generation: {") ||
  !paidServer.includes('source: "ai"') ||
  !paidServer.includes('source: "local_premium_draft"') ||
  !paidServer.includes("provider: ai.meta?.provider") ||
  !paidServer.includes("model: ai.meta?.model ?? openaiModel") ||
  !paidServer.includes("latencyMs: ai.meta?.latencyMs") ||
  !paidServer.includes("qualityRejected: true") ||
  !paidServer.includes("qualityIssues: quality.issues") ||
  !paidServer.includes("withLocalPremiumDraftMeta") ||
  !paidServer.includes("function sanitizeGenerationIssue") ||
  !paidServer.includes('"paid_generation_fallback"')
) {
  policyFailures.push("paid generation must persist internal source/model/fallback metadata");
}
if (!aiServer.includes("allowLovableFallback && primaryModel !== LOVABLE_FALLBACK_MODEL")) {
  policyFailures.push("shared AI helper must make gateway fallback opt-in/controllable");
}
if (
  !aiServer.includes("export type AiResultMeta") ||
  !aiServer.includes("meta?: AiResultMeta") ||
  !aiServer.includes("function resultMeta") ||
  !aiServer.includes('provider: "openai" | "lovable"') ||
  !aiServer.includes("latencyMs: Date.now() - opts.started")
) {
  policyFailures.push("shared AI helper must return provider/model/latency metadata");
}
if (policyFailures.length) {
  console.error("\nFailed paid AI policy audit:");
  for (const item of policyFailures) console.error(`- ${item}`);
  process.exit(1);
}

if (failed.length) {
  console.error("\nFailed quality audit:");
  for (const item of failed) console.error(`- ${item.name}: ${item.issues.join("; ")}`);
  process.exit(1);
}

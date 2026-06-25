import { readFileSync } from "node:fs";
import { PRODUCTS } from "../src/lib/products.ts";
import { composePaidOrderReading } from "../src/lib/paidReadings.ts";
import { CARDS } from "../src/data/cards.ts";
import { composeThreeCardTarot } from "../src/lib/readingQuality/tarotEngine.ts";
import {
  calculateNumerologyProfile,
  composeNumerologyReading,
} from "../src/lib/readingQuality/numerologyEngine.ts";
import {
  calculateCompatibilityProfile,
  composeCompatibilityReading,
} from "../src/lib/readingQuality/compatibilityEngine.ts";
import { composeHoroscopeReading } from "../src/lib/readingQuality/horoscopeEngine.ts";
import { textFromReading } from "../src/lib/readingQuality/qualityGuard.ts";

const demoPayloads: Record<string, Record<string, unknown>> = {
  napi_lap_ai: { cardName: "A Csillag", question: "Mire figyeljek ma?" },
  mai_iranytu_ai: {
    name: "Anna",
    dob: "1992-04-17",
    sign: "cancer",
    personalYear: 4,
    situation: "Bizonytalan vagyok egy új randi miatt",
  },
  angyalszam_ai: { number: "1111", root: 11 },
  angyalszam_ai_context: {
    number: "1111",
    root: 11,
    question: "Szakítás után láttam, miközben üzenetre vártam",
    situation: "Szakítás után láttam, miközben üzenetre vártam",
  },
  kristaly_ai: { mode: "month", month: 2, crystal: "Ametiszt" },
  alomfejtes_rovid: {
    text: "Egy régi házban jártam, víz folyt a lépcsőkön, és kerestem egy szobát.",
    emotion: "fear",
  },
  horoszkop_szemelyre: {
    name: "Dávid",
    sign: "Bak",
    personalYear: 8,
    situation: "Munkahelyi döntés előtt állok",
  },
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

const delegatedReportProducts = new Set([
  "personal_30_day",
  "vedic_full",
  "personal_yearly",
  "transits_personal",
]);

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
    name: "angyalszam_ai:context",
    slug: "angyalszam_ai",
    productName: "Angyalszám — mélyebb olvasat",
    payload: demoPayloads.angyalszam_ai_context,
    expect: ["Kapcsolati fókusz", "Szakítás után láttam"],
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

const paid = PRODUCTS.filter((product) => !delegatedReportProducts.has(product.slug)).map(
  (product) => {
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
  },
);

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
        question: "Visszajön-e tartósan, vagy csak rövid időre térne vissza?",
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
    required: ["Bak", "felelősség", "Munka és irány", "Munkahelyi döntés"],
  },
  {
    name: "context:paid_daily_compass_situation",
    body: composePaidOrderReading(
      "mai_iranytu_ai",
      "Mai iránytű — személyes üzenet",
      demoPayloads.mai_iranytu_ai,
    ).body,
    required: ["Rák", "Kapcsolati fókusz", "új randi", "érzelmi biztonság"],
  },
  {
    name: "context:paid_horoscope_gemini_specific",
    body: composePaidOrderReading("horoszkop_szemelyre", "Horoszkóp — személyre szabott", {
      name: "Lilla",
      sign: "Ikrek",
      situation: "Túl sok üzenet és döntés jön egyszerre",
    }).body,
    required: ["Ikrek", "sok gondolat", "Döntési fókusz", "Túl sok üzenet"],
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
    name: "context:paid_followup_reason_survives_fallback",
    body: composePaidOrderReading("dontes_komplex", "Döntés előtt — komplex elemzés", {
      ...demoPayloads.dontes_komplex,
      followupContext:
        "A kérdés, amiből továbbmegyünk: „Elfogadjam az új munkalehetőséget?”",
    }).body,
    required: ["Miért ezt ajánlottuk?", "A kérdés, amiből továbbmegyünk"],
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
          question: "Visszajön-e tartósan, vagy csak rövid időre térne vissza?",
        }),
      ),
    ),
    required: ["A kérdésed felől", "visszajön", "rövid", "tartós"],
  },
  {
    name: "context:free_love_intent_question",
    body: textFromReading(
      composeCompatibilityReading(
        calculateCompatibilityProfile({
          birthDateA: "1992-04-17",
          birthDateB: "1990-01-14",
          fullNameA: "Kovács Anna",
          fullNameB: "Nagy Péter",
          status: "most ismerkedünk",
          question: "Szeret engem?",
        }),
      ),
    ),
    required: ["Érzések helyett biztos bizonyítékot nem ad", "következetesebb jelenlét", "konkrét figyelem"],
  },
  {
    name: "context:free_three_card_present_heading",
    body: textFromReading(
      composeThreeCardTarot({
        readingType: "3 lapos húzás",
        cards: [CARDS[6], CARDS[9], CARDS[16]],
        question: "Komolyan gondolja ezt a kapcsolatot?",
        category: "randi / ismerkedés",
      }),
    ),
    required: ["Jelen — milyen minta aktív most?"],
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
const loveIntentBody = textFromReading(
  composeCompatibilityReading(
    calculateCompatibilityProfile({
      birthDateA: "1992-04-17",
      birthDateB: "1990-01-14",
      fullNameA: "Kovács Anna",
      fullNameB: "Nagy Péter",
      status: "most ismerkedünk",
      question: "Szeret engem?",
    }),
  ),
);
for (const forbiddenNeedle of ["ahol valódi szándék van", "valódi szándék"]) {
  if (loveIntentBody.includes(forbiddenNeedle)) {
    policyFailures.push(`compatibility intent answer must not claim to identify another person's true intent: ${forbiddenNeedle}`);
  }
}
const threeCardBody = textFromReading(
  composeThreeCardTarot({
    readingType: "3 lapos húzás",
    cards: [CARDS[6], CARDS[9], CARDS[16]],
    question: "Komolyan gondolja ezt a kapcsolatot?",
    category: "randi / ismerkedés",
  }),
);
for (const forbiddenNeedle of ["Jelen — mi történik most valójában?"]) {
  if (threeCardBody.includes(forbiddenNeedle)) {
    policyFailures.push(`free three-card reading must avoid revelation-style present heading: ${forbiddenNeedle}`);
  }
}
const paidServer = readFileSync("src/lib/paidReadings.server.ts", "utf8");
const paidReadingsSource = readFileSync("src/lib/paidReadings.ts", "utf8");
const aiServer = readFileSync("src/lib/ai.server.ts", "utf8");
const orderProcessing = readFileSync("src/lib/orderProcessing.server.ts", "utf8");
const reportQuality = readFileSync("src/lib/products/reportQuality.server.ts", "utf8");
const threeCardRoute = readFileSync("src/routes/harom-lap.tsx", "utf8");
const loveRoute = readFileSync("src/routes/randi-elott.tsx", "utf8");
const decisionRoute = readFileSync("src/routes/dontes-elott.tsx", "utf8");
const dailyCardRoute = readFileSync("src/routes/mai-lap.tsx", "utf8");
const dailyCompassRoute = readFileSync("src/routes/mai-iranytu.tsx", "utf8");
const compatibilityRoute = readFileSync("src/routes/osszeillunk.tsx", "utf8");

for (const needle of [
  "dailyFocus",
  "dailyFocusReflection",
  "Egy lap, egy napi fókusz a tarot hagyományából",
  "Nem jóslatként kezeljük, hanem csendes önismereti jelként",
  "Mire kérsz ma finomabb fókuszt?",
  "A napi lap ugyanaz marad",
  "A te fókuszodban",
  'dailyFocus.trim() || "Mire figyeljek ma?"',
  "situation: dailyFocus.trim() || undefined",
  "Mai fókusz:",
]) {
  if (!dailyCardRoute.includes(needle)) {
    policyFailures.push(`daily card route must preserve user focus reflection: ${needle}`);
  }
}

for (const needle of [
  "Tarot, számminta, holdjel és kristály hagyományos jeleiből induló napi fókusz",
  "Nem jóslat, hanem józan önismereti irány",
  "sourceRoute=\"/mai-iranytu\"",
  "productSlug=\"mai_iranytu_ai\"",
]) {
  if (!dailyCompassRoute.includes(needle)) {
    policyFailures.push(`daily compass route must keep tradition-based trust framing: ${needle}`);
  }
}

for (const needle of [
  "most látható kapcsolati jelekre adnak nézőpontot",
  "milyen józan lépés marad nálad",
  "ismétlődő mintára érdemes figyelned",
  "józan következő lépésre adnak nézőpontot",
]) {
  if (!loveRoute.includes(needle)) {
    policyFailures.push(`relationship tarot route must avoid mind-reading promises: ${needle}`);
  }
}

for (const forbiddenNeedle of [
  "valódi szándékát",
  "valójában mi zajlik",
  "mi mozgatja",
  "belső irányát",
]) {
  if (loveRoute.includes(forbiddenNeedle)) {
    policyFailures.push(`relationship tarot route must not claim to reveal another person's inner state: ${forbiddenNeedle}`);
  }
}

for (const needle of [
  "Te / első személy neve",
  "Másik fél neve",
  "Te / első személy születési dátuma",
  "Másik fél születési dátuma",
  "Te / első személy sorsszáma",
  "A másik fél sorsszáma",
  'partnerName: nb || "a másik fél"',
  'id="compat-question"',
  "question: q.trim() || undefined",
  "Visszajön-e tartósan",
  "function compatibilityPaidPayload",
  "compatibilitySnapshot",
  "freeReadingSummary",
  "comparisonContext",
  "personalityNumber",
]) {
  if (!compatibilityRoute.includes(needle)) {
    policyFailures.push(`compatibility route must use inclusive person labels: ${needle}`);
  }
}

for (const forbiddenNeedle of [
  "A férfi neve",
  "A nő neve",
  "Férfi születési dátuma",
  "Nő születési dátuma",
  "A férfi sorsszáma",
  "A nő sorsszáma",
  'partnerName: nb || "a nő"',
]) {
  if (compatibilityRoute.includes(forbiddenNeedle)) {
    policyFailures.push(`compatibility route must not force gendered labels: ${forbiddenNeedle}`);
  }
}

for (const needle of [
  "function threeCardFreeSynthesis",
  "categoryFreeHint",
  "A három lap együtt",
  "Mire figyelj most?",
  "A kérdésed nem általános",
  "randi",
  "Visszatérő történetnél",
  "Döntés előtt",
  "nem pénzügyi tanács",
]) {
  if (!threeCardRoute.includes(needle)) {
    policyFailures.push(`free three-card route must preserve contextual synthesis: ${needle}`);
  }
}

for (const needle of [
  "Három lap, egy ív a tarot hagyományából",
  "Nem biztos jövőt mond",
  "lehetséges irányát segít tisztábban látni",
  "Tartsd magad előtt a kérdést",
  "Nem külön lapmagyarázat készül",
  "mi ismétlődik, mi nyílik",
  "használható belső térképet",
]) {
  if (!threeCardRoute.includes(needle)) {
    policyFailures.push(`free three-card loading copy must stay grounded: ${needle}`);
  }
}

for (const needle of [
  "Kapcsolati fókusz a tarot hagyományából",
  "Nem bizonyíték a másik szándékára",
  "józan tükör a tempóra",
  "function loveQuestionSynthesis",
  "loveSituationHint",
  "A kérdésedre figyelve",
  "Mit mutat ez rólatok?",
  "A három lap együtt",
  "rövid fellángolásnál",
  "tartósabb figyelemmel",
  "nem automatikus válasz",
]) {
  if (!loveRoute.includes(needle)) {
    policyFailures.push(`love tarot route must answer user situation/question: ${needle}`);
  }
}

for (const needle of [
  "Tartsd magad előtt azt a találkozást vagy üzenetet",
  "helyzet érzelmi mintáját",
  "hol van valódi közeledés",
  "köztetek lévő dinamikát",
]) {
  if (!loveRoute.includes(needle)) {
    policyFailures.push(`love tarot loading copy must stay relationship-specific: ${needle}`);
  }
}

for (const needle of [
  "Egy csendes tarot-fókusz",
  "Nem dönt helyetted",
  "különválasztani a vágyat, a félelmet és a józan belső irányt",
  "function decisionTarotSynthesis",
  "decisionCategoryHint",
  "A döntési helyzeted",
  "Mit tisztít a döntés?",
  "A döntés íve",
  "nem pénzügyi tanács",
  "nem dönt helyetted",
  "nem parancsot ad",
]) {
  if (!decisionRoute.includes(needle)) {
    policyFailures.push(`decision tarot route must answer user situation/question: ${needle}`);
  }
}

for (const needle of [
  "Tartsd magad előtt a döntést",
  "mi húz előre, és mi tart vissza",
  "vágyat, a félelmet és a józan belső irányt",
  "Nem az a cél, hogy a lap döntsön helyetted",
]) {
  if (!decisionRoute.includes(needle)) {
    policyFailures.push(`decision tarot loading copy must stay decision-specific: ${needle}`);
  }
}

for (const forbiddenNeedle of [
  "Jelen — mi történik most valójában?",
  "aranyszínű fény",
  "szíveddel érzel",
  "belső rezgés",
  "A lapok már úton vannak",
  "engedd el a gondolataidat",
]) {
  for (const [routeName, source] of [
    ["three-card", threeCardRoute],
    ["love", loveRoute],
    ["decision", decisionRoute],
  ] as const) {
    if (source.includes(forbiddenNeedle)) {
      policyFailures.push(
        `${routeName} loading copy must avoid generic mystical filler: ${forbiddenNeedle}`,
      );
    }
  }
}

const delegatedReports = [
  {
    slug: "personal_30_day",
    file: "src/lib/products/personal30day.server.ts",
    fn: "generatePersonal30DayReport",
    schema: "personal_30_day_report",
    route: "@/lib/products/personal30day.server",
    heading: "## A következő 30 napod fő témája",
  },
  {
    slug: "vedic_full",
    file: "src/lib/products/vedicFull.server.ts",
    fn: "generateVedicFullReport",
    schema: "vedic_full_report",
    route: "@/lib/products/vedicFull.server",
    heading: "## A védikus képleted alapjai",
  },
  {
    slug: "personal_yearly",
    file: "src/lib/products/personalYearly.server.ts",
    fn: "generatePersonalYearlyReport",
    schema: "personal_yearly_report",
    route: "@/lib/products/personalYearly.server",
    heading: "## Az éved fő motívuma",
  },
  {
    slug: "transits_personal",
    file: "src/lib/products/transitsPersonal.server.ts",
    fn: "generateTransitsPersonalReport",
    schema: "transits_personal_report",
    route: "@/lib/products/transitsPersonal.server",
    heading: "## A jelenleg ható tranzitok",
  },
] as const;

for (const report of delegatedReports) {
  const body = readFileSync(report.file, "utf8");
  for (const needle of [`args.productSlug === "${report.slug}"`, report.route, report.fn]) {
    if (!orderProcessing.includes(needle)) {
      policyFailures.push(`${report.slug}: order processing must delegate to ${report.fn}`);
    }
  }
  for (const needle of [
    `export async function ${report.fn}`,
    "safeCallRoxy",
    "callRoxy",
    "aiJSON",
    report.schema,
    report.heading,
    "LEGAL_FOOTER",
    "hagyományalapú, önismereti célú olvasatokat nyújt",
    "Nem orvosi, jogi, pénzügyi",
    "assertPaidAstrologySource",
    "requireUsablePaidAstrologyReport",
    `productSlug: "${report.slug}"`,
    "requiredHeadings",
    "minChars",
    "const aiMarkdown",
    "report_quality_fallback: false",
    "location_resolved: Boolean(location)",
    "natal_available: Boolean(natal)",
    "Boolean(ai.meta?.fallbackUsed)",
  ]) {
    if (!body.includes(needle)) {
      policyFailures.push(`${report.slug}: report generator missing ${needle}`);
    }
  }

  for (const forbiddenNeedle of [
    "buildFallbackReport",
    "location: locRaw ?? null",
    "natal: natal ?? null",
    "forecast: forecast ?? null",
    "yearly: yearly ?? null",
    "transits: transits ?? null",
    "vedic_summary: vedicSummary",
  ]) {
    if (body.includes(forbiddenNeedle)) {
      policyFailures.push(
        `${report.slug}: raw provider payload must not be stored in response_payload`,
      );
    }
  }

  for (const forbiddenNeedle of ["Ami biztosan", "biztosan a te kezedben"]) {
    if (body.includes(forbiddenNeedle)) {
      policyFailures.push(
        `${report.slug}: fallback report must avoid deterministic certainty wording`,
      );
    }
  }
}

for (const needle of [
  "inspectPaidAstrologyReport",
  "usablePaidAstrologyReport",
  "PaidAstrologyReportUnavailableError",
  "assertPaidAstrologySource",
  "requireUsablePaidAstrologyReport",
  "[paid_astrology_source_unavailable]",
  "paid_astrology_report_unusable",
  "too_short",
  "missing_heading",
  "forbidden_claim_or_phrase",
  "too_much_raw_english",
  "repetitive_missing_source_copy",
  "weak_hungarian_signal",
  "[paid_astrology_report_rejected]",
]) {
  if (!reportQuality.includes(needle)) {
    policyFailures.push(`paid astrology report quality guard missing ${needle}`);
  }
}

if (!paidServer.includes('providerPreference: "openai_first"')) {
  policyFailures.push("paid readings must prefer the strongest premium editorial route");
}
if (!paidServer.includes("allowLovableFallback: false")) {
  policyFailures.push("paid readings must not fall back to a weaker gateway model");
}
if (!paidServer.includes('"gpt-5.2"') || !aiServer.includes('"gpt-5.2"')) {
  policyFailures.push("paid reading model defaults must reference the premium 5.2 model");
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
  !paidServer.includes("paidReadingInputBrief(opts.inputPayload)") ||
  !paidServer.includes("Ügyfélhelyzet röviden") ||
  !paidServer.includes('"q"') ||
  !paidServer.includes('"cat"') ||
  !paidServer.includes('"sit"') ||
  !paidServer.includes('"myName"') ||
  !paidServer.includes('"hisName"') ||
  !paidServer.includes('"text"') ||
  !paidServer.includes('"emotion"') ||
  !paidServer.includes('"cardSpread"') ||
  !paidServer.includes('"freeSynthesis"') ||
  !paidServer.includes('"compatibilitySnapshot"') ||
  !paidServer.includes('"freeReadingSummary"') ||
  !paidServer.includes('"comparisonContext"') ||
  !paidServer.includes('"followupContext"') ||
  !paidServer.includes('"memoryContext"') ||
  !paidServer.includes("countContextHits(body, anchors)") ||
  !paidServer.includes("countContextSections(reading.body, anchors)") ||
  !paidServer.includes("function paidReadingMinimumContextHits") ||
  !paidServer.includes("function paidReadingMinimumContextSections") ||
  !paidServer.includes("requiredContextHits") ||
  !paidServer.includes("requiredContextSections") ||
  !paidServer.includes("weak_user_context") ||
  !paidServer.includes("contextHits < requiredContextHits") ||
  !paidServer.includes("thin_user_context_sections") ||
  !paidServer.includes("missing_user_context") ||
  !paidServer.includes("contextHits: quality.contextHits") ||
  !paidServer.includes("requiredContextHits: quality.requiredContextHits") ||
  !paidServer.includes("contextSections: quality.contextSections") ||
  !paidServer.includes("requiredContextSections: quality.requiredContextSections") ||
  !paidServer.includes("inspectPaidReadingQuality(ai.data, opts.productSlug, opts.inputPayload)") ||
  !paidServer.includes("[paid_reading_quality_rejected]") ||
  !paidServer.includes("issues: quality.issues") ||
  !paidServer.includes("hasPaidSafetyFrame") ||
  !paidServer.includes("missing_safety_frame") ||
  !paidServer.includes("önismereti") ||
  !paidServer.includes("önismereti biztonsági keret") ||
  !paidServer.includes("Minden bekezdés mondjon valami újat és konkrétat") ||
  !paidServer.includes("Legalább két külön szakaszban kösd vissza") ||
  !paidServer.includes("Ne használj Markdown-jeleket vagy emojit")
) {
  policyFailures.push("paid AI quality gate must be stricter for deep paid products");
}
if (paidServer.includes("önismereti jogi megjegyzés")) {
  policyFailures.push("paid AI prompt must ask for a safety frame, not a confusing legal note");
}
if (
  !paidReadingsSource.includes("export function paidReadingInputBrief") ||
  !paidReadingsSource.includes("INPUT_BRIEF_LABELS") ||
  !paidReadingsSource.includes('q: "Kérdés"') ||
  !paidReadingsSource.includes('sit: "Helyzet"') ||
  !paidReadingsSource.includes('myName: "Első név"') ||
  !paidReadingsSource.includes('emotion: "Érzés"') ||
  !paidReadingsSource.includes('followupContext: "Miért ezt ajánlottuk"') ||
  !paidReadingsSource.includes("function readingWithFollowupContext") ||
  !paidReadingsSource.includes("Miért ezt ajánlottuk?") ||
  !paidReadingsSource.includes("renderReading(reading, input)") ||
  !paidReadingsSource.includes('memoryContext: "Visszatérő minta"') ||
  !paidReadingsSource.includes("function paidTarotSpreadFromPayload") ||
  !paidReadingsSource.includes("function briefPaidTarotSpread") ||
  !paidReadingsSource.includes("function briefFreeSynthesis") ||
  !paidReadingsSource.includes("Kártyakirakás:") ||
  !paidReadingsSource.includes("A kirakás pontos lenyomata") ||
  !paidReadingsSource.includes("A rövid olvasatból továbbmélyítve") ||
  !paidReadingsSource.includes("function briefCompatibilitySnapshot") ||
  !paidReadingsSource.includes("function briefFreeReadingSummary") ||
  !paidReadingsSource.includes("Összeillési számolás:") ||
  !paidReadingsSource.includes("Az első olvasatból továbbvíve") ||
  !paidReadingsSource.includes("Ha több embert is összehasonlítasz") ||
  !paidReadingsSource.includes("question,")
) {
  policyFailures.push("paid readings must build a short Hungarian customer context brief");
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
  !paidServer.includes('"paid_generation_fallback"') ||
  !paidServer.includes("weak_user_context|thin_user_context_sections")
) {
  policyFailures.push("paid generation must persist internal source/model/fallback metadata");
}
if (!aiServer.includes("allowLovableFallback && primaryModel !== LOVABLE_FALLBACK_MODEL")) {
  policyFailures.push("shared editorial helper must make fallback opt-in/controllable");
}
if (
  !aiServer.includes("export type AiResultMeta") ||
  !aiServer.includes("meta?: AiResultMeta") ||
  !aiServer.includes("function resultMeta") ||
  !aiServer.includes('provider: "openai" | "lovable"') ||
  !aiServer.includes("latencyMs: Date.now() - opts.started")
) {
  policyFailures.push("shared editorial helper must return internal routing and latency metadata");
}
if (
  aiServer.includes("body: t.slice") ||
  aiServer.includes("res.text()") ||
  aiServer.includes("raw response") ||
  aiServer.includes("e instanceof Error ? e.message") ||
  aiServer.includes("error: e.message")
) {
  policyFailures.push("shared editorial helper must not expose raw runtime error text");
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

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
    name: "context:paid_ex_return",
    body: composePaidOrderReading(
      "parkapcsolat_elemzes",
      "Párkapcsolat — mély elemzés",
      demoPayloads.parkapcsolat_elemzes,
    ).body,
    required: ["visszatér", "rövid", "tartós"],
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
if (failed.length) {
  console.error("\nFailed quality audit:");
  for (const item of failed) console.error(`- ${item.name}: ${item.issues.join("; ")}`);
  process.exit(1);
}

// SERVER-ONLY. A "Védikus asztrológia – teljes elemzés" termék Roxy + AI flow-ja.
// Webhook hívja `processPaidOrderBySession` ágból. Kimenete a megszokott
// PaidOrderReading shape ({ title, body }), így a köszönő oldal és az
// email-template változatlanul tudja megjeleníteni.
//
// Forrás: Roxy /astrology/natal-chart (tropikus). Mi deterministikusan
// alkalmazunk Lahiri ayanamsa korrekciót (~24.18°) a védikus (sziderikus)
// Hold-, Nap- és Aszcendens-jegy + nakshatra megállapításához. Az AI ezt
// fordítja le és rendezi védikus szerkezetbe — nem talál ki dashákat.

import { aiJSON } from "@/lib/ai.server";
import { usablePaidAstrologyReport } from "@/lib/products/reportQuality.server";

const LEGAL_FOOTER =
  "A Jövőd.hu szórakoztató és önismereti célú tartalmat nyújt. Nem orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadás.";

const AREA_LABEL: Record<string, string> = {
  szerelem: "Szerelem / párkapcsolat (kama)",
  munka: "Munka / karrier (artha)",
  penz: "Pénz / döntések (artha)",
  altalanos: "Általános — dharma, artha, kama, moksha egyensúly",
};

const RASHI = [
  "Mésa (Kos)",
  "Vrishabha (Bika)",
  "Mithuna (Ikrek)",
  "Karka (Rák)",
  "Simha (Oroszlán)",
  "Kanya (Szűz)",
  "Tula (Mérleg)",
  "Vrischika (Skorpió)",
  "Dhanu (Nyilas)",
  "Makara (Bak)",
  "Kumbha (Vízöntő)",
  "Mína (Halak)",
];

const NAKSHATRA = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

// Lahiri ayanamsa közelítés (2026 körül ~24.18°). Évi ~50.29" precesszió.
function lahiriAyanamsa(year: number): number {
  const base = 24.1; // 2025
  return base + (year - 2025) * (50.29 / 3600);
}

function siderealLongitude(tropicalDeg: number, year: number): number {
  let s = tropicalDeg - lahiriAyanamsa(year);
  while (s < 0) s += 360;
  while (s >= 360) s -= 360;
  return s;
}

function signFromLongitude(lon: number): string {
  const idx = Math.floor(lon / 30) % 12;
  return RASHI[idx]!;
}

function nakshatraFromMoon(lon: number): { name: string; pada: number } {
  // Egy nakshatra = 360/27 = 13°20' = 13.3333°. Egy pada = 3°20'.
  const idx = Math.floor(lon / (360 / 27)) % 27;
  const within = lon - idx * (360 / 27);
  const pada = Math.min(4, Math.floor(within / (360 / 27 / 4)) + 1);
  return { name: NAKSHATRA[idx]!, pada };
}

type LocationHit = {
  name?: string;
  display?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  country?: string;
};

function pickLocation(raw: unknown): LocationHit | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const cities = (obj.cities ?? obj.results ?? obj.data) as unknown;
  if (Array.isArray(cities) && cities.length > 0) {
    const c = cities[0] as Record<string, unknown>;
    return {
      name: typeof c.name === "string" ? c.name : undefined,
      display: typeof c.display === "string" ? c.display : undefined,
      latitude: typeof c.latitude === "number" ? c.latitude : Number(c.latitude),
      longitude: typeof c.longitude === "number" ? c.longitude : Number(c.longitude),
      timezone: typeof c.timezone === "string" ? c.timezone : undefined,
      country: typeof c.country === "string" ? c.country : undefined,
    };
  }
  return null;
}

async function safeCallRoxy<T = unknown>(opts: {
  endpoint: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  cacheKey: string;
  ttlSeconds: number | null;
}): Promise<T | null> {
  try {
    const { callRoxy } = await import("@/lib/roxy.server");
    const r = await callRoxy<T>(opts);
    return r.ok ? (r.data ?? null) : null;
  } catch {
    return null;
  }
}

function pickPlanetLongitude(natal: unknown, planet: string): number | null {
  if (!natal || typeof natal !== "object") return null;
  const root = natal as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<
    string,
    unknown
  >;
  const planets = (data.planets ?? data.bodies ?? data.positions) as unknown;
  if (Array.isArray(planets)) {
    const hit = planets.find((p) => {
      if (!p || typeof p !== "object") return false;
      const n = (p as Record<string, unknown>).name;
      return typeof n === "string" && n.toLowerCase() === planet.toLowerCase();
    }) as Record<string, unknown> | undefined;
    if (hit) {
      const lon = hit.longitude ?? hit.lon ?? hit.degree ?? hit.absoluteDegree;
      if (typeof lon === "number") return lon;
      if (typeof lon === "string") {
        const n = Number(lon);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  if (planets && typeof planets === "object") {
    const obj = planets as Record<string, unknown>;
    const hit = obj[planet] ?? obj[planet.toLowerCase()];
    if (hit && typeof hit === "object") {
      const lon =
        (hit as Record<string, unknown>).longitude ?? (hit as Record<string, unknown>).lon;
      if (typeof lon === "number") return lon;
    }
    if (typeof hit === "number") return hit;
  }
  return null;
}

function pickAscendantLongitude(natal: unknown): number | null {
  if (!natal || typeof natal !== "object") return null;
  const root = natal as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<
    string,
    unknown
  >;
  const candidates: unknown[] = [
    data.ascendant,
    data.asc,
    (data.angles as Record<string, unknown> | undefined)?.ascendant,
    (data.houses as Record<string, unknown> | undefined)?.[0],
  ];
  for (const c of candidates) {
    if (typeof c === "number") return c;
    if (c && typeof c === "object") {
      const lon = (c as Record<string, unknown>).longitude ?? (c as Record<string, unknown>).lon;
      if (typeof lon === "number") return lon;
    }
  }
  return null;
}

export type VedicFullInput = {
  birthDate: string;
  birthTime?: string | null;
  birthPlace: string;
  area: string;
  question?: string | null;
  name?: string | null;
};

export async function generateVedicFullReport(
  input: VedicFullInput,
): Promise<{ title: string; body: string; raw?: Record<string, unknown> }> {
  const birthTime = input.birthTime || "12:00";
  const approximate = !input.birthTime;
  const areaLabel = AREA_LABEL[input.area] ?? AREA_LABEL.altalanos!;
  const birthYear = Number(input.birthDate.slice(0, 4)) || new Date().getFullYear();

  const locRaw = await safeCallRoxy<unknown>({
    endpoint: `/location/search?q=${encodeURIComponent(input.birthPlace)}`,
    method: "GET",
    cacheKey: `loc:${input.birthPlace.toLowerCase().trim()}`,
    ttlSeconds: 60 * 60 * 24 * 30,
  });
  const location = pickLocation(locRaw);

  const natalBody: Record<string, unknown> = {
    birthDate: input.birthDate,
    birthTime,
    name: input.name ?? undefined,
  };
  if (location?.latitude && location?.longitude) {
    natalBody.latitude = location.latitude;
    natalBody.longitude = location.longitude;
  }
  if (location?.timezone) natalBody.timezone = location.timezone;
  const natal = await safeCallRoxy<unknown>({
    endpoint: "/astrology/natal-chart",
    method: "POST",
    body: natalBody,
    cacheKey: `natal:${input.birthDate}:${birthTime}:${input.birthPlace.toLowerCase().trim()}`,
    ttlSeconds: 60 * 60 * 24 * 365,
  });

  // Védikus (sziderikus) számítások — deterministikus, AI nem érinti.
  const sunTrop = pickPlanetLongitude(natal, "Sun");
  const moonTrop = pickPlanetLongitude(natal, "Moon");
  const ascTrop = pickAscendantLongitude(natal);
  const sunSid = sunTrop != null ? siderealLongitude(sunTrop, birthYear) : null;
  const moonSid = moonTrop != null ? siderealLongitude(moonTrop, birthYear) : null;
  const ascSid = ascTrop != null ? siderealLongitude(ascTrop, birthYear) : null;

  const vedicSummary = {
    rashi_napjegy: sunSid != null ? signFromLongitude(sunSid) : null,
    rashi_holdjegy: moonSid != null ? signFromLongitude(moonSid) : null,
    lagna_aszcendens: ascSid != null && !approximate ? signFromLongitude(ascSid) : null,
    nakshatra: moonSid != null ? nakshatraFromMoon(moonSid) : null,
    ayanamsa: lahiriAyanamsa(birthYear).toFixed(3) + "° (Lahiri)",
  };

  const userInputSummary = [
    `Név: ${input.name?.trim() || "—"}`,
    `Születési dátum: ${input.birthDate}`,
    `Születési idő: ${input.birthTime || "nincs megadva (12:00 közelítés — aszcendens NEM számolható)"}`,
    `Születési hely: ${input.birthPlace}`,
    location
      ? `Helyszín feloldva: ${location.display ?? location.name ?? ""} (${location.latitude}, ${location.longitude}, ${location.timezone ?? "ismeretlen tz"})`
      : "Helyszín nem feloldható — közelítés.",
    `Életterület fókusz: ${areaLabel}`,
    input.question?.trim() ? `Kérdés: ${input.question.trim()}` : "Kérdés: nincs megadva",
  ].join("\n");

  const system = [
    "Magyar védikus asztrológiai riportot írsz a Jövőd.hu hangján: természetes, személyes, józan.",
    "A jegyekhez a kapott sziderikus rashi mezőket használd. A Roxy tropikus adat csak háttér-bolygóhelyzet.",
    "Ne találj ki dasha-időszakot, yoga-kombinációt, dátumot vagy biztos jövőt. Ha nincs adat, mondd röviden, hogy erre most nincs külön jelzés.",
    "A kérdésre és a választott életterületre ténylegesen reagálj, de ne magyarázd túl a módszert.",
    "Markdown riportot adj ezekkel a ## fejezetekkel, ebben a sorrendben:",
    "## Bevezető — mit ad a védikus olvasat",
    "## A védikus képleted alapjai (Lagna, Rashi, Hold-rashi, Nakshatra)",
    "## A Hold-jegy és a nakshatra üzenete",
    "## Dharma — élethivatás iránya",
    "## Artha — munka, anyagi biztonság",
    "## Kama — szerelem, vágyak, kapcsolatok",
    "## Moksha — belső út, elengedés",
    "## A választott életterületed mélyebben",
    "## Mire figyelj — karmikus mintázat",
    "## Záró üzenet",
    `Ha a születési idő közelítés volt (${approximate ? "igen" : "nem"}), a Lagna szakaszban jelezd egy mondatban, hogy az aszcendens nem pontos.`,
    "Legyen részletes, de ne terjengős.",
  ].join("\n");

  const user = [
    "FELHASZNÁLÓI ADATOK:",
    userInputSummary,
    "",
    "VÉDIKUS (SZIDERIKUS) ÉRTÉKEK — deterministikusan számolt, ezeket használd jegyként:",
    JSON.stringify(vedicSummary, null, 2),
    "",
    "ROXY NATAL CHART (nyers JSON, angol, TROPIKUS — csak háttér-bolygó-helyzetnek):",
    JSON.stringify(natal).slice(0, 14_000),
    "",
    "Add vissza a magyar védikus riportot Markdown formában. Ne tegyél hozzá címet a riport elejére — én adok hozzá külön címet.",
  ].join("\n");

  const ai = await aiJSON<{ markdown: string }>({
    system,
    user,
    schemaName: "vedic_full_report",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["markdown"],
      properties: { markdown: { type: "string" } },
    },
    readingType: "vedic_full",
    timeoutMs: 120_000,
  });

  const reportMd =
    ai.ok && ai.data?.markdown
      ? usablePaidAstrologyReport(ai.data.markdown, {
          productSlug: "vedic_full",
          minChars: 1800,
          requiredHeadings: [
            "## Bevezető — mit ad a védikus olvasat",
            "## A védikus képleted alapjai (Lagna, Rashi, Hold-rashi, Nakshatra)",
            "## A választott életterületed mélyebben",
            "## Záró üzenet",
          ],
        })
      : "";
  const fallbackBody = reportMd
    ? reportMd
    : buildFallbackReport({ input, areaLabel, vedicSummary, location });

  const greeting = input.name?.trim() ? `${input.name.trim()}, ` : "";
  const title = `Védikus asztrológia – teljes elemzésed`;
  const body = [
    `# ${title}`,
    "",
    `${greeting}ez a riport a saját születési képletedre épül, védikus (sziderikus) szemszögből.`,
    `Életterület fókusz: **${areaLabel}**.`,
    "",
    fallbackBody,
    "",
    "---",
    `_${LEGAL_FOOTER}_`,
  ].join("\n");

  return {
    title,
    body,
    raw: {
      location: locRaw ?? null,
      natal: natal ?? null,
      vedic_summary: vedicSummary,
      ai_model: ai.meta?.model ?? null,
      ai_fallback: ai.meta?.fallbackUsed ?? false,
    },
  };
}

function buildFallbackReport(opts: {
  input: VedicFullInput;
  areaLabel: string;
  vedicSummary: Record<string, unknown>;
  location: LocationHit | null;
}): string {
  const { input, areaLabel, vedicSummary, location } = opts;
  const v = vedicSummary as {
    rashi_napjegy: string | null;
    rashi_holdjegy: string | null;
    lagna_aszcendens: string | null;
    nakshatra: { name: string; pada: number } | null;
  };
  return [
    "## Bevezető — mit ad a védikus olvasat",
    "A védikus (sziderikus) szemlélet a Hold-jegyre és a nakshatrára épít. A forrás most nem ad bőséges anyagot, ezért csak a számítható alapokat osztjuk meg.",
    "",
    "## A védikus képleted alapjai (Lagna, Rashi, Hold-rashi, Nakshatra)",
    `Születési dátum: ${input.birthDate}${input.birthTime ? `, idő: ${input.birthTime}` : " (idő nincs megadva, közelítő elemzés)"}, hely: ${input.birthPlace}${location ? ` (feloldva)` : " (helyszín nem feloldható volt)"}.`,
    `Nap-rashi: ${v.rashi_napjegy ?? "nem számolható"}.`,
    `Hold-rashi: ${v.rashi_holdjegy ?? "nem számolható"}.`,
    `Lagna (aszcendens): ${v.lagna_aszcendens ?? "nem számolható (idő nélkül nem pontos)"}.`,
    `Nakshatra: ${v.nakshatra ? `${v.nakshatra.name} (pada ${v.nakshatra.pada})` : "nem számolható"}.`,
    "",
    "## A Hold-jegy és a nakshatra üzenete",
    "A forrás erről most nem ad külön jelzést.",
    "",
    "## Dharma — élethivatás iránya",
    "A forrás erről most nem ad külön jelzést.",
    "",
    "## Artha — munka, anyagi biztonság",
    "A forrás erről most nem ad külön jelzést.",
    "",
    "## Kama — szerelem, vágyak, kapcsolatok",
    "A forrás erről most nem ad külön jelzést.",
    "",
    "## Moksha — belső út, elengedés",
    "A forrás erről most nem ad külön jelzést.",
    "",
    "## A választott életterületed mélyebben",
    `A választott életterületed ebben az elemzésben: **${areaLabel}**.`,
    "",
    "## Mire figyelj — karmikus mintázat",
    "A karma itt nem büntetés, hanem visszatérő minta. Kérlek, próbáld újra később, ha most nem érkezett teljes forrás.",
    "",
    "## Záró üzenet",
    "A védikus asztrológia tükör. A választás mindig nálad marad.",
  ].join("\n");
}

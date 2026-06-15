// SERVER-ONLY. A "30 napod térképe" termék Roxy + AI flow-ja.
// Webhook hívja `processPaidOrderBySession` ágból. Kimenete a megszokott
// PaidOrderReading shape ({ title, body }), így a köszönő oldal és az
// email-template változatlanul tudja megjeleníteni.

import { aiJSON } from "@/lib/ai.server";
import { usablePaidAstrologyReport } from "@/lib/products/reportQuality.server";

const LEGAL_FOOTER =
  "A Jövőd.hu szórakoztató és önismereti célú tartalmat nyújt. Nem orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadás.";

const AREA_LABEL: Record<string, string> = {
  szerelem: "Szerelem / párkapcsolat",
  munka: "Munka / karrier",
  penz: "Pénz / döntések",
  altalanos: "Általános — minden életterület",
};

export type Personal30DayInput = {
  birthDate: string;
  birthTime?: string | null;
  birthPlace: string;
  area: string;
  question?: string | null;
  name?: string | null;
};

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

export async function generatePersonal30DayReport(
  input: Personal30DayInput,
): Promise<{ title: string; body: string; raw?: Record<string, unknown> }> {
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 30 * 86_400_000);
  const endDate = end.toISOString().slice(0, 10);
  const birthTime = input.birthTime || "12:00";
  const approximate = !input.birthTime;
  const areaLabel = AREA_LABEL[input.area] ?? "Általános — minden életterület";

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

  const forecast = await safeCallRoxy<unknown>({
    endpoint: "/forecast/timeline",
    method: "POST",
    body: {
      birthDate: input.birthDate,
      birthTime,
      latitude: location?.latitude,
      longitude: location?.longitude,
      timezone: location?.timezone,
      startDate,
      endDate,
    },
    cacheKey: `forecast30:${input.birthDate}:${birthTime}:${input.birthPlace.toLowerCase().trim()}:${startDate}`,
    ttlSeconds: 60 * 60 * 12,
  });

  const userInputSummary = [
    `Név: ${input.name?.trim() || "—"}`,
    `Születési dátum: ${input.birthDate}`,
    `Születési idő: ${input.birthTime || "nincs megadva (12:00 közelítés)"}`,
    `Születési hely: ${input.birthPlace}`,
    location
      ? `Helyszín feloldva: ${location.display ?? location.name ?? ""} (${location.latitude}, ${location.longitude}, ${location.timezone ?? "ismeretlen tz"})`
      : "Helyszín nem feloldható — közelítés.",
    `Életterület fókusz: ${areaLabel}`,
    input.question?.trim() ? `Kérdés: ${input.question.trim()}` : "Kérdés: nincs megadva",
    `Időablak: ${startDate} -> ${endDate}`,
  ].join("\n");

  const system = [
    "Magyar asztrológiai riportot írsz a Jövőd.hu hangján: természetes, személyes, józan.",
    "Csak a kapott Roxy-forrásból és a felhasználói adatokból dolgozz. Ne találj ki tranzitot, dátumot vagy biztos jövőt.",
    "A kérdésre és a választott életterületre ténylegesen reagálj, de ne magyarázd a módszert.",
    "Markdown riportot adj ezekkel a ## fejezetekkel, ebben a sorrendben:",
    "## A következő 30 napod fő témája",
    "## Születési képleted röviden",
    "## Legfontosabb időablakok",
    "## Szerelem / kapcsolatok",
    "## Munka / pénz / döntések",
    "## Mire figyelj",
    "## Záró üzenet",
    "Ha valamire nincs forrásadat, egyszerűen mondd, hogy erre most nincs külön jelzés.",
    `Ha a születési idő közelítés volt (${approximate ? "igen" : "nem"}), egy mondatban jelezd a Születési képleted részben.`,
  ].join("\n");

  const user = [
    "FELHASZNÁLÓI ADATOK:",
    userInputSummary,
    "",
    "ROXY NATAL CHART (nyers JSON, angol):",
    JSON.stringify(natal).slice(0, 12_000),
    "",
    "ROXY FORECAST TIMELINE 30 NAPRA (nyers JSON, angol):",
    JSON.stringify(forecast).slice(0, 16_000),
    "",
    "Add vissza a magyar riportot Markdown formában. Ne tegyél hozzá címet a riport elejére — én adok hozzá külön címet.",
  ].join("\n");

  const ai = await aiJSON<{ markdown: string }>({
    system,
    user,
    schemaName: "personal_30_day_report",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["markdown"],
      properties: { markdown: { type: "string" } },
    },
    readingType: "personal_30_day",
    timeoutMs: 90_000,
  });

  const aiMarkdown = ai.ok && ai.data?.markdown ? ai.data.markdown : "";
  const reportMd = aiMarkdown
    ? usablePaidAstrologyReport(aiMarkdown, {
          productSlug: "personal_30_day",
          minChars: 1200,
          requiredHeadings: [
            "## A következő 30 napod fő témája",
            "## Születési képleted röviden",
            "## Mire figyelj",
            "## Záró üzenet",
          ],
        })
    : "";
  const reportQualityFallback = Boolean(aiMarkdown && !reportMd);
  const fallbackBody = reportMd
    ? reportMd
    : buildFallbackReport({ input, areaLabel, startDate, endDate, location });

  const greeting = input.name?.trim() ? `${input.name.trim()}, ` : "";
  const title = `A következő 30 napod térképe`;
  const body = [
    `# ${title}`,
    "",
    `${greeting}ez a riport a saját születési képletedre épül, és a következő 30 napra (${startDate} → ${endDate}) szól.`,
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
      location_resolved: Boolean(location),
      natal_available: Boolean(natal),
      forecast_available: Boolean(forecast),
      ai_model: ai.meta?.model ?? null,
      ai_fallback: Boolean(ai.meta?.fallbackUsed || reportQualityFallback),
      report_quality_fallback: reportQualityFallback,
    },
  };
}

function buildFallbackReport(opts: {
  input: Personal30DayInput;
  areaLabel: string;
  startDate: string;
  endDate: string;
  location: LocationHit | null;
}): string {
  const { input, areaLabel, startDate, endDate, location } = opts;
  return [
    "## A következő 30 napod fő témája",
    "A forrásból most nem érkezett részletes tranzit-adat, ezért nem fogalmazunk meg konkrét jóslatot. Ami biztosan a te kezedben van: hogyan figyelsz oda a választott életterületre a következő 30 napban.",
    "",
    "## Születési képleted röviden",
    `Születési dátum: ${input.birthDate}${input.birthTime ? `, idő: ${input.birthTime}` : " (idő nincs megadva, közelítő elemzés)"}, hely: ${input.birthPlace}${location ? ` (feloldva)` : " (helyszín nem feloldható volt)"}.`,
    "A forrás most nem ad külön jelzést a részletes házakra és bolygóhelyzetekre — kérünk, próbáld újra később, és pótoljuk.",
    "",
    "## Legfontosabb időablakok",
    `Időszak: ${startDate} → ${endDate}. A forrás erről most nem ad külön jelzést.`,
    "",
    "## Szerelem / kapcsolatok",
    "A forrás erről most nem ad külön jelzést.",
    "",
    "## Munka / pénz / döntések",
    "A forrás erről most nem ad külön jelzést.",
    "",
    "## Mire figyelj",
    `A választott életterületed ebben az időszakban: **${areaLabel}**.`,
    "",
    "## Záró üzenet",
    "Az asztrológia nem dönt helyetted. Tükör, ami abban segít, hogy észrevedd a visszatérő mintát.",
  ].join("\n");
}

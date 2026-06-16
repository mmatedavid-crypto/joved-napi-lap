// SERVER-ONLY. A "Személyes éves horoszkóp" termék Roxy + AI flow-ja.
// Mintát ad a personal30day.server.ts — itt 365 napos időablakkal és
// havi bontás-fókusszal hívjuk a Roxy forecast/timeline-t.

import { aiJSON } from "@/lib/ai.server";
import {
  assertPaidAstrologySource,
  requireUsablePaidAstrologyReport,
} from "@/lib/products/reportQuality.server";

const LEGAL_FOOTER =
  "A Jövőd.hu szórakoztató és önismereti célú tartalmat nyújt. Nem orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadás.";

const AREA_LABEL: Record<string, string> = {
  szerelem: "Szerelem / párkapcsolat",
  munka: "Munka / karrier",
  penz: "Pénz / döntések",
  altalanos: "Általános — minden életterület",
};

export type PersonalYearlyInput = {
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

export async function generatePersonalYearlyReport(
  input: PersonalYearlyInput,
): Promise<{ title: string; body: string; raw?: Record<string, unknown> }> {
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 365 * 86_400_000);
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

  // Próbáljuk a /yearly-horoscope endpointot; ha nincs, esünk vissza
  // a forecast/timeline 365 napos lekérésére.
  let yearly = await safeCallRoxy<unknown>({
    endpoint: "/yearly-horoscope",
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
    cacheKey: `yearly:${input.birthDate}:${birthTime}:${input.birthPlace.toLowerCase().trim()}:${startDate}`,
    ttlSeconds: 60 * 60 * 24,
  });
  if (!yearly) {
    yearly = await safeCallRoxy<unknown>({
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
      cacheKey: `forecast365:${input.birthDate}:${birthTime}:${input.birthPlace.toLowerCase().trim()}:${startDate}`,
      ttlSeconds: 60 * 60 * 24,
    });
  }

  assertPaidAstrologySource({
    productSlug: "personal_yearly",
    available: { natal: Boolean(natal), yearly: Boolean(yearly) },
    required: ["natal", "yearly"],
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
    `Időablak: ${startDate} -> ${endDate} (12 hónap)`,
  ].join("\n");

  const system = [
    "Magyar éves asztrológiai riportot írsz a Jövőd.hu hangján: természetes, személyes, józan.",
    "Csak a kapott Roxy-forrásból és a felhasználói adatokból dolgozz. Ne találj ki tranzitot, dátumot vagy biztos jövőt.",
    "A kérdésre és a választott életterületre ténylegesen reagálj, de ne magyarázd a módszert.",
    "Markdown riportot adj ezekkel a ## fejezetekkel, ebben a sorrendben:",
    "## Az éved fő motívuma",
    "## Születési képleted röviden",
    "## Havi bontás (12 hónap)",
    "## Kiemelt időablakok",
    "## Szerelem / kapcsolatok az évedben",
    "## Munka / pénz / döntések az évedben",
    "## Mire figyelj a következő 12 hónapban",
    "## Záró üzenet",
    "A havi bontásban legyen 12 rövid alpont, hónapnévvel.",
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
    "ROXY ÉVES FORRÁS (nyers JSON, angol — yearly-horoscope vagy forecast/timeline 365 napra):",
    JSON.stringify(yearly).slice(0, 24_000),
    "",
    "Add vissza a magyar riportot Markdown formában. Ne tegyél hozzá címet a riport elejére — én adok hozzá külön címet.",
  ].join("\n");

  const ai = await aiJSON<{ markdown: string }>({
    system,
    user,
    schemaName: "personal_yearly_report",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["markdown"],
      properties: { markdown: { type: "string" } },
    },
    readingType: "personal_yearly",
    timeoutMs: 120_000,
  });

  const aiMarkdown = ai.ok && ai.data?.markdown ? ai.data.markdown : "";
  const reportMd = requireUsablePaidAstrologyReport(aiMarkdown, {
    productSlug: "personal_yearly",
    minChars: 1800,
    requiredHeadings: [
      "## Az éved fő motívuma",
      "## Születési képleted röviden",
      "## Havi bontás (12 hónap)",
      "## Záró üzenet",
    ],
  });

  const greeting = input.name?.trim() ? `${input.name.trim()}, ` : "";
  const title = `Személyes éves horoszkópod`;
  const body = [
    `# ${title}`,
    "",
    `${greeting}ez az éves riport a saját születési képletedre épül, és a következő 12 hónapra (${startDate} → ${endDate}) szól.`,
    `Életterület fókusz: **${areaLabel}**.`,
    "",
    reportMd,
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
      yearly_available: Boolean(yearly),
      ai_model: ai.meta?.model ?? null,
      ai_fallback: Boolean(ai.meta?.fallbackUsed),
      report_quality_fallback: false,
    },
  };
}

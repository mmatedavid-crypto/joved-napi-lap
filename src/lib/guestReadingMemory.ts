import { deleteCookie, loadLocal, saveCookie, saveLocal } from "./storage";

export type GuestReadingType =
  | "tarot"
  | "love"
  | "decision"
  | "compatibility"
  | "dream"
  | "numerology"
  | "horoscope"
  | "angel"
  | "crystal"
  | "paid"
  | string;

export type GuestReadingMemory = {
  id: string;
  readingType: GuestReadingType;
  topic?: string;
  question?: string;
  situation?: string;
  sourceRoute?: string;
  title?: string;
  summary: string;
  oneSentence?: string;
  anchors: string[];
  createdAt: string;
};

export type GuestReadingContext = {
  memories: GuestReadingMemory[];
  contextText: string;
  themeSummary: string;
  insightText: string;
  insights: GuestReadingInsights;
  distinctCompatibilityCount: number;
};

export type GuestReadingInsights = {
  weeklySummary: string;
  monthlySummary: string;
  recurringQuestion: string;
  changeSinceLast: string;
  gentleNudge: string;
};

const KEY = "guest_reading_memory";
const COOKIE_TOTAL_KEY = "guest_reading_memory_count";
const COOKIE_LAST_TYPE_KEY = "guest_reading_memory_last_type";
const COMPATIBILITY_KEY = "compatibility_checks";
const COMPATIBILITY_COUNT_KEY = "compatibility_distinct_30d";
const COMPATIBILITY_STATUS_KEY = "compatibility_last_status";
const MAX_ITEMS = 36;
const RETENTION_DAYS = 180;

const TYPE_LABELS: Record<string, string> = {
  tarot: "tarot",
  love: "kapcsolati kérdések",
  decision: "döntések",
  compatibility: "összeillés",
  dream: "álmok",
  numerology: "számmisztika",
  horoscope: "horoszkóp",
  angel: "angyalszámok",
  crystal: "kristályok",
  paid: "mélyebb olvasatok",
};

function cleanText(value: string | undefined, max: number): string | undefined {
  const clean = value?.replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : undefined;
}

function cleanAnchors(values: (string | undefined)[] | undefined): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => cleanText(value, 80))
        .filter((value): value is string => Boolean(value && value.length > 1)),
    ),
  ).slice(0, 12);
}

function readAll(): GuestReadingMemory[] {
  const rows = loadLocal<GuestReadingMemory[]>(KEY) ?? [];
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  return rows
    .filter((row) => row?.summary && row?.createdAt)
    .filter((row) => new Date(row.createdAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ITEMS);
}

function countValues(values: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const clean = value.trim();
    if (clean.length > 1) counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function topAnchors(memories: GuestReadingMemory[], limit = 4): string[] {
  return countValues(memories.flatMap((memory) => memory.anchors ?? []))
    .slice(0, limit)
    .map(([anchor]) => anchor);
}

function memoriesSince(memories: GuestReadingMemory[], days: number): GuestReadingMemory[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return memories.filter((memory) => new Date(memory.createdAt).getTime() >= cutoff);
}

function topicMatches(memory: GuestReadingMemory, topic?: string, situation?: string): boolean {
  const needle = `${topic ?? ""} ${situation ?? ""}`.toLocaleLowerCase("hu-HU");
  if (!needle.trim()) return true;
  const haystack = [
    memory.topic,
    memory.question,
    memory.situation,
    memory.title,
    memory.summary,
    ...memory.anchors,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("hu-HU");
  return needle
    .split(/\s+/)
    .filter((part) => part.length > 3)
    .some((part) => haystack.includes(part));
}

function periodLine(memories: GuestReadingMemory[], days: number, label: string): string {
  const rows = memoriesSince(memories, days);
  if (!rows.length) return `${label}: még alakul.`;
  const type = countValues(rows.map((row) => row.readingType))[0]?.[0];
  const themes = topAnchors(rows, 3);
  const typeLabel = type ? (TYPE_LABELS[type] ?? type) : "önismereti kérdések";
  return themes.length
    ? `${label}: ${rows.length} olvasat, fő témák: ${themes.join(", ")}.`
    : `${label}: ${rows.length} olvasat, leginkább ${typeLabel} felől keresel irányt.`;
}

function sharedAnchors(a: GuestReadingMemory, b: GuestReadingMemory): string[] {
  const bAnchors = new Set(b.anchors ?? []);
  return (a.anchors ?? []).filter((anchor) => bAnchors.has(anchor));
}

function distinctCompatibilityTopics(memories: GuestReadingMemory[], days?: number): number {
  const rows = days ? memoriesSince(memories, days) : memories;
  return new Set(
    rows
      .filter((memory) => memory.readingType === "compatibility")
      .map((memory) => memory.topic || memory.situation || memory.title)
      .filter(Boolean),
  ).size;
}

function buildRecurringQuestion(memories: GuestReadingMemory[]): string {
  if (memories.length < 2) {
    return "Még alakul, milyen kérdéshez térsz vissza. Néhány olvasat után pontosabban kirajzolódik az ív.";
  }
  const themes = topAnchors(memories, 3);
  if (themes.length) {
    return `Újra és újra ezek körül keresel tisztább választ: ${themes.join(", ")}.`;
  }
  const type = countValues(memories.map((memory) => memory.readingType))[0]?.[0];
  const typeLabel = type ? (TYPE_LABELS[type] ?? type) : "önismereti kérdések";
  return `Most főleg a ${typeLabel} felől térsz vissza ugyanahhoz a belső kérdéshez.`;
}

function buildChangeSinceLast(memories: GuestReadingMemory[]): string {
  const latest = memories[0];
  const previous = memories[1];
  if (!latest || !previous) {
    return "A múltkorihoz képesti változás akkor lesz láthatóbb, ha lesz mihez visszamérni a mai kérdésedet.";
  }
  const overlap = sharedAnchors(latest, previous);
  if (latest.readingType === previous.readingType && overlap.length) {
    return `A múltkori motívum még visszajön, de most pontosabb kérdésként: ${overlap.slice(0, 2).join(", ")}.`;
  }
  if (latest.readingType === previous.readingType) {
    return "Ugyanahhoz a területhez tértél vissza, de most más oldalról nézed. Ez már nem teljesen ugyanaz a kérdés.";
  }
  if (overlap.length) {
    return `Más témában kérdezel, mégis visszatér egy közös motívum: ${overlap.slice(0, 2).join(", ")}.`;
  }
  return "A fókuszod elmozdult: most más rétegből keresel választ, mint legutóbb.";
}

function buildGentleNudge(memories: GuestReadingMemory[]): string {
  const compatibilityCount = distinctCompatibilityTopics(memories, 30);
  if (compatibilityCount >= 3) {
    return "Több emberrel is megnézted az összeillést. Finoman figyeld, milyen érzést, biztonságot vagy hiányt keresel újra több kapcsolatban.";
  }
  const decisionCount = memoriesSince(
    memories.filter((memory) => memory.readingType === "decision"),
    30,
  ).length;
  if (decisionCount >= 3) {
    return "Több döntési kérdés után nem csak a választás számít, hanem az is, melyik irány mellett érzed magad kevésbé szétszórtnak.";
  }
  const themes = topAnchors(memoriesSince(memories, 30), 2);
  if (themes.length) {
    return `A következő olvasatnál érdemes lehet észrevenned, hogy a ${themes.join(" és ")} mögött ugyanaz a belső igény áll-e.`;
  }
  return "A mintázatod még finoman rajzolódik ki; nem kell siettetni.";
}

function buildGuestInsights(memories: GuestReadingMemory[]): GuestReadingInsights {
  return {
    weeklySummary: periodLine(memories, 7, "Heti minta").replace(/^Heti minta: /, ""),
    monthlySummary: periodLine(memories, 30, "Havi ív").replace(/^Havi ív: /, ""),
    recurringQuestion: buildRecurringQuestion(memories),
    changeSinceLast: buildChangeSinceLast(memories),
    gentleNudge: buildGentleNudge(memories),
  };
}

function buildInsightText(memories: GuestReadingMemory[], insights: GuestReadingInsights): string {
  if (!memories.length) return "";
  const lines = [
    `Heti minta: ${insights.weeklySummary}`,
    `Havi ív: ${insights.monthlySummary}`,
    `Miben kérdezel újra: ${insights.recurringQuestion}`,
    `Múltkorihoz képest: ${insights.changeSinceLast}`,
  ];
  const themes = topAnchors(memories, 3);
  if (themes.length) {
    lines.push(`Visszatérő motívumok: ${themes.join(", ")}.`);
  }
  lines.push(`Finom irány: ${insights.gentleNudge}`);
  return lines.join("\n");
}

function buildContextText(memories: GuestReadingMemory[], insightText: string): string {
  if (!memories.length) return "";
  const rows = memories.slice(0, 5).map((memory) => {
    const when = new Date(memory.createdAt).toLocaleDateString("hu-HU");
    const label = memory.topic || memory.situation || TYPE_LABELS[memory.readingType] || "olvasat";
    return `${when}: ${label} — ${memory.oneSentence || memory.summary}`;
  });
  return [
    "Korábbi vendég olvasati minták ebből a böngészőből. Finoman használd, ne nevezd memóriának vagy adatbázisnak:",
    insightText,
    ...rows,
  ]
    .filter(Boolean)
    .join("\n");
}

export function recordGuestReadingMemory(input: {
  readingType: GuestReadingType;
  topic?: string;
  question?: string;
  situation?: string;
  sourceRoute?: string;
  title?: string;
  summary: string;
  oneSentence?: string;
  anchors?: (string | undefined)[];
}) {
  const summary = cleanText(input.summary, 700);
  if (!summary) return;
  const next: GuestReadingMemory = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    readingType: input.readingType,
    topic: cleanText(input.topic, 120),
    question: cleanText(input.question, 500),
    situation: cleanText(input.situation, 160),
    sourceRoute: cleanText(input.sourceRoute, 120),
    title: cleanText(input.title, 180),
    summary,
    oneSentence: cleanText(input.oneSentence, 500),
    anchors: cleanAnchors(input.anchors),
    createdAt: new Date().toISOString(),
  };
  const rows = [next, ...readAll()].slice(0, MAX_ITEMS);
  saveLocal(KEY, rows);
  saveCookie(COOKIE_TOTAL_KEY, String(rows.length), 180);
  saveCookie(COOKIE_LAST_TYPE_KEY, input.readingType, 180);
  if (input.readingType === "compatibility") {
    const count = distinctCompatibilityTopics(rows, 30);
    saveLocal(
      COMPATIBILITY_KEY,
      rows.filter((row) => row.readingType === "compatibility"),
    );
    saveCookie(COMPATIBILITY_COUNT_KEY, String(count), 30);
    if (input.situation) saveCookie(COMPATIBILITY_STATUS_KEY, input.situation, 30);
  }
}

export function getGuestReadingContext(
  input: {
    readingType?: GuestReadingType;
    topic?: string;
    situation?: string;
    limit?: number;
  } = {},
): GuestReadingContext {
  const all = readAll();
  const scoped = all
    .filter((memory) => !input.readingType || memory.readingType === input.readingType)
    .filter((memory) => topicMatches(memory, input.topic, input.situation))
    .slice(0, input.limit ?? 8);
  const insightSource = scoped.length ? scoped : all.slice(0, input.limit ?? 8);
  const insights = buildGuestInsights(insightSource);
  const insightText = buildInsightText(insightSource, insights);
  const themeSummary = topAnchors(scoped.length ? scoped : all, 4).length
    ? `Visszatérő vendég témák: ${topAnchors(scoped.length ? scoped : all, 4).join(", ")}.`
    : "";
  const distinctCompatibilityCount = distinctCompatibilityTopics(all, 30);
  return {
    memories: scoped,
    contextText: buildContextText(scoped, insightText),
    themeSummary,
    insightText,
    insights,
    distinctCompatibilityCount,
  };
}

export function clearGuestPersonalization() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(`jovod:${KEY}`);
      window.localStorage.removeItem(`jovod:${COMPATIBILITY_KEY}`);
    } catch {
      /* ignore */
    }
  }
  deleteCookie(COOKIE_TOTAL_KEY);
  deleteCookie(COOKIE_LAST_TYPE_KEY);
  deleteCookie(COMPATIBILITY_COUNT_KEY);
  deleteCookie(COMPATIBILITY_STATUS_KEY);
}

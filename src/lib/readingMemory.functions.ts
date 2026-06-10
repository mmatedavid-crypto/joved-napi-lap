import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ReadingType = z
  .enum([
    "tarot",
    "love",
    "decision",
    "compatibility",
    "dream",
    "numerology",
    "horoscope",
    "angel",
    "crystal",
    "paid",
  ])
  .or(z.string().min(1).max(40));

const SaveMemoryInput = z.object({
  readingType: ReadingType,
  topic: z.string().max(120).optional(),
  question: z.string().max(500).optional(),
  situation: z.string().max(160).optional(),
  sourceRoute: z.string().max(120).optional(),
  title: z.string().max(180).optional(),
  summary: z.string().min(8).max(900),
  oneSentence: z.string().max(500).optional(),
  anchors: z.array(z.string().min(1).max(80)).max(12).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const ImportGuestMemoryInput = z.object({
  memories: z
    .array(
      z.object({
        readingType: ReadingType,
        topic: z.string().max(120).optional(),
        question: z.string().max(500).optional(),
        situation: z.string().max(160).optional(),
        sourceRoute: z.string().max(120).optional(),
        title: z.string().max(180).optional(),
        summary: z.string().min(8).max(900),
        oneSentence: z.string().max(500).optional(),
        anchors: z.array(z.string().min(1).max(80)).max(12).optional(),
        createdAt: z.string().max(40).optional(),
      }),
    )
    .max(20),
});

const ContextInput = z.object({
  readingType: ReadingType.optional(),
  topic: z.string().max(120).optional(),
  situation: z.string().max(160).optional(),
  limit: z.number().int().min(1).max(12).optional(),
});

export type ReadingMemory = {
  id: string;
  reading_type: string;
  topic: string | null;
  question: string | null;
  situation: string | null;
  source_route: string | null;
  title: string | null;
  summary: string;
  one_sentence: string | null;
  anchors: string[];
  created_at: string;
};

export type ReadingMemoryInsights = {
  weeklySummary: string;
  monthlySummary: string;
  recurringQuestion: string;
  changeSinceLast: string;
  gentleNudge: string;
};

const READING_TYPE_LABELS: Record<string, string> = {
  tarot: "kártyák",
  love: "kapcsolati kérdések",
  decision: "döntési helyzetek",
  compatibility: "összeillés",
  dream: "álmok",
  numerology: "számmisztika",
  horoscope: "horoszkóp",
  angel: "angyalszámok",
  crystal: "kristályok",
  paid: "mélyebb olvasatok",
};

function cleanAnchors(values: string[] | undefined): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 1)
        .slice(0, 12),
    ),
  );
}

function topicMatches(memory: ReadingMemory, input: z.infer<typeof ContextInput>): boolean {
  const needle = `${input.topic ?? ""} ${input.situation ?? ""}`.toLocaleLowerCase("hu-HU");
  if (!needle.trim()) return true;
  const haystack = [
    memory.topic,
    memory.question,
    memory.situation,
    memory.title,
    memory.summary,
    ...(memory.anchors ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("hu-HU");
  return needle
    .split(/\s+/)
    .filter((part) => part.length > 3)
    .some((part) => haystack.includes(part));
}

function buildContextText(memories: ReadingMemory[]): string {
  if (!memories.length) return "";
  const lines = memories.slice(0, 5).map((memory) => {
    const when = new Date(memory.created_at).toLocaleDateString("hu-HU");
    const label = memory.topic || memory.situation || memory.reading_type;
    return `${when}: ${label} — ${memory.one_sentence || memory.summary}`;
  });
  return ["Korábbi olvasati minták, finoman használd, ne emlegesd adatbázisként:", ...lines].join(
    "\n",
  );
}

function countValues(values: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value.trim();
    if (normalized.length > 1) counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function topAnchors(memories: ReadingMemory[], limit = 4): string[] {
  return countValues(memories.flatMap((memory) => memory.anchors ?? []))
    .slice(0, limit)
    .map(([anchor]) => anchor);
}

function buildThemeSummary(memories: ReadingMemory[]): string {
  const themes = topAnchors(memories);
  if (!themes.length) return "";
  return `Visszatérő témák nálad: ${themes.join(", ")}.`;
}

function formatTypeLabel(readingType: string): string {
  return READING_TYPE_LABELS[readingType] ?? readingType;
}

function memoriesSince(memories: ReadingMemory[], days: number): ReadingMemory[] {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return memories.filter((memory) => new Date(memory.created_at).getTime() >= since);
}

function buildPeriodSummary(memories: ReadingMemory[], days: number, emptyText: string): string {
  const periodMemories = memoriesSince(memories, days);
  if (!periodMemories.length) return emptyText;
  const types = countValues(periodMemories.map((memory) => memory.reading_type));
  const themes = topAnchors(periodMemories, 3);
  const mainType = types[0]?.[0] ? formatTypeLabel(types[0][0]) : "önismereti kérdések";
  if (!themes.length) {
    return `${periodMemories.length} olvasat alapján most leginkább a ${mainType} felől keresel irányt.`;
  }
  return `${periodMemories.length} olvasat alapján most leginkább a ${mainType} és ezek a motívumok térnek vissza: ${themes.join(", ")}.`;
}

function sharedAnchors(a: ReadingMemory, b: ReadingMemory): string[] {
  const bAnchors = new Set(b.anchors ?? []);
  return (a.anchors ?? []).filter((anchor) => bAnchors.has(anchor));
}

function buildRecurringQuestion(memories: ReadingMemory[]): string {
  if (memories.length < 2) {
    return "Még alakul, milyen kérdésekhez térsz vissza. Néhány olvasat után pontosabban kirajzolódik az ív.";
  }
  const types = countValues(memories.map((memory) => memory.reading_type));
  const themes = topAnchors(memories, 3);
  const mainType = types[0]?.[0] ? formatTypeLabel(types[0][0]) : "önismereti irány";
  if (themes.length) {
    return `Úgy tűnik, újra és újra azt nézed, hol tudsz nagyobb biztonságot vagy tisztább választ találni: ${themes.join(", ")}.`;
  }
  return `Most főleg a ${mainType} körül keresel visszatérő választ.`;
}

function buildChangeSinceLast(memories: ReadingMemory[]): string {
  const latest = memories[0];
  const previous = memories[1];
  if (!latest || !previous) {
    return "A változás iránya akkor lesz láthatóbb, ha lesz mihez visszamérni a mai kérdésedet.";
  }
  const overlaps = sharedAnchors(latest, previous);
  if (latest.reading_type === previous.reading_type && overlaps.length) {
    return `A múltkori témád még nem tűnt el, inkább pontosodik: ${overlaps.slice(0, 2).join(", ")}.`;
  }
  if (latest.reading_type === previous.reading_type) {
    return `Ugyanahhoz a területhez tértél vissza, de most más oldalról nézed. Ez már nem ugyanaz a kérdés, mint legutóbb.`;
  }
  if (overlaps.length) {
    return `Más formában kérdezel, de egy közös motívum visszajött: ${overlaps.slice(0, 2).join(", ")}.`;
  }
  return "A fókuszod elmozdult: most nem ugyanarra keresel választ, mint legutóbb.";
}

function buildGentleNudge(memories: ReadingMemory[]): string {
  const recentCompatibility = memoriesSince(
    memories.filter((memory) => memory.reading_type === "compatibility"),
    30,
  );
  const compatibilityPartners = new Set(
    recentCompatibility.map((memory) => memory.topic || memory.situation || memory.title),
  );
  if (compatibilityPartners.size >= 3) {
    return "Most érdemes lehet nem csak azt nézni, kivel mennyi az összeillés, hanem azt is, milyen érzést keresel újra több emberben.";
  }
  const recentDecisionCount = memoriesSince(
    memories.filter((memory) => memory.reading_type === "decision"),
    30,
  ).length;
  if (recentDecisionCount >= 3) {
    return "Több döntési kérdés után a lényeg gyakran nem az azonnali válasz, hanem az, melyik választás mellett leszel önazonosabb.";
  }
  const themes = topAnchors(memoriesSince(memories, 30), 2);
  if (themes.length) {
    return `A következő olvasatnál figyeld meg, hogy a ${themes.join(" és ")} mögött ugyanaz a belső igény áll-e.`;
  }
  return "A mintázatod most még finoman rajzolódik ki; nem kell siettetni.";
}

function buildMemoryInsights(memories: ReadingMemory[]): ReadingMemoryInsights {
  return {
    weeklySummary: buildPeriodSummary(
      memories,
      7,
      "Az elmúlt hétből még nincs elég olvasat ahhoz, hogy heti mintát mutassunk.",
    ),
    monthlySummary: buildPeriodSummary(
      memories,
      30,
      "Az elmúlt hónapból még nincs elég olvasat ahhoz, hogy havi ívet mutassunk.",
    ),
    recurringQuestion: buildRecurringQuestion(memories),
    changeSinceLast: buildChangeSinceLast(memories),
    gentleNudge: buildGentleNudge(memories),
  };
}

function buildContextTextWithInsights(
  memories: ReadingMemory[],
  insights: ReadingMemoryInsights,
): string {
  const base = buildContextText(memories);
  if (!base) return "";
  return [
    base,
    "",
    "Felhasználói ív, nagyon finoman használd:",
    `Heti minta: ${insights.weeklySummary}`,
    `Havi minta: ${insights.monthlySummary}`,
    `Visszatérő kérdés: ${insights.recurringQuestion}`,
    `Elmozdulás: ${insights.changeSinceLast}`,
  ].join("\n");
}

export const saveReadingMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(SaveMemoryInput.parse)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("reading_memories").insert({
      user_id: context.userId,
      reading_type: data.readingType,
      topic: data.topic ?? null,
      question: data.question ?? null,
      situation: data.situation ?? null,
      source_route: data.sourceRoute ?? null,
      title: data.title ?? null,
      summary: data.summary,
      one_sentence: data.oneSentence ?? null,
      anchors: cleanAnchors(data.anchors),
      metadata: (data.metadata ?? {}) as never,
    });
    if (error) throw error;
    return { ok: true };
  });

export const importGuestReadingMemories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ImportGuestMemoryInput.parse)
  .handler(async ({ context, data }) => {
    const memories = data.memories.slice(0, 20);
    if (!memories.length) return { ok: true, imported: 0 };
    const { error } = await context.supabase.from("reading_memories").insert(
      memories.map((memory) => ({
        user_id: context.userId,
        reading_type: memory.readingType,
        topic: memory.topic ?? null,
        question: memory.question ?? null,
        situation: memory.situation ?? null,
        source_route: memory.sourceRoute ?? null,
        title: memory.title ?? null,
        summary: memory.summary,
        one_sentence: memory.oneSentence ?? null,
        anchors: cleanAnchors(memory.anchors),
        metadata: {
          imported_from_guest_browser: true,
          guest_created_at: memory.createdAt ?? null,
        } as never,
      })),
    );
    if (error) throw error;
    return { ok: true, imported: memories.length };
  });

export const getReadingContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ContextInput.parse)
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("reading_memories")
      .select(
        "id, reading_type, topic, question, situation, source_route, title, summary, one_sentence, anchors, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(Math.max((data.limit ?? 8) * 2, 8));

    if (data.readingType) query = query.eq("reading_type", data.readingType);

    const { data: rows, error } = await query;
    if (error) throw error;
    const memories = ((rows ?? []) as ReadingMemory[])
      .filter((memory) => topicMatches(memory, data))
      .slice(0, data.limit ?? 8);
    const insights = buildMemoryInsights(memories);
    return {
      ok: true,
      memories,
      contextText: buildContextTextWithInsights(memories, insights),
      themeSummary: buildThemeSummary(memories),
      insights,
    };
  });

export const getMyReadingMemoryOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reading_memories")
      .select(
        "id, reading_type, topic, question, situation, source_route, title, summary, one_sentence, anchors, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    const memories = (data ?? []) as ReadingMemory[];
    const insights = buildMemoryInsights(memories);
    return {
      ok: true,
      memories,
      themeSummary: buildThemeSummary(memories),
      insights,
    };
  });

export const clearMyReadingMemories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("reading_memories")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

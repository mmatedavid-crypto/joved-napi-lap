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

function buildThemeSummary(memories: ReadingMemory[]): string {
  const anchors = memories.flatMap((memory) => memory.anchors ?? []);
  const counts = new Map<string, number>();
  for (const anchor of anchors) counts.set(anchor, (counts.get(anchor) ?? 0) + 1);
  const themes = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([anchor]) => anchor);
  if (!themes.length) return "";
  return `Visszatérő témák nálad: ${themes.join(", ")}.`;
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
    return {
      ok: true,
      memories,
      contextText: buildContextText(memories),
      themeSummary: buildThemeSummary(memories),
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
    return {
      ok: true,
      memories,
      themeSummary: buildThemeSummary(memories),
    };
  });

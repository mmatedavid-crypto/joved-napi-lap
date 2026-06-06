// Server functions that proxy Roxy. The browser only ever sees these RPCs —
// ROXY_API_KEY stays on the server (see src/lib/roxy.server.ts).
//
// Each function returns a uniform envelope:
//   { ok, data, providerCode?, message?, fallbackUsed, cached }
// so the UI can fall back to local Jövőd content if Roxy is unavailable.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Serializable JSON envelope — server fns must return a JSON-safe shape.
type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JsonValue }
  | JsonValue[];

export type RoxyEnvelope = {
  ok: boolean;
  data: JsonValue | null;
  cached: boolean;
  fallbackUsed: boolean;
  providerCode?: string;
  message?: string;
};

const FAIL_MESSAGE =
  "Most nem sikerült lekérni a háttértudást. Próbáld újra később.";

async function runRoxy(opts: {
  endpoint: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  cacheKey: string;
  ttlSeconds: number | null;
}): Promise<RoxyEnvelope> {
  const { callRoxy } = await import("./roxy.server");
  const r = await callRoxy<JsonValue>(opts);
  if (!r.ok) {
    return {
      ok: false,
      data: null,
      cached: false,
      fallbackUsed: true,
      providerCode: r.providerCode,
      message: FAIL_MESSAGE,
    };
  }
  return { ok: true, data: r.data ?? null, cached: r.cached, fallbackUsed: false };
}

// ─── Tarot ────────────────────────────────────────────────────────────────

const DrawSchema = z.object({
  count: z.number().int().min(1).max(10),
  seed: z.string().min(1).max(64),
  allowReversals: z.boolean().default(false),
});

export const roxyTarotDaily = createServerFn({ method: "POST" })
  .inputValidator(z.object({ dateKey: z.string().min(8).max(20) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/tarot/daily",
      cacheKey: `tarot:daily:${data.dateKey}`,
      ttlSeconds: 60 * 60 * 24,
    }),
  );

export const roxyTarotDraw = createServerFn({ method: "POST" })
  .inputValidator(DrawSchema.parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/tarot/draw",
      body: {
        count: data.count,
        seed: data.seed,
        allowReversals: data.allowReversals,
        allowDuplicates: false,
      },
      cacheKey: `tarot:draw:${data.count}:${data.seed}:${data.allowReversals ? 1 : 0}`,
      ttlSeconds: 60 * 60 * 24 * 7,
    }),
  );

export const roxyTarotThreeCard = createServerFn({ method: "POST" })
  .inputValidator(z.object({ seed: z.string().min(1).max(64) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/tarot/spreads/three-card",
      body: { seed: data.seed },
      cacheKey: `tarot:three:${data.seed}`,
      ttlSeconds: 60 * 60 * 24 * 7,
    }),
  );

export const roxyTarotLove = createServerFn({ method: "POST" })
  .inputValidator(z.object({ seed: z.string().min(1).max(64) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/tarot/spreads/love",
      body: { seed: data.seed },
      cacheKey: `tarot:love:${data.seed}`,
      ttlSeconds: 60 * 60 * 24 * 7,
    }),
  );

export const roxyTarotCards = createServerFn({ method: "GET" })
  .handler(async () =>
    runRoxy({
      endpoint: "/tarot/cards",
      method: "GET",
      cacheKey: "tarot:cards:all",
      ttlSeconds: 60 * 60 * 24 * 30,
    }),
  );

export const roxyTarotCardById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/) }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: `/tarot/cards/${encodeURIComponent(data.id)}`,
      method: "GET",
      cacheKey: `tarot:card:${data.id}`,
      ttlSeconds: 60 * 60 * 24 * 30,
    }),
  );

// ─── Numerology ───────────────────────────────────────────────────────────

const BirthDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
const NameSchema = z.string().min(1).max(120);

export const roxyNumerologyLifePath = createServerFn({ method: "POST" })
  .inputValidator(z.object({ birthDate: BirthDateSchema }).parse)
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/numerology/life-path",
      body: { birth_date: data.birthDate, birthDate: data.birthDate },
      cacheKey: `num:lifepath:${data.birthDate}`,
      ttlSeconds: 60 * 60 * 24 * 365,
    }),
  );

export const roxyNumerologyChart = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate: BirthDateSchema,
      fullName: NameSchema.optional(),
    }).parse,
  )
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/numerology/chart",
      body: {
        birth_date: data.birthDate,
        birthDate: data.birthDate,
        full_name: data.fullName,
        fullName: data.fullName,
      },
      cacheKey: `num:chart:${data.birthDate}:${(data.fullName ?? "").toLowerCase().trim()}`,
      ttlSeconds: 60 * 60 * 24 * 365,
    }),
  );

export const roxyNumerologyCompatibility = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate1: BirthDateSchema,
      birthDate2: BirthDateSchema,
      fullName1: NameSchema.optional(),
      fullName2: NameSchema.optional(),
    }).parse,
  )
  .handler(async ({ data }) =>
    runRoxy({
      endpoint: "/numerology/compatibility",
      body: {
        person1: { birth_date: data.birthDate1, full_name: data.fullName1 },
        person2: { birth_date: data.birthDate2, full_name: data.fullName2 },
        birth_date_1: data.birthDate1,
        birth_date_2: data.birthDate2,
      },
      cacheKey: `num:compat:${data.birthDate1}:${data.birthDate2}:${(data.fullName1 ?? "").toLowerCase().trim()}:${(data.fullName2 ?? "").toLowerCase().trim()}`,
      ttlSeconds: 60 * 60 * 24 * 90,
    }),
  );

export const roxyNumerologyPersonalYear = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      birthDate: BirthDateSchema,
      year: z.number().int().min(1900).max(2100).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    const year = data.year ?? new Date().getFullYear();
    return runRoxy({
      endpoint: "/numerology/personal-year",
      body: { birth_date: data.birthDate, year },
      cacheKey: `num:pyear:${data.birthDate}:${year}`,
      ttlSeconds: 60 * 60 * 24 * 30,
    });
  });
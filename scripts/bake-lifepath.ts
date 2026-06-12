// One-off script: fetch life-path interpretations from Roxy for representative
// birth dates, translate to Hungarian via Lovable AI, and write
// src/data/lifePathMeanings.hu.ts.
//
// Run: bun run scripts/bake-lifepath.ts
//
// Requires env: ROXY_API_KEY, LOVABLE_API_KEY.

import { writeFileSync } from "node:fs";

const ROXY = "https://roxyapi.com/api/v2";
const ROXY_KEY = process.env.ROXY_API_KEY!;
const LOV_KEY = process.env.LOVABLE_API_KEY!;

// Representative birth dates that reduce to each life path.
const SAMPLES: { n: number; date: { year: number; month: number; day: number } }[] = [
  { n: 1, date: { year: 1990, month: 1, day: 1 } },
  { n: 2, date: { year: 1990, month: 1, day: 2 } },
  { n: 3, date: { year: 1990, month: 1, day: 3 } },
  { n: 4, date: { year: 1990, month: 1, day: 4 } },
  { n: 5, date: { year: 1990, month: 1, day: 5 } },
  { n: 6, date: { year: 1990, month: 1, day: 6 } },
  { n: 7, date: { year: 1990, month: 1, day: 7 } },
  { n: 8, date: { year: 1990, month: 1, day: 8 } },
  { n: 9, date: { year: 1990, month: 1, day: 9 } },
  { n: 11, date: { year: 1991, month: 1, day: 8 } }, // 1+9+9+1+1+8=29 -> 11
  { n: 22, date: { year: 1993, month: 8, day: 1 } }, // 1+9+9+3+8+1=31 -> 4? recompute
  { n: 33, date: { year: 1980, month: 12, day: 25 } }, // tune below
];

function reduce(n: number, keepMaster = true): number {
  while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33))) {
    n = String(n)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

// Roxy uses per-component reduction: reduce(year) + reduce(month) + reduce(day),
// keeping master numbers (11, 22, 33) at each step and in the final sum.
function roxyLifePath(y: number, m: number, d: number): number {
  const ry = reduce(y);
  const rm = reduce(m);
  const rd = reduce(d);
  return reduce(ry + rm + rd);
}

function findDate(target: number): { year: number; month: number; day: number } {
  for (let y = 1970; y <= 2005; y++)
    for (let m = 1; m <= 12; m++)
      for (let d = 1; d <= 28; d++) {
        if (roxyLifePath(y, m, d) === target) return { year: y, month: m, day: d };
      }
  throw new Error(`no date for ${target}`);
}

async function callRoxy(date: { year: number; month: number; day: number }) {
  const res = await fetch(`${ROXY}/numerology/life-path`, {
    method: "POST",
    headers: {
      "X-API-Key": ROXY_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(date),
  });
  if (!res.ok) throw new Error(`Roxy ${res.status}: ${await res.text()}`);
  return res.json();
}

async function translateAndStructure(n: number, raw: unknown) {
  const prompt = `Az alábbi angol numerológiai életút (Life Path ${n}) leírást alakítsd át magyar nyelvű, önismereti hangvételű tartalommá. NE jósolj, NE ígérj. Egyetlen JSON objektumot adj vissza pontosan ezekkel a kulcsokkal:
{
  "title": "Sorsszám ${n} jelentése — rövid alcím",
  "lead": "1-2 mondatos bevezető magyarul",
  "essence": "3-4 mondat a szám alaprezgéséről",
  "strengths": "3-4 mondat az erősségekről",
  "shadow": "3-4 mondat az árnyékoldalról / kihívásokról",
  "love": "2-3 mondat a szerelmi/párkapcsolati mintáról",
  "career": "2-3 mondat a munka/hivatás területéről",
  "advice": "2-3 mondat önismereti tanács, ne parancsolj"
}
CSAK a JSON-t add vissza, magyarázat nélkül.

Forrás (angol):
${JSON.stringify(raw).slice(0, 4000)}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOV_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  let content = json.choices[0].message.content.trim();
  // strip markdown fences if any
  content = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse AI output (first 500 chars):", content.slice(0, 500));
    console.error("Last 200 chars:", content.slice(-200));
    throw e;
  }
}

function extractLifePath(raw: unknown): number | null {
  // Roxy returns { life_path: { number, ... } } or { lifePath: N } etc.
  const r = raw as Record<string, unknown>;
  const candidates: unknown[] = [
    (r?.life_path as Record<string, unknown>)?.number,
    r?.lifePath,
    r?.life_path,
    r?.number,
    (r?.data as Record<string, unknown>)?.life_path,
    (r?.data as Record<string, unknown>)?.lifePath,
    ((r?.data as Record<string, unknown>)?.life_path as Record<string, unknown>)?.number,
  ];
  for (const c of candidates) {
    const n = typeof c === "number" ? c : typeof c === "string" ? Number(c) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

const TARGETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

async function main() {
  const out: Record<string, unknown> = {};
  const need = new Set(TARGETS);

  // Probe many dates; for each, ask Roxy what LP it computes, keep the first
  // sample we see for each target life path number.
  outer: for (let y = 1970; y <= 2005 && need.size > 0; y++) {
    for (let m = 1; m <= 12 && need.size > 0; m++) {
      for (let d = 1; d <= 28 && need.size > 0; d += 3) {
        const date = { year: y, month: m, day: d };
        let raw: unknown;
        try {
          raw = await callRoxy(date);
        } catch (e) {
          console.error("Roxy call failed", e);
          continue;
        }
        const lp = extractLifePath(raw);
        if (lp == null) {
          console.error("Could not parse LP from response:", JSON.stringify(raw).slice(0, 300));
          break outer;
        }
        if (need.has(lp)) {
          console.log(`Life path ${lp} — date ${y}-${m}-${d}`);
          const structured = await translateAndStructure(lp, raw);
          out[String(lp)] = structured;
          need.delete(lp);
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }
  }

  if (need.size > 0) {
    console.warn("Missing life paths:", [...need]);
  }

  const body = `// AUTO-GENERATED by scripts/bake-lifepath.ts — do not edit by hand.
// Source: Roxy /numerology/life-path, fordítva magyarra.

export type LifePathMeaning = {
  title: string;
  lead: string;
  essence: string;
  strengths: string;
  shadow: string;
  love: string;
  career: string;
  advice: string;
};

export const LIFE_PATH_MEANINGS_HU: Record<string, LifePathMeaning> = ${JSON.stringify(out, null, 2)};

export const LIFE_PATH_NUMBERS = ${JSON.stringify(SAMPLES.map((s) => s.n))} as const;
`;
  writeFileSync("src/data/lifePathMeanings.hu.ts", body);
  console.log("Wrote src/data/lifePathMeanings.hu.ts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

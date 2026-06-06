import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import {
  roxyDailyHoroscope,
  roxyIchingDailyCast,
  roxyIchingHexagram,
  roxyBiorhythmDaily,
  roxyAngelNumberLookup,
  roxyDreamSymbol,
  roxyCrystalBirthstone,
  roxyCrystalZodiac,
  roxyLocationSearch,
  roxyTarotDraw,
  roxyNumerologyChart,
  roxyNumerologyCompatibility,
} from "@/lib/roxy.functions";
import {
  normalizeRoxyHoroscope,
  normalizeRoxyIching,
  normalizeRoxyBiorhythm,
  normalizeRoxyAngel,
  normalizeRoxyDreamSymbol,
  normalizeRoxyCrystal,
  normalizeRoxyDraw,
  normalizeRoxyChart,
  normalizeRoxyCompat,
} from "@/lib/roxyNormalize";
import { todayKey } from "@/lib/storage";

export const Route = createFileRoute("/dev/roxy")({
  head: () => ({
    meta: [
      { title: "Roxy diagnostics — dev | Jövőd.hu" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Page,
});

type Row = {
  name: string;
  ok?: boolean;
  cached?: boolean;
  fallback?: boolean;
  normalized?: unknown;
  message?: string;
};

function Page() {
  const fns = {
    horoscope: useServerFn(roxyDailyHoroscope),
    ichingCast: useServerFn(roxyIchingDailyCast),
    ichingHex: useServerFn(roxyIchingHexagram),
    biorhythm: useServerFn(roxyBiorhythmDaily),
    angel: useServerFn(roxyAngelNumberLookup),
    dream: useServerFn(roxyDreamSymbol),
    crystalBirth: useServerFn(roxyCrystalBirthstone),
    crystalZodiac: useServerFn(roxyCrystalZodiac),
    location: useServerFn(roxyLocationSearch),
    tarot: useServerFn(roxyTarotDraw),
    chart: useServerFn(roxyNumerologyChart),
    compat: useServerFn(roxyNumerologyCompatibility),
  };

  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  async function run(
    name: string,
    exec: () => Promise<unknown>,
    normalize: (raw: unknown) => unknown,
  ) {
    const start: Row = { name };
    setRows((r) => [...r, start]);
    try {
      const res = (await exec()) as {
        ok: boolean;
        cached: boolean;
        fallbackUsed: boolean;
        data: unknown;
        message?: string;
      };
      setRows((r) =>
        r.map((x) =>
          x.name === name
            ? {
                name,
                ok: res.ok,
                cached: res.cached,
                fallback: res.fallbackUsed,
                normalized: res.ok ? normalize(res.data) : null,
                message: res.message,
              }
            : x,
        ),
      );
    } catch (e) {
      setRows((r) => r.map((x) => (x.name === name ? { name, ok: false, message: String(e) } : x)));
    }
  }

  async function runAll() {
    setRows([]);
    setRunning(true);
    const dk = todayKey();
    await run(
      "horoscope (aries)",
      () => fns.horoscope({ data: { sign: "aries", dateKey: dk } }),
      normalizeRoxyHoroscope,
    );
    await run(
      "iching daily cast",
      () => fns.ichingCast({ data: { seed: `dev:${dk}` } }),
      normalizeRoxyIching,
    );
    await run(
      "iching hexagram 1",
      () => fns.ichingHex({ data: { number: 1 } }),
      (x) => x,
    );
    await run(
      "biorhythm (1985-06-04)",
      () => fns.biorhythm({ data: { birthDate: "1985-06-04", date: dk } }),
      normalizeRoxyBiorhythm,
    );
    await run("angel 1111", () => fns.angel({ data: { number: "1111" } }), normalizeRoxyAngel);
    await run(
      "dream snake",
      () => fns.dream({ data: { slug: "snake" } }),
      (x) => normalizeRoxyDreamSymbol(x, "snake"),
    );
    await run(
      "crystal birthstone (current month)",
      () => fns.crystalBirth({ data: { month: new Date().getMonth() + 1 } }),
      normalizeRoxyCrystal,
    );
    await run(
      "crystal zodiac aries",
      () => fns.crystalZodiac({ data: { sign: "aries" } }),
      normalizeRoxyCrystal,
    );
    await run(
      "location: Budapest",
      () => fns.location({ data: { q: "Budapest" } }),
      (x) => x,
    );
    await run(
      "tarot draw 3",
      () => fns.tarot({ data: { count: 3, seed: `dev:${dk}`, allowReversals: false } }),
      normalizeRoxyDraw,
    );
    await run(
      "numerology chart",
      () => fns.chart({ data: { birthDate: "1985-06-04", fullName: "Anna Kiss" } }),
      normalizeRoxyChart,
    );
    await run(
      "numerology compatibility",
      () =>
        fns.compat({
          data: {
            birthDate1: "1985-06-04",
            birthDate2: "1990-09-15",
            fullName1: "Anna Kiss",
            fullName2: "Péter Nagy",
          },
        }),
      normalizeRoxyCompat,
    );
    setRunning(false);
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-10 space-y-5">
        <header>
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
            Dev
          </div>
          <h1 className="font-display text-3xl text-ivory">Roxy diagnostics</h1>
          <p className="text-sm text-ivory/60 mt-1 font-editorial">
            Belső próba — nem linkelt oldal. Csak normalizált kimenetet mutatunk.
          </p>
        </header>
        <button className="btn-gold" onClick={runAll} disabled={running}>
          {running ? "Fut…" : "Futtatás"}
        </button>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.name} className="surface p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-ivory">{r.name}</span>
                {r.ok === true && <span className="text-emerald-300/90">ok</span>}
                {r.ok === false && <span className="text-rose-300/90">fail</span>}
                {r.cached && <span className="text-ivory/55">cache hit</span>}
                {r.fallback && <span className="text-amber-300/80">fallback</span>}
              </div>
              {r.message && <p className="text-ivory/60 mt-1">{r.message}</p>}
              {r.normalized !== undefined && (
                <pre className="mt-2 text-xs text-ivory/70 bg-[oklch(0.10_0.03_290/0.6)] p-3 rounded-md overflow-auto max-h-64">
                  {JSON.stringify(r.normalized, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

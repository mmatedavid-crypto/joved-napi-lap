import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { aiMoonPhaseHU, type MoonPhaseHU } from "@/lib/roxyTranslate.functions";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function phaseGlyph(name: string | undefined): string {
  if (!name) return "🌙";
  const v = name.toLowerCase();
  if (v.includes("újhold")) return "🌑";
  if (v.includes("növő holdsarló")) return "🌒";
  if (v.includes("első negyed")) return "🌓";
  if (v.includes("növő hold")) return "🌔";
  if (v.includes("telihold")) return "🌕";
  if (v.includes("fogyó hold") && !v.includes("sarló")) return "🌖";
  if (v.includes("utolsó negyed")) return "🌗";
  if (v.includes("fogyó holdsarló")) return "🌘";
  return "🌙";
}

/**
 * Diszkrét csík a főoldalon: hold-fázis + jegy + egy mondat.
 * Roxy /astrology/moon-phase/current → magyar fordító réteg, 6h cache.
 */
export function MoonPhaseStrip({ variant = "full" }: { variant?: "full" | "header" } = {}) {
  const [reading, setReading] = useState<MoonPhaseHU | null>(null);
  const [loaded, setLoaded] = useState(false);
  const call = useServerFn(aiMoonPhaseHU);

  useEffect(() => {
    let cancelled = false;
    call({ data: { dateKey: todayKey() } })
      .then((r) => {
        if (cancelled) return;
        if (r.ok && r.reading) setReading(r.reading);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [call]);

  if (!loaded || !reading) return null;

  if (variant === "header") {
    return (
      <div
        className="flex items-center gap-2 rounded-full border border-[oklch(0.78_0.10_80/0.18)] bg-[oklch(0.12_0.02_290/0.4)] px-3 py-1 text-xs text-ivory/80"
        title={`${reading.phaseName}${reading.sign ? " · " + reading.sign : ""}${reading.illumination ? " · " + reading.illumination : ""}`}
        aria-label={`Mai hold: ${reading.phaseName}${reading.sign ? ", " + reading.sign : ""}`}
      >
        <span aria-hidden className="text-base leading-none">
          {phaseGlyph(reading.phaseName)}
        </span>
        <span className="hidden sm:inline truncate max-w-[14rem] font-editorial">
          {reading.phaseName}
          {reading.sign ? <span className="text-ivory/55"> · {reading.sign}</span> : null}
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 md:px-6 mt-2">
      <div className="surface flex items-center gap-3 px-4 py-2.5 text-sm">
        <span aria-hidden className="text-xl leading-none">
          {phaseGlyph(reading.phaseName)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-[0.28em] uppercase text-[oklch(0.78_0.10_80/0.75)]">
            Mai hold
            {reading.sign ? <> · {reading.sign}</> : null}
            {reading.illumination ? <> · {reading.illumination}</> : null}
          </div>
          <div className="text-ivory/82 font-editorial truncate">
            <span className="text-ivory">{reading.phaseName}.</span> {reading.oneLine}
          </div>
        </div>
      </div>
    </div>
  );
}
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
export function MoonPhaseStrip() {
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
import { useMemo, useState, useEffect } from "react";
import { CardBack, CardFace } from "./TarotCard";
import { pickCards, type TarotCard } from "@/data/cards";

type Props = {
  count: 1 | 3;
  /** stable seed (e.g. dailySeed) for the spread arrangement */
  seed?: number;
  /** labels shown above the chosen slots (e.g. ["Múlt","Jelen","Jövő"]) */
  slotLabels?: string[];
  onComplete?: (cards: TarotCard[]) => void;
  /** when true, reset the spread (e.g. tab switch) */
  resetKey?: string | number;
};

const SPREAD_SIZE = 22;

export function SpreadDeck({ count, seed, slotLabels, onComplete, resetKey }: Props) {
  // pool of 17 cards arranged in an arc
  const pool = useMemo(
    () => pickCards(SPREAD_SIZE, (seed ?? Date.now()) + Number(resetKey ?? 0) * 13),
    [seed, resetKey],
  );
  const [picked, setPicked] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);

  useEffect(() => { setPicked([]); setRevealed([]); }, [resetKey, seed]);

  function pick(i: number) {
    if (picked.includes(i)) return;
    if (picked.length >= count) return;
    const next = [...picked, i];
    setPicked(next);
    setRevealed((r) => [...r, false]);
  }

  function reveal(slot: number) {
    setRevealed((r) => {
      const copy = [...r];
      copy[slot] = true;
      // fire onComplete when all revealed
      const all = copy.length === count && copy.every(Boolean);
      if (all && onComplete) setTimeout(() => onComplete(picked.map((p) => pool[p])), 500);
      return copy;
    });
  }

  const allPicked = picked.length === count;
  const total = SPREAD_SIZE;
  const arc = 84; // degrees total — wider fan for 22 cards

  return (
    <div className="select-none">
      {/* Chosen slots */}
      {count > 0 && (
        <div
          className={`grid gap-3 mx-auto mb-6 ${
            count === 1 ? "max-w-[180px]" : "grid-cols-3 max-w-md"
          }`}
          style={{ minHeight: count === 1 ? 0 : undefined }}
        >
          {Array.from({ length: count }).map((_, slot) => {
            const idx = picked[slot];
            const card = idx != null ? pool[idx] : null;
            const isRev = revealed[slot];
            return (
              <div key={slot} className="flex flex-col items-center">
                <div className="text-[9px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-2 h-3">
                  {slotLabels?.[slot] ?? ""}
                </div>
                {!card ? (
                  <div className="tarot-card opacity-25 border-dashed w-full max-w-[140px]" />
                ) : isRev ? (
                  <CardFace card={card} className="w-full max-w-[140px] animate-fade-in" />
                ) : (
                  <button
                    type="button"
                    onClick={() => reveal(slot)}
                    className="w-full max-w-[140px] block transition-transform hover:-translate-y-1"
                    aria-label="Lap felfedése"
                  >
                    <CardBack />
                    <div className="text-[10px] text-ivory/55 text-center mt-2">koppints a felfedéshez</div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Instruction */}
      {!allPicked && (
        <div className="text-center mb-3">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
            {count === 1
              ? "Válassz egy lapot a kiterített pakliból"
              : `Válassz ${count - picked.length} lapot a pakliból`}
          </div>
        </div>
      )}

      {/* Spread (fan) */}
      <div className="relative mx-auto h-[240px] sm:h-[280px] max-w-[720px] [perspective:1200px]">
        {/* parchment glow */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-20px] w-[90%] h-12 rounded-[50%] bg-[radial-gradient(ellipse,oklch(0.78_0.10_80/0.18),transparent_70%)] blur-md pointer-events-none" />
        {pool.map((c, i) => {
          const t = i / (total - 1); // 0..1
          const angle = -arc / 2 + t * arc;
          const lift = Math.sin(t * Math.PI) * 12; // arc bow
          const isPicked = picked.includes(i);
          const isFaded = allPicked && !isPicked;
          return (
            <button
              key={c.id + i}
              type="button"
              disabled={isPicked || allPicked}
              onClick={() => pick(i)}
              aria-label={isPicked ? "Kiválasztva" : "Lap kiválasztása"}
              className="absolute top-1/2 left-1/2 origin-bottom transition-all duration-500 ease-out group focus:outline-none"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${-lift}px) ${
                  isPicked ? "translateY(-160px) rotate(0deg) scale(0.95)" : ""
                } ${isPicked ? `translate(${(picked.indexOf(i) - (count - 1) / 2) * 90}px, -160px)` : ""}`,
                zIndex: isPicked ? 50 - picked.indexOf(i) : Math.abs(8 - i),
                opacity: isFaded ? 0.15 : isPicked ? 0 : 1,
                pointerEvents: isPicked || allPicked ? "none" : "auto",
                width: 78,
              }}
            >
              <div
                className="relative w-[78px] aspect-[2/3.4] rounded-[10px] overflow-hidden border border-[oklch(0.78_0.10_80/0.55)] shadow-[0_10px_30px_-12px_oklch(0_0_0/0.85)] transition-transform duration-300 group-hover:-translate-y-3 group-hover:shadow-[0_18px_40px_-10px_oklch(0.78_0.10_80/0.4)]"
              >
                <svg viewBox="0 0 200 340" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id={`mg-${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F4D9A6" />
                      <stop offset="60%" stopColor="#D4AF7A" />
                      <stop offset="100%" stopColor="#7A5326" />
                    </linearGradient>
                    <radialGradient id={`mp-${i}`} cx="50%" cy="45%" r="70%">
                      <stop offset="0%" stopColor="#2A1A3E" />
                      <stop offset="60%" stopColor="#150B23" />
                      <stop offset="100%" stopColor="#070310" />
                    </radialGradient>
                  </defs>
                  <rect width="200" height="340" fill={`url(#mp-${i})`} />
                  {/* astrolabe rings */}
                  <g transform="translate(100 170)" fill="none" stroke={`url(#mg-${i})`}>
                    <circle r="74" strokeWidth="0.6" opacity="0.55" />
                    <circle r="58" strokeWidth="0.8" opacity="0.75" />
                    <circle r="42" strokeWidth="0.4" opacity="0.5" />
                    {Array.from({ length: 24 }).map((_, k) => {
                      const a = (k * Math.PI * 2) / 24;
                      return (
                        <path key={k}
                          d={`M${Math.cos(a) * 74} ${Math.sin(a) * 74} L${Math.cos(a) * 70} ${Math.sin(a) * 70}`}
                          strokeWidth="0.5" opacity="0.7" />
                      );
                    })}
                    {/* portal */}
                    <g transform="scale(2.4)" stroke={`url(#mg-${i})`} fill="none">
                      <path d="M-10 16 L-10 0 Q-10 -14 0 -14 Q10 -14 10 0 L10 16 Z" strokeWidth="1" fill="#0B0716" />
                      <path d="M-12 16 L12 16" strokeWidth="1" />
                      <path d="M-5 -2 A6 6 0 1 0 5 -2 A4.5 4.5 0 1 1 -5 -2 Z" fill={`url(#mg-${i})`} stroke="none" />
                      <path d="M0 -10 L1.3 -6.2 L5.2 -6.2 L2 -3.9 L3.3 -0.1 L0 -2.5 L-3.3 -0.1 L-2 -3.9 L-5.2 -6.2 L-1.3 -6.2 Z" fill={`url(#mg-${i})`} stroke="none" />
                    </g>
                  </g>
                  {/* frame */}
                  <g fill="none" stroke={`url(#mg-${i})`}>
                    <rect x="8" y="8" width="184" height="324" rx="8" strokeWidth="1.4" />
                    <rect x="12" y="12" width="176" height="316" rx="6" strokeWidth="0.5" opacity="0.6" />
                  </g>
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
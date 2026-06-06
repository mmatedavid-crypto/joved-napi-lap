import { useMemo, useState, useEffect } from "react";
import { CARD_BACK_ART, CardBack, CardFace } from "./TarotCard";
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
                <img
                  src={CARD_BACK_ART}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0_0_0/0.55)_100%)]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
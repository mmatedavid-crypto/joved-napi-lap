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
  const [sessionSeed, setSessionSeed] = useState(seed ?? 1);

  useEffect(() => {
    if (seed == null) setSessionSeed(Math.floor(Math.random() * 1_000_000));
  }, [seed, resetKey]);

  const arrangementSeed = seed ?? sessionSeed;

  // full Major Arcana pool arranged in an arc
  const pool = useMemo(
    () => pickCards(SPREAD_SIZE, arrangementSeed + Number(resetKey ?? 0) * 13),
    [arrangementSeed, resetKey],
  );
  const [picked, setPicked] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([]);

  useEffect(() => { setPicked([]); setRevealed([]); }, [resetKey, arrangementSeed]);

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
  const arc = 150;

  return (
    <div className="select-none w-full">
      {/* Spread (fan) */}
      <div className="relative mx-auto -mt-1 h-[340px] sm:h-[440px] md:h-[520px] w-screen max-w-none -ml-[50vw] left-1/2 overflow-visible [perspective:1600px]">
        {!allPicked && (
          <div className="absolute left-1/2 top-2 z-[80] w-full -translate-x-1/2 px-2 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
              {count === 1
                ? "Válassz egy lapot a kiterített pakliból"
                : `Válassz ${count - picked.length} lapot a pakliból`}
            </div>
          </div>
        )}

        {picked.length > 0 && (
          <div
            className={`absolute left-1/2 top-7 z-[90] grid -translate-x-1/2 gap-2 sm:gap-4 ${
              count === 1 ? "w-[min(48vw,210px)]" : "w-[min(92vw,700px)] grid-cols-3"
            }`}
          >
            {picked.map((idx, slot) => {
              const card = pool[idx];
              const isRev = revealed[slot];
              return (
                <div key={`${card.id}-${slot}`} className="min-w-0 text-center">
                  {slotLabels?.[slot] && (
                    <div className="mb-1 text-[9px] tracking-[0.25em] uppercase text-[oklch(0.78_0.10_80/0.72)]">
                      {slotLabels[slot]}
                    </div>
                  )}
                  {isRev ? (
                    <CardFace card={card} className="w-full animate-fade-in" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => reveal(slot)}
                      className="block w-full transition-transform hover:-translate-y-1"
                      aria-label="Lap felfedése"
                    >
                      <CardBack />
                      <div className="mt-1 text-[10px] text-ivory/55">felfedés</div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* parchment glow */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-20px] w-[90%] h-12 rounded-[50%] bg-[radial-gradient(ellipse,oklch(0.78_0.10_80/0.18),transparent_70%)] blur-md pointer-events-none" />
        {pool.map((c, i) => {
          const t = i / (total - 1); // 0..1
          const angle = -arc / 2 + t * arc;
          const lift = Math.sin(t * Math.PI) * 48;
          const spreadX = (t - 0.5) * 92; // vw, horizontal spread across viewport
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
                transform: `translate(-50%, -34%) translateX(${spreadX}vw) rotate(${angle}deg) translateY(${-lift}px)`,
                zIndex: isPicked ? 50 - picked.indexOf(i) : 22 - Math.abs(11 - i),
                opacity: isFaded ? 0.15 : isPicked ? 0 : 1,
                pointerEvents: isPicked || allPicked ? "none" : "auto",
                width: "clamp(96px, 6.2vw, 170px)",
              }}
            >
              <div
                className="relative w-full aspect-[2/3.4] rounded-[10px] overflow-hidden border border-[oklch(0.78_0.10_80/0.55)] shadow-[0_10px_30px_-12px_oklch(0_0_0/0.85)] transition-transform duration-300 group-hover:-translate-y-4 group-hover:shadow-[0_22px_50px_-10px_oklch(0.78_0.10_80/0.45)]"
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
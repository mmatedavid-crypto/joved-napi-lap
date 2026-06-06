import { useState } from "react";
import type { TarotCard as TCard } from "@/data/cards";

import bolond from "@/assets/tarot/bolond.jpg";
import mago from "@/assets/tarot/mago.jpg";
import fopapno from "@/assets/tarot/fopapno.jpg";
import csaszarno from "@/assets/tarot/csaszarno.jpg";
import csaszar from "@/assets/tarot/csaszar.jpg";
import fopap from "@/assets/tarot/fopap.jpg";
import szeretok from "@/assets/tarot/szeretok.jpg";
import diadalszeker from "@/assets/tarot/diadalszeker.jpg";
import ero from "@/assets/tarot/ero.jpg";
import remete from "@/assets/tarot/remete.jpg";
import kerek from "@/assets/tarot/kerek.jpg";
import igazsag from "@/assets/tarot/igazsag.jpg";
import akasztott from "@/assets/tarot/akasztott.jpg";
import halal from "@/assets/tarot/halal.jpg";
import mertekletesseg from "@/assets/tarot/mertekletesseg.jpg";
import ordog from "@/assets/tarot/ordog.jpg";
import torony from "@/assets/tarot/torony.jpg";
import csillag from "@/assets/tarot/csillag.jpg";
import hold from "@/assets/tarot/hold.jpg";
import nap from "@/assets/tarot/nap.jpg";
import itelet from "@/assets/tarot/itelet.jpg";
import vilag from "@/assets/tarot/vilag.jpg";
import backArt from "@/assets/tarot/back.jpg";

export const CARD_ART: Record<string, string> = {
  bolond,
  mago,
  fopapno,
  csaszarno,
  csaszar,
  fopap,
  szeretok,
  diadalszeker,
  ero,
  remete,
  kerek,
  igazsag,
  akasztott,
  halal,
  mertekletesseg,
  ordog,
  torony,
  csillag,
  hold,
  nap,
  itelet,
  vilag,
};

export const CARD_BACK_ART = backArt;

/* Antique tarot card system — hand-rendered illustrations as faces, with
   a unified title banner (top) and keyword banner (bottom) overlay so
   every card stays visually consistent. */

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`tarot-card ${className}`}>
      <img
        src={backArt}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        draggable={false}
      />
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-[oklch(0.78_0.10_80/0.35)] rounded-[14px]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,oklch(0_0_0/0.55)_100%)]" />
    </div>
  );
}

export function CardFace({
  card,
  label,
  className = "",
}: {
  card: TCard;
  label?: string;
  className?: string;
}) {
  const art = CARD_ART[card.id] ?? backArt;
  return (
    <div className={`tarot-card ${className}`} style={{ animation: "reveal-flip .8s ease-out" }}>
      <img
        src={art}
        alt={card.name}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        draggable={false}
      />

      {/* edge vignette so every card has the same purple frame regardless of source */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,oklch(0.10_0.05_295/0.75)_100%)]" />
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-[oklch(0.78_0.10_80/0.45)] rounded-[14px]" />

      {/* Title banner — hides any baked-in roman numerals on the source art */}
      <div className="absolute left-[6%] right-[6%] top-[4%] pointer-events-none">
        <div className="rounded-[6px] border border-[oklch(0.78_0.10_80/0.55)] bg-[linear-gradient(180deg,oklch(0.12_0.05_295/0.92),oklch(0.08_0.04_295/0.88))] shadow-[inset_0_0_0_1px_oklch(0.78_0.10_80/0.18)] px-2 py-1 text-center">
          {label && (
            <div className="text-[7px] tracking-[0.4em] uppercase text-[oklch(0.86_0.06_80/0.7)]">
              {label}
            </div>
          )}
          <div
            className="font-display leading-none"
            style={{
              fontSize: "clamp(12px, 3.6vw, 19px)",
              letterSpacing: "0.08em",
              color: "oklch(0.92 0.06 80)",
              textShadow: "0 1px 0 oklch(0 0 0 / 0.6)",
            }}
          >
            {card.name.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Keyword banner */}
      <div className="absolute left-[10%] right-[10%] bottom-[3.5%] pointer-events-none">
        <div className="rounded-[4px] border border-[oklch(0.78_0.10_80/0.5)] bg-[linear-gradient(180deg,oklch(0.10_0.04_295/0.92),oklch(0.06_0.03_295/0.9))] px-2 py-[3px] text-center">
          <div className="text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-[oklch(0.86_0.06_80/0.85)] truncate">
            {card.keywords.slice(0, 3).join(" · ")}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlipCard({
  card,
  label,
  autoReveal = false,
  onReveal,
}: {
  card: TCard;
  label?: string;
  autoReveal?: boolean;
  onReveal?: () => void;
}) {
  const [revealed, setRevealed] = useState(autoReveal);
  return (
    <button
      type="button"
      onClick={() => {
        if (!revealed) {
          setRevealed(true);
          onReveal?.();
        }
      }}
      className="block w-full text-left focus:outline-none"
      aria-label={revealed ? card.name : "Lap felfedése"}
    >
      {revealed ? <CardFace card={card} label={label} /> : <CardBack />}
    </button>
  );
}

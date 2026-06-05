import { useState } from "react";
import type { TarotCard as TCard } from "@/data/cards";

export function CardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`tarot-card ${className}`}>
      <div className="absolute inset-2 rounded-[10px] border border-[oklch(0.78_0.10_80/0.3)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 100 140" className="w-2/3 h-2/3 opacity-90 animate-shimmer">
          <defs>
            <linearGradient id="cbg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E8C48A" />
              <stop offset="100%" stopColor="#9C6F3F" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="55" r="22" fill="none" stroke="url(#cbg)" strokeWidth="0.8" />
          <path d="M50 35 L52 50 L66 52 L54 60 L58 75 L50 66 L42 75 L46 60 L34 52 L48 50 Z" fill="url(#cbg)" />
          <path d="M40 90 Q50 78 60 90" stroke="url(#cbg)" strokeWidth="1" fill="none" />
          <circle cx="50" cy="110" r="2" fill="url(#cbg)" />
          <circle cx="30" cy="20" r="1" fill="url(#cbg)" />
          <circle cx="72" cy="25" r="1" fill="url(#cbg)" />
          <circle cx="78" cy="115" r="1" fill="url(#cbg)" />
          <circle cx="22" cy="120" r="1" fill="url(#cbg)" />
        </svg>
      </div>
    </div>
  );
}

function CardArt({ id }: { id: string }) {
  const seed = id.charCodeAt(0) + id.length;
  return (
    <svg viewBox="0 0 100 120" className="w-full h-full">
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C48A" />
          <stop offset="100%" stopColor="#8B5E2B" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="55" r="30" fill="none" stroke={`url(#g-${id})`} strokeWidth="0.7" opacity="0.6" />
      <path
        d="M50 25 L53 50 L78 53 L57 60 L62 85 L50 70 L38 85 L43 60 L22 53 L47 50 Z"
        fill={`url(#g-${id})`}
        opacity="0.95"
      />
      <path d="M30 95 Q50 80 70 95" stroke={`url(#g-${id})`} strokeWidth="0.8" fill="none" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (seed * (i + 1)) % 360;
        const x = 50 + Math.cos((a * Math.PI) / 180) * 38;
        const y = 55 + Math.sin((a * Math.PI) / 180) * 38;
        return <circle key={i} cx={x} cy={y} r="0.8" fill="#E8C48A" opacity="0.8" />;
      })}
    </svg>
  );
}

export function CardFace({ card, label, className = "" }: { card: TCard; label?: string; className?: string }) {
  return (
    <div className={`tarot-card ${className}`} style={{ animation: "reveal-flip .8s ease-out" }}>
      <div className="absolute inset-2 rounded-[10px] border border-[oklch(0.78_0.10_80/0.4)] flex flex-col">
        {label && (
          <div className="text-center text-[10px] tracking-[0.25em] uppercase text-[oklch(0.78_0.10_80/0.7)] pt-2">{label}</div>
        )}
        <div className="flex-1 flex items-center justify-center px-3">
          <CardArt id={card.id} />
        </div>
        <div className="text-center pb-3 px-2">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.6)] mb-1">Lap</div>
          <div className="font-display text-lg text-ivory leading-tight">{card.name}</div>
        </div>
      </div>
    </div>
  );
}

export function FlipCard({ card, label, autoReveal = false, onReveal }:
  { card: TCard; label?: string; autoReveal?: boolean; onReveal?: () => void }) {
  const [revealed, setRevealed] = useState(autoReveal);
  return (
    <button
      type="button"
      onClick={() => { if (!revealed) { setRevealed(true); onReveal?.(); } }}
      className="block w-full text-left focus:outline-none"
      aria-label={revealed ? card.name : "Lap felfedése"}
    >
      {revealed ? <CardFace card={card} label={label} /> : <CardBack />}
    </button>
  );
}
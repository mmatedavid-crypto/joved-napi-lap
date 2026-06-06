import { useState } from "react";
import type { TarotCard as TCard } from "@/data/cards";

/* ──────────────────────────────────────────────────────────────────────
   Antique tarot card system — premium "100-year-old fortune deck" feel.
   Reusable parts: defs (gradients, distress filter), frame, emblem, glyphs.
   Coordinates: viewBox 200x340 (≈ 2:3.4 tarot ratio).
   ────────────────────────────────────────────────────────────────────── */

function CardDefs({ uid }: { uid: string }) {
  return (
    <defs>
      {/* Gold ink gradient */}
      <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F4D9A6" />
        <stop offset="50%" stopColor="#D4AF7A" />
        <stop offset="100%" stopColor="#7A5326" />
      </linearGradient>
      <linearGradient id={`gold-soft-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E8C48A" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#8B5E2B" stopOpacity="0.85" />
      </linearGradient>
      {/* Deep nocturnal base for the inner panel */}
      <radialGradient id={`panel-${uid}`} cx="50%" cy="42%" r="70%">
        <stop offset="0%" stopColor="#2A1A3E" />
        <stop offset="55%" stopColor="#150B23" />
        <stop offset="100%" stopColor="#08040F" />
      </radialGradient>
      {/* Parchment / age stain wash */}
      <radialGradient id={`stain-${uid}`} cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#C8A878" stopOpacity="0" />
        <stop offset="70%" stopColor="#5A3E20" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#1A0F08" stopOpacity="0.45" />
      </radialGradient>
      {/* Distress noise — multiplied over the panel */}
      <filter id={`grain-${uid}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={uid.length} />
        <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.22  0 0 0 0.22 0" />
      </filter>
      {/* Subtle vignette */}
      <radialGradient id={`vignette-${uid}`} cx="50%" cy="50%" r="62%">
        <stop offset="60%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
    </defs>
  );
}

/** Ornate double gold frame with corner fleurons. Renders inside viewBox 200x340. */
function Frame({ uid }: { uid: string }) {
  const g = `url(#gold-${uid})`;
  return (
    <g fill="none" stroke={g}>
      {/* outer hairline */}
      <rect x="6" y="6" width="188" height="328" rx="10" strokeWidth="0.8" opacity="0.7" />
      {/* main double frame */}
      <rect x="11" y="11" width="178" height="318" rx="8" strokeWidth="1.4" />
      <rect x="15" y="15" width="170" height="310" rx="6" strokeWidth="0.5" opacity="0.65" />
      {/* corner fleurons */}
      {[
        { x: 15, y: 15, r: 0 },
        { x: 185, y: 15, r: 90 },
        { x: 185, y: 325, r: 180 },
        { x: 15, y: 325, r: 270 },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.r})`} stroke={g} strokeWidth="0.7">
          <path d="M0 14 Q0 0 14 0" fill="none" />
          <path d="M3 11 Q3 3 11 3" fill="none" opacity="0.7" />
          <circle cx="0" cy="0" r="1.4" fill={g} stroke="none" />
          <path d="M9 0 L11 0 M0 9 L0 11" />
        </g>
      ))}
      {/* upper & lower ornament bands */}
      <path d="M40 20 Q100 14 160 20" strokeWidth="0.4" opacity="0.6" />
      <path d="M40 320 Q100 326 160 320" strokeWidth="0.4" opacity="0.6" />
    </g>
  );
}

/** Jövőd brand emblem — mystical portal arch with star and crescent. */
function JovodEmblem({ uid, size = 1 }: { uid: string; size?: number }) {
  const g = `url(#gold-${uid})`;
  return (
    <g transform={`scale(${size})`} fill="none" stroke={g}>
      {/* arch / doorway */}
      <path
        d="M-10 16 L-10 0 Q-10 -14 0 -14 Q10 -14 10 0 L10 16 Z"
        strokeWidth="0.9"
        fill="#0B0716"
      />
      {/* threshold */}
      <path d="M-12 16 L12 16" strokeWidth="0.9" />
      {/* inner step shadow */}
      <path d="M-8 14 L-8 0 Q-8 -12 0 -12 Q8 -12 8 0 L8 14" strokeWidth="0.35" opacity="0.7" />
      {/* crescent moon cradling the star */}
      <path d="M-5 -2 A6 6 0 1 0 5 -2 A4.5 4.5 0 1 1 -5 -2 Z" fill={g} stroke="none" opacity="0.9" />
      {/* 5-point star */}
      <path
        d="M0 -10 L1.3 -6.2 L5.2 -6.2 L2 -3.9 L3.3 -0.1 L0 -2.5 L-3.3 -0.1 L-2 -3.9 L-5.2 -6.2 L-1.3 -6.2 Z"
        fill={g}
        stroke="none"
      />
      {/* tiny radiating rays above arch */}
      <g stroke={g} strokeWidth="0.4" opacity="0.7">
        <path d="M0 -16 L0 -19" />
        <path d="M-6 -14 L-8 -16" />
        <path d="M6 -14 L8 -16" />
      </g>
    </g>
  );
}

/* ── Per-card central glyphs ────────────────────────────────────────── */
/* All glyphs are designed inside a centered ~80×100 area, gold linework. */

type GlyphProps = { uid: string };
function G({ uid, children }: GlyphProps & { children: React.ReactNode }) {
  return (
    <g fill="none" stroke={`url(#gold-${uid})`} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  );
}

function Sun({ uid }: GlyphProps) {
  const g = `url(#gold-${uid})`;
  return (
    <G uid={uid}>
      <circle cx="0" cy="0" r="16" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i * Math.PI) / 8;
        const r1 = 20, r2 = i % 2 === 0 ? 32 : 26;
        return (
          <path key={i} d={`M${Math.cos(a) * r1} ${Math.sin(a) * r1} L${Math.cos(a) * r2} ${Math.sin(a) * r2}`} strokeWidth="0.7" />
        );
      })}
      <circle cx="0" cy="0" r="6" fill={g} stroke="none" />
      <path d="M-4 2 Q0 5 4 2" strokeWidth="0.5" stroke="#0B0716" />
    </G>
  );
}
function Moon({ uid }: GlyphProps) {
  const g = `url(#gold-${uid})`;
  return (
    <G uid={uid}>
      <circle cx="0" cy="0" r="28" strokeWidth="0.4" opacity="0.45" />
      <path d="M8 -18 A22 22 0 1 0 8 18 A16 16 0 1 1 8 -18 Z" fill={g} stroke="none" opacity="0.92" />
      <circle cx="-2" cy="-6" r="0.8" fill="#0B0716" stroke="none" />
      <circle cx="-6" cy="2" r="0.6" fill="#0B0716" stroke="none" />
      <circle cx="-3" cy="8" r="0.5" fill="#0B0716" stroke="none" />
    </G>
  );
}
function Star8({ uid }: GlyphProps) {
  const g = `url(#gold-${uid})`;
  return (
    <G uid={uid}>
      <circle cx="0" cy="0" r="24" strokeWidth="0.4" opacity="0.45" />
      {[0, 45, 90, 135].map((a, i) => (
        <path
          key={i}
          transform={`rotate(${a})`}
          d="M0 -22 L3 -3 L22 0 L3 3 L0 22 L-3 3 L-22 0 L-3 -3 Z"
          fill={i === 0 ? g : "none"}
          stroke={g}
          strokeWidth="0.4"
        />
      ))}
      <circle cx="0" cy="0" r="2.4" fill={g} stroke="none" />
      {[-30, -15, 15, 30].map((x) => (
        <circle key={x} cx={x} cy={x % 20 === 0 ? -28 : 28} r="0.7" fill={g} stroke="none" />
      ))}
    </G>
  );
}
function Tower({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-10 26 L-10 -10 L-6 -16 L6 -16 L10 -10 L10 26 Z" />
      <path d="M-10 -2 L10 -2 M-10 10 L10 10" strokeWidth="0.5" />
      <path d="M-4 -16 L-4 -22 L4 -22 L4 -16" />
      <path d="M-18 -28 L0 -10 L-6 -8 L8 8 L2 6 L14 22" strokeWidth="0.7" />
      <path d="M-14 28 L14 28" />
    </G>
  );
}
function Scales({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M0 -26 L0 24" />
      <path d="M-22 -16 L22 -16" />
      <path d="M-22 -16 L-30 4 M-22 -16 L-14 4" />
      <path d="M22 -16 L14 4 M22 -16 L30 4" />
      <ellipse cx="-22" cy="6" rx="10" ry="3" />
      <ellipse cx="22" cy="6" rx="10" ry="3" />
      <circle cx="0" cy="-26" r="2.5" fill={`url(#gold-${uid})`} stroke="none" />
      <path d="M-6 24 L6 24" />
    </G>
  );
}
function Hourglass({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-14 -22 L14 -22 L-14 22 L14 22 Z" />
      <path d="M-14 -22 L14 22 M14 -22 L-14 22" strokeWidth="0.4" opacity="0.6" />
      <path d="M-18 -24 L18 -24 M-18 24 L18 24" strokeWidth="1.2" />
      <path d="M-4 -2 Q0 6 4 -2" />
      <circle cx="0" cy="-22" r="0.8" fill={`url(#gold-${uid})`} stroke="none" />
    </G>
  );
}
function Scythe({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-14 -26 L14 26" strokeWidth="1.2" />
      <path d="M-14 -26 Q-26 -22 -26 -10 Q-22 -16 -14 -18" />
      <path d="M-18 22 Q-8 18 4 26" strokeWidth="0.5" />
      <circle cx="-22" cy="-18" r="1" fill={`url(#gold-${uid})`} stroke="none" />
    </G>
  );
}
function Hanged({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-20 -26 L20 -26" />
      <path d="M0 -26 L0 -10" />
      <circle cx="0" cy="-4" r="6" />
      <path d="M0 2 L0 16 L-8 26 M0 16 L8 8" />
      <circle cx="-22" cy="-26" r="1" fill={`url(#gold-${uid})`} stroke="none" />
      <circle cx="22" cy="-26" r="1" fill={`url(#gold-${uid})`} stroke="none" />
    </G>
  );
}
function Horned({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <circle cx="0" cy="-6" r="10" />
      <path d="M-10 -10 Q-16 -22 -8 -22 M10 -10 Q16 -22 8 -22" />
      <path d="M-4 -6 L-4 -3 M4 -6 L4 -3" strokeWidth="1.3" />
      <path d="M-3 0 Q0 3 3 0" />
      <path d="M-8 6 L-12 22 M8 6 L12 22 M0 8 L0 26" />
      <path d="M-6 26 L6 26" />
    </G>
  );
}
function Wheel({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <circle cx="0" cy="0" r="26" />
      <circle cx="0" cy="0" r="18" strokeWidth="0.5" />
      <circle cx="0" cy="0" r="6" />
      {[0, 45, 90, 135].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0 -26 L0 26" strokeWidth="0.6" />
      ))}
      {[0, 90, 180, 270].map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 26} cy={Math.sin((a * Math.PI) / 180) * 26} r="1.6" fill={`url(#gold-${uid})`} stroke="none" />
      ))}
    </G>
  );
}
function Ouroboros({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <circle cx="0" cy="0" r="22" />
      <path d="M18 -12 Q26 -2 18 12 Q4 22 -10 14" strokeWidth="1.3" />
      <path d="M18 -12 L24 -10 L20 -16 Z" fill={`url(#gold-${uid})`} stroke="none" />
      <circle cx="-10" cy="14" r="1.4" fill={`url(#gold-${uid})`} stroke="none" />
      <path d="M-2 -2 L2 2 M2 -2 L-2 2" strokeWidth="0.5" />
    </G>
  );
}
function Lantern({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-4 -22 L4 -22 L4 -18 L-4 -18 Z" />
      <path d="M0 -18 L0 -14" />
      <path d="M-12 -14 L12 -14 L8 14 L-8 14 Z" />
      <path d="M-8 14 L-12 22 L12 22 L8 14" />
      <circle cx="0" cy="0" r="4" fill={`url(#gold-${uid})`} stroke="none" />
      <path d="M-12 -14 Q0 -20 12 -14" strokeWidth="0.5" />
    </G>
  );
}
function Lovers({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <circle cx="-10" cy="-8" r="6" />
      <circle cx="10" cy="-8" r="6" />
      <path d="M-10 -2 L-10 18 M10 -2 L10 18" />
      <path d="M-10 18 L10 18" />
      <path d="M-4 -8 Q0 -4 4 -8" />
      <path d="M0 -22 L-3 -16 L3 -16 Z" fill={`url(#gold-${uid})`} stroke="none" />
    </G>
  );
}
function Chariot({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-22 6 L22 6 L18 18 L-18 18 Z" />
      <circle cx="-14" cy="20" r="6" />
      <circle cx="14" cy="20" r="6" />
      <circle cx="-14" cy="20" r="2" fill={`url(#gold-${uid})`} stroke="none" />
      <circle cx="14" cy="20" r="2" fill={`url(#gold-${uid})`} stroke="none" />
      <path d="M-16 6 L-16 -6 L16 -6 L16 6" />
      <path d="M0 -6 L0 -16" />
      <path d="M-5 -16 L5 -16 L0 -22 Z" fill={`url(#gold-${uid})`} stroke="none" />
    </G>
  );
}
function Pillars({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-18 -22 L-18 22 M-14 -22 L-14 22" />
      <path d="M18 -22 L18 22 M14 -22 L14 22" />
      <path d="M-22 -22 L-10 -22 M10 -22 L22 -22" />
      <path d="M-22 22 L-10 22 M10 22 L22 22" />
      <path d="M8 -10 A8 8 0 1 0 -8 -10 A6 6 0 1 1 8 -10 Z" fill={`url(#gold-${uid})`} stroke="none" />
      <path d="M-6 12 L6 12" />
    </G>
  );
}
function Wheat({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-14 -22 L-2 -8 M-10 -18 L-2 -10 M14 -22 L2 -8 M10 -18 L2 -10" />
      <path d="M0 -22 L0 -8" />
      <ellipse cx="0" cy="0" rx="16" ry="10" />
      <path d="M-12 14 Q0 22 12 14" />
      <path d="M-6 4 L0 0 L6 4" />
      <circle cx="0" cy="-22" r="1.4" fill={`url(#gold-${uid})`} stroke="none" />
    </G>
  );
}
function Throne({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-16 -22 L-16 14 L16 14 L16 -22 Z" />
      <path d="M-16 -22 L-22 -28 M16 -22 L22 -28" />
      <path d="M-22 -28 L-22 -16 M22 -28 L22 -16" />
      <path d="M-16 4 L16 4" />
      <path d="M-8 -16 Q-12 -22 -16 -16 M8 -16 Q12 -22 16 -16" />
      <path d="M-14 14 L-14 22 M14 14 L14 22" />
    </G>
  );
}
function Keys({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <g transform="rotate(-25)">
        <circle cx="-12" cy="-12" r="5" />
        <path d="M-8 -12 L18 -12 L18 -8 M14 -12 L14 -6" />
      </g>
      <g transform="rotate(25)">
        <circle cx="-12" cy="-12" r="5" />
        <path d="M-8 -12 L18 -12 L18 -8 M14 -12 L14 -6" />
      </g>
      <path d="M0 8 L0 22 M-6 22 L6 22" />
    </G>
  );
}
function Mage({ uid }: GlyphProps) {
  const g = `url(#gold-${uid})`;
  return (
    <G uid={uid}>
      <path d="M-12 -8 Q-6 -16 0 -8 Q6 0 12 -8 Q6 -16 0 -8 Q-6 0 -12 -8 Z" />
      <path d="M0 -18 L0 -28" strokeWidth="1.3" />
      <circle cx="0" cy="-30" r="1.5" fill={g} stroke="none" />
      <circle cx="0" cy="-16" r="1.2" fill={g} stroke="none" />
      <path d="M-18 14 L18 14" />
      <path d="M-12 8 L-8 14 M-4 8 L0 14 L4 8 L8 14 M12 8 L8 14" />
    </G>
  );
}
function Fool({ uid }: GlyphProps) {
  const g = `url(#gold-${uid})`;
  return (
    <G uid={uid}>
      <circle cx="-4" cy="-14" r="5" />
      <path d="M-4 -9 L-4 8 L-12 22 M-4 8 L6 0 L14 8 M-4 -2 L8 -8" />
      <path d="M16 -8 L20 -16 L24 -8 L20 0 Z" fill={g} stroke="none" opacity="0.9" />
      <path d="M-22 22 Q0 28 22 22" />
      <circle cx="14" cy="-18" r="1.4" fill={g} stroke="none" />
    </G>
  );
}
function Trumpet({ uid }: GlyphProps) {
  return (
    <G uid={uid}>
      <path d="M-20 -8 L8 -2 L8 8 L-20 14 Z" />
      <path d="M8 -2 L18 -10 L22 -4 L14 4 Z" />
      <path d="M-20 -8 L-26 -10 M-20 14 L-26 16" />
      <path d="M0 18 Q0 28 -8 28 M0 18 Q0 28 8 28" strokeWidth="0.5" />
    </G>
  );
}
function World({ uid }: GlyphProps) {
  const g = `url(#gold-${uid})`;
  return (
    <G uid={uid}>
      <ellipse cx="0" cy="0" rx="20" ry="28" />
      <ellipse cx="0" cy="0" rx="20" ry="28" transform="rotate(20)" strokeWidth="0.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12;
        return <circle key={i} cx={Math.cos(a) * 22} cy={Math.sin(a) * 30} r="1.2" fill={g} stroke="none" />;
      })}
      <path d="M-6 4 L0 -4 L6 4 L0 10 Z" fill={g} stroke="none" />
    </G>
  );
}

const GLYPHS: Record<string, (p: GlyphProps) => JSX.Element> = {
  bolond: Fool, mago: Mage, fopapno: Pillars, csaszarno: Wheat, csaszar: Throne,
  fopap: Keys, szeretok: Lovers, diadalszeker: Chariot, ero: Ouroboros, remete: Lantern,
  kerek: Wheel, igazsag: Scales, akasztott: Hanged, halal: Scythe, mertekletesseg: Hourglass,
  ordog: Horned, torony: Tower, csillag: Star8, hold: Moon, nap: Sun, itelet: Trumpet, vilag: World,
};

function CardGlyph({ id, uid }: { id: string; uid: string }) {
  const Glyph = GLYPHS[id] ?? Star8;
  return (
    <g transform="translate(100 165)">
      {/* halo ring */}
      <circle cx="0" cy="0" r="60" fill="none" stroke={`url(#gold-${uid})`} strokeWidth="0.35" opacity="0.45" />
      <circle cx="0" cy="0" r="52" fill="none" stroke={`url(#gold-${uid})`} strokeWidth="0.25" opacity="0.35" />
      {/* small constellation dots around the halo */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12;
        return <circle key={i} cx={Math.cos(a) * 60} cy={Math.sin(a) * 60} r="0.7" fill={`url(#gold-${uid})`} />;
      })}
      <Glyph uid={uid} />
    </g>
  );
}

/* ── Card faces ─────────────────────────────────────────────────────── */

export function CardBack({ className = "" }: { className?: string }) {
  const uid = "back";
  return (
    <div className={`tarot-card ${className}`}>
      <svg viewBox="0 0 200 340" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <CardDefs uid={uid} />
        {/* nocturnal panel + stain + grain */}
        <rect x="0" y="0" width="200" height="340" fill={`url(#panel-${uid})`} />
        <rect x="0" y="0" width="200" height="340" fill={`url(#stain-${uid})`} />
        <rect x="0" y="0" width="200" height="340" filter={`url(#grain-${uid})`} opacity="0.55" />
        {/* astrolabe rings (centered) */}
        <g transform="translate(100 170)" fill="none" stroke={`url(#gold-${uid})`}>
          <circle r="78" strokeWidth="0.5" opacity="0.55" />
          <circle r="66" strokeWidth="0.35" opacity="0.45" />
          <circle r="54" strokeWidth="0.7" opacity="0.7" />
          <circle r="42" strokeWidth="0.3" opacity="0.4" />
          {/* tick marks on outer ring */}
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 36;
            const r1 = 78, r2 = i % 3 === 0 ? 72 : 75;
            return (
              <path key={i}
                d={`M${Math.cos(a) * r1} ${Math.sin(a) * r1} L${Math.cos(a) * r2} ${Math.sin(a) * r2}`}
                strokeWidth="0.4" opacity="0.7" />
            );
          })}
          {/* eight-point compass */}
          {[0, 45, 90, 135].map((d) => (
            <path key={d} transform={`rotate(${d})`} d="M-54 0 L54 0" strokeWidth="0.25" opacity="0.35" />
          ))}
          {/* corner crescents */}
          {[0, 90, 180, 270].map((d) => (
            <g key={d} transform={`rotate(${d}) translate(0 -66)`} stroke="none" fill={`url(#gold-${uid})`} opacity="0.85">
              <path d="M-3 0 A4 4 0 1 0 3 0 A3 3 0 1 1 -3 0 Z" />
            </g>
          ))}
          {/* small stars between crescents */}
          {[45, 135, 225, 315].map((d) => (
            <g key={d} transform={`rotate(${d}) translate(0 -66)`} fill={`url(#gold-${uid})`} stroke="none">
              <path d="M0 -3 L0.8 -0.9 L3 -0.9 L1.2 0.4 L1.9 2.6 L0 1.3 L-1.9 2.6 L-1.2 0.4 L-3 -0.9 L-0.8 -0.9 Z" />
            </g>
          ))}
          {/* central Jövőd portal emblem */}
          <JovodEmblem uid={uid} size={1.6} />
        </g>
        {/* sprinkled stars in field */}
        {[[30, 40], [170, 50], [40, 290], [165, 285], [22, 170], [180, 170]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} fill={`url(#gold-${uid})`} stroke="none" opacity="0.75">
            <path d="M0 -2 L0.6 -0.6 L2 -0.6 L0.8 0.3 L1.3 1.8 L0 0.9 L-1.3 1.8 L-0.8 0.3 L-2 -0.6 L-0.6 -0.6 Z" />
          </g>
        ))}
        <Frame uid={uid} />
        {/* tiny wordmark integrated into lower frame */}
        <text x="100" y="324" textAnchor="middle"
          fontFamily="Cormorant Garamond, serif" fontSize="6"
          letterSpacing="3" fill={`url(#gold-${uid})`} opacity="0.85">
          · JÖVŐD · HU ·
        </text>
        <rect x="0" y="0" width="200" height="340" fill={`url(#vignette-${uid})`} />
      </svg>
    </div>
  );
}

export function CardFace({ card, label, className = "" }:
  { card: TCard; label?: string; className?: string }) {
  const uid = `f-${card.id}`;
  return (
    <div className={`tarot-card ${className}`} style={{ animation: "reveal-flip .8s ease-out" }}>
      <svg viewBox="0 0 200 340" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <CardDefs uid={uid} />
        <rect x="0" y="0" width="200" height="340" fill={`url(#panel-${uid})`} />
        <rect x="0" y="0" width="200" height="340" fill={`url(#stain-${uid})`} />
        <rect x="0" y="0" width="200" height="340" filter={`url(#grain-${uid})`} opacity="0.6" />

        {/* top title band */}
        <g>
          <path d="M30 46 L100 40 L170 46" fill="none" stroke={`url(#gold-${uid})`} strokeWidth="0.5" opacity="0.7" />
          <path d="M40 50 L160 50" stroke={`url(#gold-${uid})`} strokeWidth="0.35" opacity="0.5" />
        </g>

        {/* central glyph + halo */}
        <CardGlyph id={card.id} uid={uid} />

        {/* lower divider with emblem */}
        <g>
          <path d="M30 268 L80 264 M120 264 L170 268"
            stroke={`url(#gold-${uid})`} strokeWidth="0.5" fill="none" opacity="0.75" />
          <g transform="translate(100 264) scale(0.55)">
            <JovodEmblem uid={uid} size={1} />
          </g>
        </g>

        <Frame uid={uid} />
        <rect x="0" y="0" width="200" height="340" fill={`url(#vignette-${uid})`} />
      </svg>

      {/* HTML title + keywords for crisp typography */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {label && (
          <div className="text-center text-[8px] tracking-[0.35em] uppercase text-[oklch(0.86_0.06_80/0.8)] pt-[3%]">
            {label}
          </div>
        )}
        <div className="text-center pt-[6%] px-3">
          <div className="text-[8px] tracking-[0.45em] uppercase text-[oklch(0.86_0.06_80/0.65)] mb-1">Arcanum</div>
          <div
            className="font-display text-ivory leading-tight"
            style={{ fontSize: "clamp(13px, 4.4cqw, 22px)" }}
          >
            {card.name}
          </div>
        </div>
        <div className="mt-auto pb-[6%] px-3 text-center">
          <div className="text-[8px] tracking-[0.4em] uppercase text-[oklch(0.86_0.06_80/0.75)]">
            {card.keywords.slice(0, 3).join(" · ")}
          </div>
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
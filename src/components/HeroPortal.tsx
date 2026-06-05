export function HeroPortal({ className = "" }: { className?: string }) {
  return (
    <div className={`relative aspect-square ${className}`}>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,oklch(0.36_0.13_15/0.35),transparent_60%)] blur-2xl" />
      <svg viewBox="0 0 400 400" className="relative w-full h-full animate-float">
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8C48A" />
            <stop offset="100%" stopColor="#9C6F3F" />
          </linearGradient>
          <radialGradient id="hglow" cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="oklch(0.36 0.13 15 / 0.5)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="170" fill="url(#hglow)" />
        <circle cx="200" cy="200" r="160" stroke="url(#hg)" strokeWidth="0.5" fill="none" opacity="0.4" />
        <circle cx="200" cy="200" r="140" stroke="url(#hg)" strokeWidth="0.5" fill="none" opacity="0.3" strokeDasharray="2 6" />
        <rect x="120" y="80" width="160" height="240" rx="10" stroke="url(#hg)" strokeWidth="1.2" fill="oklch(0.13 0.04 295)" />
        <rect x="128" y="88" width="144" height="224" rx="6" stroke="url(#hg)" strokeWidth="0.6" fill="none" />
        <path d="M160 280 Q160 170 200 130 Q240 170 240 280 Z" stroke="url(#hg)" strokeWidth="1" fill="oklch(0.10 0.04 295)" />
        <path d="M200 160 L205 178 L223 180 L208 190 L213 208 L200 197 L187 208 L192 190 L177 180 L195 178 Z" fill="url(#hg)" />
        <path d="M205 230 a14 14 0 1 1 -10 -13 a10 10 0 1 0 10 13 z" fill="url(#hg)" opacity="0.9" />
        <path d="M175 280 L225 280 M180 285 L220 285 M185 290 L215 290 M188 295 L212 295" stroke="url(#hg)" strokeWidth="0.8" />
        {[[60, 60], [340, 80], [70, 320], [330, 330], [40, 200], [360, 200]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.5" fill="#E8C48A" opacity="0.85" className="animate-shimmer" />
        ))}
      </svg>
    </div>
  );
}
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="logoGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8C48A" />
          <stop offset="100%" stopColor="#B68A4F" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="56" rx="4" stroke="url(#logoGold)" strokeWidth="1.2" fill="oklch(0.14 0.05 295)" />
      <path d="M14 22 Q24 10 34 22 L34 42 Q24 36 14 42 Z" stroke="url(#logoGold)" strokeWidth="1" fill="none" />
      <circle cx="24" cy="22" r="1.6" fill="url(#logoGold)" />
      <path d="M21 28 a3 3 0 1 0 5 2.5" stroke="url(#logoGold)" strokeWidth="1" fill="none" />
      <path d="M20 48 L28 48 M19 51 L29 51 M18 54 L30 54" stroke="url(#logoGold)" strokeWidth="0.8" />
    </svg>
  );
}
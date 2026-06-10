import { Link } from "@tanstack/react-router";

const ITEMS = [
  {
    to: "/",
    label: "Ma",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
  {
    to: "/mai-lap",
    label: "Tarot",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    to: "/osszeillunk",
    label: "Összeillés",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z" />
      </svg>
    ),
  },
  {
    to: "/szammisztika",
    label: "Sorsszám",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 6h8M8 10h8M8 14h8M8 18h5" />
      </svg>
    ),
  },
  {
    to: "/profil",
    label: "Profil",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="3" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
] as const;

export function BottomNav() {
  return (
    <>
      {/* spacer so content isn't hidden under the fixed nav on mobile */}
      <div className="lg:hidden h-20" aria-hidden="true" />
      <nav
        aria-label="Fő navigáció"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[oklch(0.78_0.10_80/0.18)] backdrop-blur-xl bg-[oklch(0.10_0.03_290/0.85)] pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-5">
          {ITEMS.map((it) => (
            <li key={it.to}>
              <Link
                to={it.to}
                className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] tracking-wide text-ivory/55 hover:text-gold transition-colors"
                activeOptions={{ exact: it.to === "/" }}
                activeProps={{
                  className: "text-gold [&_svg]:drop-shadow-[0_0_8px_oklch(0.78_0.10_80/0.55)]",
                }}
              >
                {it.icon}
                <span>{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

import { Link, Outlet } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { BottomNav } from "./BottomNav";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";

const NAV = [
  { to: "/mai-lap", label: "Mai lap" },
  { to: "/harom-lap", label: "3 lapos húzás" },
  { to: "/randi-elott", label: "Randi előtt" },
  { to: "/dontes-elott", label: "Döntés előtt" },
  { to: "/szammisztika", label: "Sorsszám" },
  { to: "/osszeillunk", label: "Összeillünk?" },
] as const;

export function Layout({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  function goHomeFresh(e: React.MouseEvent) {
    e.preventDefault();
    try {
      // a húzásokhoz kötött átmeneti adatok törlése (a profilt és napi briefinget megtartjuk)
      const drop = ["daily", "tarot:last", "spread:last", "draw:last"];
      drop.forEach((k) => {
        window.localStorage.removeItem("jvd:" + k);
        window.localStorage.removeItem(k);
      });
      window.sessionStorage.clear();
    } catch {
      // Storage access can be blocked in private or restricted browsing contexts.
    }
    // teljes újratöltés → minden komponens state friss lesz
    window.location.assign("/");
  }
  return (
    <div className="min-h-screen flex flex-col">
      <PaymentTestModeBanner />
      <header className="sticky top-0 z-40 border-b border-[oklch(0.78_0.10_80/0.12)] backdrop-blur-md bg-[oklch(0.12_0.02_290/0.7)]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            onClick={goHomeFresh}
            className="flex items-center gap-2"
            aria-label="Főoldal — friss kezdés"
          >
            <Logo className="h-8 w-auto" />
            <span className="font-display text-xl tracking-wide">
              <span className="text-gold-gradient">Jövőd</span>
              <span className="text-ivory/80">.hu</span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm text-ivory/80">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="hover:text-gold transition-colors"
                activeProps={{ className: "text-gold" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden text-ivory/90 p-2 rounded-md border border-[oklch(0.78_0.10_80/0.2)]"
            aria-label="Menü"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t border-[oklch(0.78_0.10_80/0.1)] bg-[oklch(0.12_0.02_290/0.95)]">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="py-2.5 px-3 rounded-md text-ivory/85 hover:text-gold"
                  activeProps={{ className: "text-gold" }}
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/rolunk"
                onClick={() => setOpen(false)}
                className="py-2.5 px-3 rounded-md text-ivory/70 text-sm"
              >
                Rólunk
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children ?? <Outlet />}</main>

      <footer className="mt-24 border-t border-[oklch(0.78_0.10_80/0.1)] bg-[oklch(0.10_0.03_290/0.7)]">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 grid gap-8 md:grid-cols-3 text-sm text-ivory/70">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Logo className="h-7 w-auto" />
              <span className="font-display text-lg">
                <span className="text-gold-gradient">Jövőd</span>.hu
              </span>
            </div>
            <p className="font-editorial text-ivory/60 leading-relaxed">
              Napi lap. Sorsszám. Összeillés. Egy csendes ritual, mielőtt döntesz.
            </p>
          </div>
          <div>
            <div className="text-ivory/90 mb-3 text-xs uppercase tracking-widest">Menü</div>
            <ul className="space-y-2">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="hover:text-gold">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/rolunk" className="hover:text-gold">
                  Rólunk
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-ivory/90 mb-3 text-xs uppercase tracking-widest">
              Jogi tudnivalók
            </div>
            <p className="font-editorial leading-relaxed text-ivory/60">
              A Jövőd.hu szórakoztató és önismereti célú tartalom. Nem orvosi, jogi, pénzügyi vagy
              pszichológiai tanácsadás.
            </p>
            <p className="mt-4 text-ivory/40 text-xs">© {new Date().getFullYear()} Jövőd.hu</p>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}

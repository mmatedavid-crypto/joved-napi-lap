import { Link, Outlet } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { BottomNav } from "./BottomNav";
import { GuestMemoryNotice } from "./GuestMemoryNotice";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";
import { ENTERTAINMENT_DISCLAIMER, SITE_LEGAL, SYMBOLIC_TRADITION_DISCLAIMER } from "@/lib/legal";

const NAV = [
  { to: "/mai-lap", label: "Mai lap" },
  { to: "/harom-lap", label: "3 lapos húzás" },
  { to: "/randi-elott", label: "Szerelmi tarot" },
  { to: "/dontes-elott", label: "Döntés előtt" },
  { to: "/horoszkop", label: "Horoszkóp" },
  { to: "/arak", label: "Árak" },
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
        window.localStorage.removeItem("jovod:" + k);
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
            <Link
              to="/profil"
              className="rounded-md border border-gold/25 px-3 py-1.5 text-gold/85 transition-colors hover:border-gold/60 hover:text-gold"
            >
              Profil
            </Link>
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
                to="/profil"
                onClick={() => setOpen(false)}
                className="py-2.5 px-3 rounded-md text-gold"
              >
                Profil és előzmények
              </Link>
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
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 grid gap-8 md:grid-cols-2 lg:grid-cols-6 text-sm text-ivory/70">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Logo className="h-7 w-auto" />
              <span className="font-display text-lg">
                <span className="text-gold-gradient">Jövőd</span>.hu
              </span>
            </div>
            <p className="font-editorial text-ivory/60 leading-relaxed max-w-sm">
              Napi lap. Sorsszám. Összeillés. Egy csendes rituálé, mielőtt döntesz.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-ivory/50">
              Rendeléssel vagy hozzáféréssel kapcsolatban a vásárlási email címedről írj:{" "}
              <a
                className="text-gold hover:text-gold/80"
                href={`mailto:${SITE_LEGAL.supportEmail}`}
              >
                {SITE_LEGAL.supportEmail}
              </a>
            </p>
            <p className="mt-4 text-ivory/40 text-xs">
              © {new Date().getFullYear()} {SITE_LEGAL.operator.shortName}
            </p>
          </div>
          <div>
            <div className="text-ivory/90 mb-3 text-xs uppercase tracking-widest">Napi rituálék</div>
            <ul className="space-y-2">
              <li><Link to="/mai-lap" className="hover:text-gold">Mai lap</Link></li>
              <li><Link to="/harom-lap" className="hover:text-gold">3 lapos húzás</Link></li>
              <li><Link to="/randi-elott" className="hover:text-gold">Szerelmi tarot</Link></li>
              <li><Link to="/dontes-elott" className="hover:text-gold">Döntés előtt</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-ivory/90 mb-3 text-xs uppercase tracking-widest">Asztrológia & számok</div>
            <ul className="space-y-2">
              <li><Link to="/horoszkop" className="hover:text-gold">Horoszkóp</Link></li>
              <li><Link to="/szuletesi-keplet" className="hover:text-gold">Születési képlet</Link></li>
              <li><Link to="/szemelyes-30-napos-horoszkop" className="hover:text-gold">30 napos térkép</Link></li>
              <li><Link to="/eves-horoszkop" className="hover:text-gold">Éves horoszkóp</Link></li>
              <li><Link to="/tranzitok" className="hover:text-gold">Tranzitelemzés</Link></li>
              <li><Link to="/vedikus-asztrologia" className="hover:text-gold">Védikus elemzés</Link></li>
              <li><Link to="/kinai-horoszkop" className="hover:text-gold">Kínai horoszkóp</Link></li>
              <li><Link to="/szammisztika" className="hover:text-gold">Sorsszám</Link></li>
              <li><Link to="/osszeillunk" className="hover:text-gold">Összeillünk?</Link></li>
              <li><Link to="/szerencseszamok" className="hover:text-gold">Napi szerencseszámok</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-ivory/90 mb-3 text-xs uppercase tracking-widest">Tudástár</div>
            <ul className="space-y-2">
              <li><Link to="/tarot" className="hover:text-gold">Tarot kártya jelentések</Link></li>
              <li><Link to="/numerologia" className="hover:text-gold">Számmisztika útmutató</Link></li>
              <li><Link to="/jiking" className="hover:text-gold">I Ching hexagramok</Link></li>
              <li><Link to="/magazin" className="hover:text-gold">Magazin</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-ivory/90 mb-3 text-xs uppercase tracking-widest">Fiók és vásárlás</div>
            <ul className="space-y-2">
              <li><Link to="/arak" className="hover:text-gold">Árak</Link></li>
              <li><Link to="/profil" className="hover:text-gold">Profil és előzmények</Link></li>
            </ul>
            <div className="text-ivory/90 mt-5 mb-2 text-xs uppercase tracking-widest">A Jövőd.hu</div>
            <ul className="space-y-2">
              <li><Link to="/rolunk" className="hover:text-gold">Rólunk</Link></li>
            </ul>
            <div className="text-ivory/90 mt-5 mb-2 text-xs uppercase tracking-widest">Jogi tudnivalók</div>
            <ul className="space-y-2">
              <li><Link to="/impresszum" className="hover:text-gold">Impresszum</Link></li>
              <li><Link to="/aszf" className="hover:text-gold">ÁSZF</Link></li>
              <li><Link to="/adatkezelesi-tajekoztato" className="hover:text-gold">Adatkezelés</Link></li>
              <li><Link to="/elallasi-tajekoztato" className="hover:text-gold">Elállási tájékoztató</Link></li>
            </ul>
            <p className="mt-3 font-editorial text-xs leading-relaxed text-ivory/50">
              {ENTERTAINMENT_DISCLAIMER}
            </p>
            <p className="mt-2 font-editorial text-xs leading-relaxed text-ivory/50">
              {SYMBOLIC_TRADITION_DISCLAIMER}
            </p>
          </div>
        </div>
      </footer>
      <GuestMemoryNotice />
      <BottomNav />
    </div>
  );
}

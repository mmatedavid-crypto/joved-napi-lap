const SYNODIC_MONTH_DAYS = 29.53058867;
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14);

type LocalMoonPhase = {
  phaseName: string;
  oneLine: string;
  illumination: string;
};

const PHASES: Array<Pick<LocalMoonPhase, "phaseName" | "oneLine">> = [
  {
    phaseName: "Újhold",
    oneLine: "A kezdetek csendes ideje: fogalmazd meg, minek szeretnél teret adni.",
  },
  {
    phaseName: "Növő holdsarló",
    oneLine: "A szándék most apró, következetes lépésekkel tud megerősödni.",
  },
  {
    phaseName: "Első negyed",
    oneLine: "A döntések ideje: válaszd ki azt az egy lépést, amely valóban előrevisz.",
  },
  {
    phaseName: "Növő hold",
    oneLine: "Finomítsd, amit elkezdtél, és adj figyelmet annak, ami már formálódik.",
  },
  {
    phaseName: "Telihold",
    oneLine: "A felismerések ideje: nézd meg, mi érett be, és mit engedhetsz el.",
  },
  {
    phaseName: "Fogyó hold",
    oneLine: "Lassíts, rendezd a tapasztalataidat, és hagyd el, ami már nem szolgál.",
  },
  {
    phaseName: "Utolsó negyed",
    oneLine: "A lezárás most tisztább teret készíthet a következő ciklusnak.",
  },
  {
    phaseName: "Fogyó holdsarló",
    oneLine: "Pihenj és figyelj befelé; nem kell minden kérdésre ma választ találnod.",
  },
];

function currentMoonPhase(now = new Date()): LocalMoonPhase {
  const daysSinceKnownNewMoon = (now.getTime() - KNOWN_NEW_MOON_UTC) / 86_400_000;
  const age = ((daysSinceKnownNewMoon % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const phasePosition = age / SYNODIC_MONTH_DAYS;
  const phaseIndex = Math.floor(phasePosition * 8 + 0.5) % 8;
  const illumination = Math.round((1 - Math.cos(phasePosition * Math.PI * 2)) * 50);
  return { ...PHASES[phaseIndex], illumination: `${illumination}% megvilágítottság` };
}

function phaseGlyph(name: string | undefined): string {
  if (!name) return "🌙";
  const v = name.toLowerCase();
  if (v.includes("újhold")) return "🌑";
  if (v.includes("növő holdsarló")) return "🌒";
  if (v.includes("első negyed")) return "🌓";
  if (v.includes("növő hold")) return "🌔";
  if (v.includes("telihold")) return "🌕";
  if (v.includes("fogyó hold") && !v.includes("sarló")) return "🌖";
  if (v.includes("utolsó negyed")) return "🌗";
  if (v.includes("fogyó holdsarló")) return "🌘";
  return "🌙";
}

/** A főoldal napi holdnaptára, külső lekérés nélkül számolva. */
export function MoonPhaseStrip() {
  const reading = currentMoonPhase();

  return (
    <section aria-label="Mai holdnaptár" className="mx-auto mt-5 max-w-5xl px-4 md:px-6">
      <div className="surface flex items-start gap-4 px-5 py-4 md:items-center md:px-6">
        <span aria-hidden className="text-3xl leading-none md:text-4xl">
          {phaseGlyph(reading.phaseName)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-[0.28em] uppercase text-[oklch(0.78_0.10_80/0.75)]">
            Mai holdnaptár
            <> · {reading.illumination}</>
          </div>
          <p className="mt-1 font-editorial text-sm leading-relaxed text-ivory/82 md:text-base">
            <span className="text-ivory">{reading.phaseName}.</span> {reading.oneLine}
          </p>
        </div>
      </div>
    </section>
  );
}

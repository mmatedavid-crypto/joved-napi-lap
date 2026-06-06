// Personal daily briefing rendered at the top of the homepage. All
// interpretations come from Roxy (English) and are rewritten into warm
// Hungarian copy by the Lovable AI Gateway via the server fn
// `roxyPersonalDailyBriefing`. The server caches the final HU briefing for
// 24h so repeated visits are free. Numerology (sorsszám, személyes év) stays
// local because it is a pure calculation.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HUDateInput } from "./HUDateInput";
import { roxyPersonalDailyBriefing, type PersonalBriefingHU } from "@/lib/roxy.functions";
import { SIGN_HU, zodiacFromDob } from "@/lib/roxyNormalize";
import { lifePath, lifePathInfo, personalYear } from "@/lib/numerology";
import { loadLocal, saveLocal, todayKey } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";

type Profile = { name?: string; dob?: string; sign?: string };

type StoredBriefing = PersonalBriefingHU & {
  generatedFor: string;
  lifePathNum: number;
  lifePathTitle: string;
  personalYearNum: number;
  personalYearMeaning: string;
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-1">
      {children}
    </div>
  );
}

function Tile({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="surface p-4">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="font-editorial text-ivory/90 text-[15.5px] leading-relaxed">{children}</div>
    </div>
  );
}

export function PersonalDailyBriefing() {
  const enrich = useServerFn(roxyPersonalDailyBriefing);

  const [profile, setProfile] = useState<Profile>({});
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<StoredBriefing | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const p =
      loadLocal<Profile>("home:profile") ??
      loadLocal<Profile>("compass:last") ??
      loadLocal<Profile>("numerology:last") ??
      {};
    if (p) {
      setProfile(p);
      setName(p.name ?? "");
      setDob(p.dob ?? "");
    }
    const cached = loadLocal<StoredBriefing>("home:briefing");
    if (cached && cached.generatedFor === todayKey()) setBriefing(cached);
  }, []);

  async function build(e?: React.FormEvent) {
    e?.preventDefault();
    const sign = zodiacFromDob(dob);
    if (!dob || !sign) return;
    setLoading(true);
    setError(null);
    trackEvent("daily_compass_opened", { from: "home" });

    const nextProfile: Profile = { name: name.trim() || undefined, dob, sign };
    setProfile(nextProfile);
    saveLocal("home:profile", nextProfile);

    const dateKey = todayKey();

    const res = await enrich({
      data: {
        birthDate: dob,
        sign: sign as never,
        name: name.trim() || undefined,
        dateKey,
      },
    });

    if (!res.ok || !res.briefing) {
      setError(res.message ?? "Most nem tudtam összeállítani a mai olvasatot. Próbáld meg pár perc múlva.");
      setLoading(false);
      trackEvent("roxy_fallback_used", { domain: "daily_briefing" });
      return;
    }
    trackEvent(res.cached ? "roxy_cache_hit" : "roxy_cache_miss", { domain: "daily_briefing" });

    const lp = lifePath(dob);
    const lpInfo = lifePathInfo(lp);
    const py = personalYear(dob);
    const pyInfo = lifePathInfo(py);

    const stored: StoredBriefing = {
      ...res.briefing,
      generatedFor: dateKey,
      lifePathNum: lp,
      lifePathTitle: lpInfo.title,
      personalYearNum: py,
      personalYearMeaning: pyInfo.meaning,
    };

    setBriefing(stored);
    saveLocal("home:briefing", stored);
    setEditing(false);
    setLoading(false);
    trackEvent("daily_compass_completed", { from: "home" });
  }

  const hasProfile = !!(profile.dob && profile.sign);
  const showForm = !hasProfile || editing;

  return (
    <section className="mx-auto max-w-5xl px-4 md:px-6 pt-2 pb-8">
      <div className="text-center mb-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.8)]">Mai személyes olvasatod</div>
        <p className="font-editorial text-ivory/70 mt-2 max-w-xl mx-auto text-sm">
          {hasProfile && briefing
            ? "A mai jeleid egy helyen, neked összeállítva."
            : "Add meg a születési dátumod — a csillagjegyed ebből kiszámolom, és összeállítok egy mai olvasatot rád szabva."}
        </p>
      </div>

      {showForm && (
        <form onSubmit={build} className="surface p-5 md:p-6 space-y-4 max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ivory/80 mb-2">
                Keresztnév <span className="text-ivory/45">(opcionális)</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Pl. Anna"
                className="w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none"
              />
            </div>
            <HUDateInput value={dob} onChange={setDob} label="Születési dátum" required />
          </div>
          {dob && zodiacFromDob(dob) && (
            <div className="text-xs text-ivory/60 font-editorial">
              Csillagjegyed: <span className="text-gold">{SIGN_HU[zodiacFromDob(dob)!]}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-gold" disabled={loading || !dob}>
              {loading ? "Egy pillanat…" : briefing ? "Frissítem az olvasatot" : "Mai személyes olvasatom"}
            </button>
            {hasProfile && (
              <button
                type="button"
                className="text-xs text-ivory/55 hover:text-gold"
                onClick={() => { setEditing(false); setError(null); }}
              >
                Mégse
              </button>
            )}
            <span className="text-xs text-ivory/45 font-editorial">
              Az adataidat csak a böngésződben tároljuk.
            </span>
          </div>
          {error && (
            <div className="text-sm text-ivory/70 font-editorial border-l-2 border-gold/40 pl-3">
              {error}
            </div>
          )}
        </form>
      )}

      {!showForm && briefing && (
        <div className="space-y-5">
          <div className="surface p-5 md:p-6 text-center">
            <Eyebrow>
              {profile.name ? `${profile.name}, a mai napod` : "A mai napod"}{" "}
              · {SIGN_HU[profile.sign ?? "aries"]}
            </Eyebrow>
            <p className="font-display text-2xl md:text-3xl text-gold-gradient leading-snug mt-1">
              {briefing.oneLine}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Tile eyebrow="Mai lapod">
              <div className="font-display text-ivory text-lg mb-1">{briefing.cardTitle}</div>
              <div className="text-ivory/85">{briefing.cardLine}</div>
            </Tile>
            <Tile eyebrow="Hangulat">{briefing.horoMood}</Tile>
            <Tile eyebrow="Szerelemben">{briefing.horoLove}</Tile>
            <Tile eyebrow="Munkában, ügyekben">{briefing.horoWork}</Tile>
            <Tile eyebrow="Mire figyelj">{briefing.horoWarn}</Tile>
            {briefing.bioLine && (
              <Tile eyebrow="Belső ritmus">{briefing.bioLine}</Tile>
            )}
            {briefing.angelTitle && (
              <Tile eyebrow="Mai szám">
                <div className="font-display text-ivory text-lg mb-1">{briefing.angelTitle}</div>
                {briefing.angelMessage && <div className="text-ivory/85">{briefing.angelMessage}</div>}
              </Tile>
            )}
            {briefing.crystalName && (
              <Tile eyebrow="Mai kristály">
                <div className="font-display text-ivory text-lg mb-1">{briefing.crystalName}</div>
                {briefing.crystalLine && <div className="text-ivory/75 italic">{briefing.crystalLine}</div>}
              </Tile>
            )}
            <Tile eyebrow={`Sorsszámod · ${briefing.lifePathNum}`}>
              <div className="font-display text-ivory text-lg mb-1">{briefing.lifePathTitle}</div>
              <div className="text-ivory/75 text-[14px]">
                Bővebb olvasat:{" "}
                <Link to="/szammisztika" className="text-gold hover:underline">sorsszám</Link>.
              </div>
            </Tile>
            <Tile eyebrow={`Idei személyes éved · ${briefing.personalYearNum}`}>
              {briefing.personalYearMeaning}
            </Tile>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <button className="btn-ghost-gold" onClick={() => setEditing(true)}>
              Adatok módosítása
            </button>
            <Link to="/mai-iranytu" className="btn-ghost-gold">Bővebb napi iránytű →</Link>
            <Link to="/szammisztika" className="btn-ghost-gold">Bővebb sorsszám →</Link>
          </div>
        </div>
      )}
    </section>
  );
}
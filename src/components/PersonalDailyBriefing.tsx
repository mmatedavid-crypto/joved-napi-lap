// Personal daily briefing rendered at the top of the homepage. Combines
// several Roxy server-fns (tarot daily, daily horoscope, biorhythm, angel
// number-of-the-day, birthstone) with local Hungarian numerology to give
// a single, personal, multi-block reading per user per day.
//
// All Roxy data is normalized through src/lib/roxyNormalize.ts; no raw
// English copy is ever shown — every line of text comes from local HU
// libraries. If the API fails, the briefing degrades to local fallbacks.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HUDateInput } from "./HUDateInput";
import {
  roxyTarotDaily, roxyDailyHoroscope, roxyBiorhythmDaily,
  roxyAngelNumberLookup, roxyCrystalBirthstone,
} from "@/lib/roxy.functions";
import {
  SIGN_HU,
  normalizeRoxyDraw, normalizeRoxyHoroscope, normalizeRoxyBiorhythm,
  normalizeRoxyAngel, normalizeRoxyCrystal, moonPhaseHU, bioPhraseHU,
  zodiacFromDob,
} from "@/lib/roxyNormalize";
import { CARDS } from "@/data/cards";
import { lifePath, lifePathInfo, personalYear } from "@/lib/numerology";
import { localHoroscope, luckyColorHU, energyPhraseHU } from "@/lib/horoscope.hu";
import { angelMeaning } from "@/lib/angel.hu";
import { crystalMeaning, FALLBACK_BIRTHSTONE } from "@/lib/crystal.hu";
import { loadLocal, saveLocal, todayKey } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";

type Profile = { name?: string; dob?: string; sign?: string };

type Briefing = {
  generatedFor: string;          // dateKey
  cardName: string;
  cardDaily: string;
  cardGeneral: string;
  horoMood: string;
  horoLove: string;
  horoWork: string;
  horoWarn: string;
  horoOneLine: string;
  moon?: string;
  energy?: string;
  luckyColor?: string;
  bioLine?: string;
  bioDetail?: { physical?: number; emotional?: number; intellectual?: number };
  angelTitle?: string;
  angelMessage?: string;
  angelNumber: string;
  crystalName: string;
  crystalLine: string;
  lifePathNum?: number;
  lifePathTitle?: string;
  personalYearNum?: number;
  personalYearMeaning?: string;
  oneLine: string;
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
  const tarot = useServerFn(roxyTarotDaily);
  const horo = useServerFn(roxyDailyHoroscope);
  const bio = useServerFn(roxyBiorhythmDaily);
  const angel = useServerFn(roxyAngelNumberLookup);
  const crys = useServerFn(roxyCrystalBirthstone);

  const [profile, setProfile] = useState<Profile>({});
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [editing, setEditing] = useState(false);

  // Load profile + any cached briefing for today.
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
    const cached = loadLocal<Briefing>("home:briefing");
    if (cached && cached.generatedFor === todayKey()) {
      setBriefing(cached);
    }
  }, []);

  async function build(e?: React.FormEvent) {
    e?.preventDefault();
    const sign = zodiacFromDob(dob);
    if (!dob || !sign) return;
    setLoading(true);
    trackEvent("daily_compass_opened", { from: "home" });
    const nextProfile: Profile = { name: name.trim() || undefined, dob, sign };
    setProfile(nextProfile);
    saveLocal("home:profile", nextProfile);

    const dateKey = todayKey();
    const month = Number(dateKey.slice(5, 7));
    const digits = dateKey.replace(/-/g, "");

    // Local-first defaults so we always have something to render.
    const localHoro = localHoroscope(sign);
    const lp = lifePath(dob);
    const lpInfo = lifePathInfo(lp);
    const py = personalYear(dob);
    const pyInfo = lifePathInfo(py);

    const out: Briefing = {
      generatedFor: dateKey,
      cardName: "",
      cardDaily: "",
      cardGeneral: "",
      horoMood: localHoro.mood,
      horoLove: localHoro.love,
      horoWork: localHoro.work,
      horoWarn: localHoro.warn,
      horoOneLine: localHoro.oneLine,
      angelNumber: digits,
      crystalName: FALLBACK_BIRTHSTONE[month],
      crystalLine: crystalMeaning(FALLBACK_BIRTHSTONE[month]).m.oneLine,
      lifePathNum: lp,
      lifePathTitle: lpInfo.title,
      personalYearNum: py,
      personalYearMeaning: pyInfo.meaning,
      oneLine: localHoro.oneLine,
    };

    // Fire all Roxy calls in parallel; never let any single failure block the rest.
    const [tarotRes, horoRes, bioRes, angelRes, crysRes] = await Promise.allSettled([
      tarot({ data: { dateKey } }),
      horo({ data: { sign: sign as never, dateKey } }),
      bio({ data: { birthDate: dob, date: dateKey } }),
      angel({ data: { number: digits } }),
      crys({ data: { month } }),
    ]);

    // Tarot
    if (tarotRes.status === "fulfilled" && tarotRes.value.ok) {
      const drawn = normalizeRoxyDraw(tarotRes.value.data)[0];
      const local = drawn?.localId ? CARDS.find((c) => c.id === drawn.localId) : null;
      const cardFinal = local ?? CARDS[Math.abs([...dateKey].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % CARDS.length];
      out.cardName = cardFinal.name;
      out.cardDaily = cardFinal.daily;
      out.cardGeneral = cardFinal.general;
      trackEvent(tarotRes.value.cached ? "roxy_cache_hit" : "roxy_cache_miss", { domain: "tarot" });
    } else {
      const fallback = CARDS[Math.abs([...dateKey].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % CARDS.length];
      out.cardName = fallback.name;
      out.cardDaily = fallback.daily;
      out.cardGeneral = fallback.general;
      trackEvent("roxy_fallback_used", { domain: "tarot" });
    }

    // Horoscope (only Roxy numeric signals influence the wording)
    if (horoRes.status === "fulfilled" && horoRes.value.ok) {
      const n = normalizeRoxyHoroscope(horoRes.value.data);
      const moon = moonPhaseHU(n.moonPhase);
      if (moon) out.moon = moon;
      const en = energyPhraseHU(n.energyRating);
      if (en) out.energy = en;
      const col = luckyColorHU(n.luckyColor);
      if (col) out.luckyColor = col;
      trackEvent(horoRes.value.cached ? "roxy_cache_hit" : "roxy_cache_miss", { domain: "horoscope" });
    } else {
      trackEvent("roxy_fallback_used", { domain: "horoscope" });
    }

    // Biorhythm
    if (bioRes.status === "fulfilled" && bioRes.value.ok) {
      const n = normalizeRoxyBiorhythm(bioRes.value.data);
      const vals = [n.physical, n.emotional, n.intellectual].filter((x): x is number => typeof x === "number");
      if (vals.length) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        out.bioLine = bioPhraseHU(avg);
        out.bioDetail = { physical: n.physical, emotional: n.emotional, intellectual: n.intellectual };
      }
      trackEvent(bioRes.value.cached ? "roxy_cache_hit" : "roxy_cache_miss", { domain: "biorhythm" });
    } else {
      trackEvent("roxy_fallback_used", { domain: "biorhythm" });
    }

    // Angel number-of-the-day
    if (angelRes.status === "fulfilled" && angelRes.value.ok) {
      const n = normalizeRoxyAngel(angelRes.value.data);
      const m = angelMeaning(digits, n.rootNumber);
      out.angelTitle = m.title;
      out.angelMessage = m.message;
      trackEvent(angelRes.value.cached ? "roxy_cache_hit" : "roxy_cache_miss", { domain: "angel" });
    } else {
      const m = angelMeaning(digits);
      out.angelTitle = m.title;
      out.angelMessage = m.message;
      trackEvent("roxy_fallback_used", { domain: "angel" });
    }

    // Crystal
    if (crysRes.status === "fulfilled" && crysRes.value.ok) {
      const cn = normalizeRoxyCrystal(crysRes.value.data).hungarianName;
      if (cn) {
        out.crystalName = cn;
        out.crystalLine = crystalMeaning(cn).m.oneLine;
      }
      trackEvent(crysRes.value.cached ? "roxy_cache_hit" : "roxy_cache_miss", { domain: "crystal" });
    } else {
      trackEvent("roxy_fallback_used", { domain: "crystal" });
    }

    // Compose one-line summary
    if (out.bioLine && out.moon) {
      out.oneLine = `${out.moon} alatt: ${out.bioLine}.`;
    } else if (out.bioLine) {
      out.oneLine = `${out.bioLine.charAt(0).toUpperCase()}${out.bioLine.slice(1)}.`;
    } else if (out.moon) {
      out.oneLine = `${out.moon} — figyelj a finomságokra.`;
    } else {
      out.oneLine = localHoro.oneLine;
    }

    setBriefing(out);
    saveLocal("home:briefing", out);
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
                onClick={() => setEditing(false)}
              >
                Mégse
              </button>
            )}
            <span className="text-xs text-ivory/45 font-editorial">
              Az adataidat csak a böngésződben tároljuk.
            </span>
          </div>
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
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ivory/65 font-editorial">
              {briefing.energy && <span>{briefing.energy}</span>}
              {briefing.moon && <span>· {briefing.moon}</span>}
              {briefing.luckyColor && <span>· szerencseszín: {briefing.luckyColor}</span>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Tile eyebrow="Mai lapod">
              <div className="font-display text-ivory text-lg mb-1">{briefing.cardName}</div>
              <div className="text-ivory/85">{briefing.cardDaily}</div>
              <div className="text-ivory/65 mt-2 text-[14px]">{briefing.cardGeneral}</div>
            </Tile>
            <Tile eyebrow="Hangulat">{briefing.horoMood}</Tile>
            <Tile eyebrow="Szerelemben">{briefing.horoLove}</Tile>
            <Tile eyebrow="Munkában, ügyekben">{briefing.horoWork}</Tile>
            <Tile eyebrow="Mire figyelj">{briefing.horoWarn}</Tile>
            {briefing.bioLine && (
              <Tile eyebrow="Belső ritmus">
                <div>{briefing.bioLine.charAt(0).toUpperCase() + briefing.bioLine.slice(1)}.</div>
                {briefing.bioDetail && (
                  <div className="mt-2 text-[13px] text-ivory/55">
                    {typeof briefing.bioDetail.physical === "number" && <>test: {Math.round(briefing.bioDetail.physical * 100)}% · </>}
                    {typeof briefing.bioDetail.emotional === "number" && <>érzelem: {Math.round(briefing.bioDetail.emotional * 100)}% · </>}
                    {typeof briefing.bioDetail.intellectual === "number" && <>elme: {Math.round(briefing.bioDetail.intellectual * 100)}%</>}
                  </div>
                )}
              </Tile>
            )}
            {briefing.angelTitle && (
              <Tile eyebrow={`Mai szám · ${briefing.angelNumber}`}>
                <div className="font-display text-ivory text-lg mb-1">{briefing.angelTitle}</div>
                <div className="text-ivory/85">{briefing.angelMessage}</div>
              </Tile>
            )}
            <Tile eyebrow="Mai kristály">
              <div className="font-display text-ivory text-lg mb-1">{briefing.crystalName}</div>
              <div className="text-ivory/75 italic">{briefing.crystalLine}</div>
            </Tile>
            {briefing.lifePathNum != null && (
              <Tile eyebrow={`Sorsszámod · ${briefing.lifePathNum}`}>
                <div className="font-display text-ivory text-lg mb-1">{briefing.lifePathTitle}</div>
                <div className="text-ivory/75 text-[14px]">
                  Bővebb olvasat:{" "}
                  <Link to="/szammisztika" className="text-gold hover:underline">sorsszám</Link>.
                </div>
              </Tile>
            )}
            {briefing.personalYearNum != null && (
              <Tile eyebrow={`Idei személyes éved · ${briefing.personalYearNum}`}>
                {briefing.personalYearMeaning}
              </Tile>
            )}
            <Tile eyebrow="Egy mondatban">
              <em>{briefing.horoOneLine}</em>
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
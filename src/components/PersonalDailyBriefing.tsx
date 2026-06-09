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
import { SpreadDeck } from "./SpreadDeck";
import { CardFace } from "./TarotCard";
import { StreamingText } from "./StreamingText";
import { ShareCardButton } from "./ShareCardButton";
import { CARDS, type TarotCard } from "@/data/cards";
import { roxyPersonalDailyBriefing, type PersonalBriefingHU } from "@/lib/roxy.functions";
import { SIGN_HU, zodiacFromDob } from "@/lib/roxyNormalize";
import { lifePath, lifePathInfo, personalYear } from "@/lib/numerology";
import { loadLocal, saveLocal, todayKey } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { getGuestReadingContext, recordGuestReadingMemory } from "@/lib/guestReadingMemory";

type Profile = { name?: string; dob?: string; sign?: string };

type StoredBriefing = PersonalBriefingHU & {
  generatedFor: string;
  lifePathNum: number;
  lifePathTitle: string;
  personalYearNum: number;
  personalYearMeaning: string;
  drawnCardId: string;
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
  const [phase, setPhase] = useState<"draw" | "card" | "result">("draw");
  const [drawnCard, setDrawnCard] = useState<TarotCard | null>(null);
  const [drawResetKey, setDrawResetKey] = useState(0);

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
    if (cached && cached.generatedFor === todayKey()) {
      setBriefing(cached);
      const c = CARDS.find((x) => x.id === cached.drawnCardId) ?? null;
      if (c) setDrawnCard(c);
      setPhase("result");
    }
  }, []);

  function onCardDrawn(card: TarotCard) {
    setDrawnCard(card);
    setPhase("card");
    trackEvent("daily_card_revealed", { cardId: card.id, from: "home" });
  }

  async function enrichWithProfile(e?: React.FormEvent) {
    e?.preventDefault();
    if (!drawnCard) return;
    const sign = zodiacFromDob(dob);
    if (!dob || !sign) return;
    setLoading(true);
    setError(null);
    const nextProfile: Profile = { name: name.trim() || undefined, dob, sign };
    setProfile(nextProfile);
    saveLocal("home:profile", nextProfile);
    trackEvent("daily_compass_opened", { from: "home" });

    const dateKey = todayKey();
    const guestMemory = getGuestReadingContext({ limit: 6 });
    const memoryContext =
      guestMemory.contextText || guestMemory.insightText || guestMemory.themeSummary || undefined;

    const res = await enrich({
      data: {
        birthDate: dob,
        sign: sign as never,
        name: name.trim() || undefined,
        dateKey,
        memoryContext,
        drawnCard: {
          id: drawnCard.id,
          name: drawnCard.name,
          keywords: drawnCard.keywords,
          general: drawnCard.general,
          daily: drawnCard.daily,
        },
      },
    });

    if (!res.ok || !res.briefing) {
      setError(
        res.message ?? "Most nem tudtam összeállítani a mai olvasatot. Próbáld meg pár perc múlva.",
      );
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
      drawnCardId: drawnCard.id,
    };

    setBriefing(stored);
    saveLocal("home:briefing", stored);
    recordGuestReadingMemory({
      readingType: "daily_compass",
      topic: "mai iránytű",
      sourceRoute: "/",
      title: stored.cardTitle,
      summary: [stored.oneLine, stored.cardLine, stored.horoMood].filter(Boolean).join(" "),
      oneSentence: stored.oneLine,
      anchors: [
        drawnCard.name,
        SIGN_HU[sign],
        stored.crystalName,
        `sorsszám ${lp}`,
        `személyes év ${py}`,
      ],
    });
    setLoading(false);
    setPhase("result");
    trackEvent("daily_compass_completed", { from: "home" });
  }

  function resetAll() {
    setBriefing(null);
    setDrawnCard(null);
    setError(null);
    setDrawResetKey((k) => k + 1);
    setPhase("draw");
  }

  const showDraw = phase === "draw";
  const showCardOnly = phase === "card" && !!drawnCard;
  const showResult = phase === "result" && !!briefing && !!drawnCard;

  return (
    <section className="mx-auto max-w-5xl px-4 md:px-6 pt-2 pb-8">
      <div className="text-center mb-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.8)]">
          Mai személyes olvasatod
        </div>
        <p className="font-editorial text-ivory/70 mt-2 max-w-xl mx-auto text-sm">
          {showResult
            ? "A mai jeleid egy helyen, neked összeállítva."
            : showCardOnly
              ? "Itt a mai lapod. Ha szeretnél személyre szabottabb olvasatot, add meg a születési dátumod."
              : "Húzz egy lapot — ez lesz a mai lapod. Utána, ha szeretnéd, személyre szabhatod."}
        </p>
      </div>

      {showDraw && (
        <SpreadDeck
          count={1}
          resetKey={drawResetKey}
          onComplete={(cards) => onCardDrawn(cards[0])}
        />
      )}

      {showCardOnly && drawnCard && (
        <div className="space-y-5">
          <div className="grid md:grid-cols-[200px,1fr] gap-5 items-start surface p-5 md:p-6 max-w-3xl mx-auto">
            <div className="mx-auto w-full max-w-[200px]">
              <CardFace card={drawnCard} />
            </div>
            <div className="space-y-3">
              <Eyebrow>A mai lapod</Eyebrow>
              <div className="font-display text-ivory text-2xl">{drawnCard.name}</div>
              <div className="font-editorial text-ivory/85 text-[15.5px] leading-relaxed">
                {drawnCard.general}
              </div>
              <div className="text-ivory/75 font-editorial text-[14.5px] italic">
                {drawnCard.daily}
              </div>
            </div>
          </div>

          <form
            onSubmit={enrichWithProfile}
            className="surface p-5 md:p-6 space-y-4 max-w-2xl mx-auto"
          >
            <Eyebrow>Személyre szabás (opcionális)</Eyebrow>
            <p className="font-editorial text-ivory/70 text-sm">
              Add meg a születési dátumod, és ezt a lapot a horoszkópoddal, belső ritmusoddal és a
              mai kristályoddal együtt fűzöm össze.
            </p>
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
                {loading ? "Egy pillanat…" : "Személyes olvasatom"}
              </button>
              <button
                type="button"
                className="text-xs text-ivory/55 hover:text-gold"
                onClick={resetAll}
              >
                Új lap húzása
              </button>
            </div>
            {error && (
              <div className="text-sm text-ivory/70 font-editorial border-l-2 border-gold/40 pl-3">
                {error}
              </div>
            )}
          </form>
        </div>
      )}

      {showResult && briefing && (
        <div className="space-y-5">
          <div className="surface p-5 md:p-6 text-center">
            <Eyebrow>
              {profile.name ? `${profile.name}, a mai napod` : "A mai napod"} ·{" "}
              {SIGN_HU[profile.sign ?? "aries"]}
            </Eyebrow>
            <StreamingText
              as="p"
              text={briefing.oneLine}
              className="font-display text-2xl md:text-3xl text-gold-gradient leading-snug mt-1"
            />
          </div>

          {drawnCard && (
            <div className="grid md:grid-cols-[200px,1fr] gap-5 items-start surface p-5 md:p-6">
              <div className="mx-auto w-full max-w-[200px]">
                <CardFace card={drawnCard} />
              </div>
              <div className="space-y-2">
                <Eyebrow>A mai lapod</Eyebrow>
                <div className="font-display text-ivory text-2xl">{briefing.cardTitle}</div>
                <StreamingText
                  text={briefing.cardLine}
                  className="font-editorial text-ivory/85 text-[15.5px] leading-relaxed"
                />
                <div className="pt-2">
                  <ShareCardButton
                    card={drawnCard}
                    oneLine={briefing.oneLine}
                    eyebrow="A mai lapod"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Tile eyebrow="Hangulat">{briefing.horoMood}</Tile>
            <Tile eyebrow="Szerelemben">{briefing.horoLove}</Tile>
            <Tile eyebrow="Munkában, ügyekben">{briefing.horoWork}</Tile>
            <Tile eyebrow="Mire figyelj">{briefing.horoWarn}</Tile>
            {briefing.bioLine && <Tile eyebrow="Belső ritmus">{briefing.bioLine}</Tile>}
            {briefing.angelTitle && (
              <Tile eyebrow="Mai szám">
                <div className="font-display text-ivory text-lg mb-1">{briefing.angelTitle}</div>
                {briefing.angelMessage && (
                  <div className="text-ivory/85">{briefing.angelMessage}</div>
                )}
              </Tile>
            )}
            {briefing.crystalName && (
              <Tile eyebrow="Mai kristály">
                <div className="font-display text-ivory text-lg mb-1">{briefing.crystalName}</div>
                {briefing.crystalLine && (
                  <div className="text-ivory/75 italic">{briefing.crystalLine}</div>
                )}
              </Tile>
            )}
            <Tile eyebrow={`Sorsszámod · ${briefing.lifePathNum}`}>
              <div className="font-display text-ivory text-lg mb-1">{briefing.lifePathTitle}</div>
              <div className="text-ivory/75 text-[14px]">
                Bővebb olvasat:{" "}
                <Link to="/szammisztika" className="text-gold hover:underline">
                  sorsszám
                </Link>
                .
              </div>
            </Tile>
            <Tile eyebrow={`Idei személyes éved · ${briefing.personalYearNum}`}>
              {briefing.personalYearMeaning}
            </Tile>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <button className="btn-ghost-gold" onClick={resetAll}>
              Új lap húzása
            </button>
            <Link to="/mai-iranytu" className="btn-ghost-gold">
              Bővebb napi iránytű →
            </Link>
            <Link to="/szammisztika" className="btn-ghost-gold">
              Bővebb sorsszám →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

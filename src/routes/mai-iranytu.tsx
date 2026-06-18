import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { HUDateInput } from "@/components/HUDateInput";
import {
  roxyTarotDaily,
  roxyDailyHoroscope,
  roxyBiorhythmDaily,
  roxyAngelNumberLookup,
  roxyCrystalBirthstone,
} from "@/lib/roxy.functions";
import {
  SIGNS_HU_ORDERED,
  SIGN_HU,
  normalizeRoxyDraw,
  normalizeRoxyHoroscope,
  normalizeRoxyBiorhythm,
  normalizeRoxyAngel,
  normalizeRoxyCrystal,
  moonPhaseHU,
  bioPhraseHU,
} from "@/lib/roxyNormalize";
import { CARDS } from "@/data/cards";
import { personalYear } from "@/lib/numerology";
import { angelMeaning } from "@/lib/angel.hu";
import { crystalMeaning, FALLBACK_BIRTHSTONE } from "@/lib/crystal.hu";
import { todayKey, loadLocal, saveLocal } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { PaywallDialog } from "@/components/PaywallDialog";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { productCtaLabel } from "@/lib/products";
import { SITE_LEGAL } from "@/lib/legal";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { SmartReadingFollowup } from "@/components/SmartReadingFollowup";

export const Route = createFileRoute("/mai-iranytu")({
  head: () => ({
    meta: [
      { title: "Mai iránytű — napi rituálé | Jövőd.hu" },
      {
        name: "description",
        content:
          "Mai iránytűd: napi lap, mai szám, holdjel, belső ritmus és egy kristály — rövid, csendes napi rituálé.",
      },
      { property: "og:title", content: "Mai iránytű | Jövőd.hu" },
      {
        property: "og:description",
        content: "Egy összefogott napi olvasat — rövid, lényegre törő.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/mai-iranytu` }],
  }),
  component: Page,
});

type Compass = {
  cardName?: string;
  personalYear?: number;
  angelTitle?: string;
  moon?: string;
  bio?: string;
  crystalName?: string;
  crystalLine?: string;
  oneLine: string;
};

type Stored = { dob?: string; name?: string; sign?: string };

function rememberDailyCompass(out: Compass, sign: string, focus: string) {
  const signName = sign ? SIGN_HU[sign as keyof typeof SIGN_HU] : undefined;
  recordGuestReadingMemory({
    readingType: "daily_compass",
    topic: "mai iránytű",
    question: focus.trim() || undefined,
    situation: focus.trim() || signName,
    sourceRoute: "/mai-iranytu",
    title: signName ? `Mai iránytű · ${signName}` : "Mai iránytű",
    summary:
      [
        out.oneLine,
        out.cardName ? `Mai lap: ${out.cardName}` : undefined,
        out.moon ? `Holdjel: ${out.moon}` : undefined,
        out.bio ? `Belső ritmus: ${out.bio}` : undefined,
        out.crystalName ? `Mai jel: ${out.crystalName}` : undefined,
      ]
        .filter(Boolean)
        .join(" ") || "Mai iránytű olvasat.",
    oneSentence: out.oneLine,
    anchors: [out.cardName, out.moon, out.bio, out.crystalName, signName],
  });
}

function Page() {
  const tarot = useServerFn(roxyTarotDaily);
  const horo = useServerFn(roxyDailyHoroscope);
  const bio = useServerFn(roxyBiorhythmDaily);
  const angel = useServerFn(roxyAngelNumberLookup);
  const crys = useServerFn(roxyCrystalBirthstone);

  const stored = loadLocal<Stored>("compass:last") ?? loadLocal<Stored>("numerology:last") ?? {};
  const [dob, setDob] = useState<string>(stored.dob ?? "");
  const [name, setName] = useState<string>(stored.name ?? "");
  const [sign, setSign] = useState<string>(stored.sign ?? "");
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [c, setC] = useState<Compass | null>(null);
  const [paywall, setPaywall] = useState(false);

  async function build(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    trackEvent("daily_compass_opened");
    saveLocal("compass:last", { dob, name, sign });
    const out: Compass = { oneLine: "Kis dolgokra figyelj, azok rendezik a napodat." };
    const dateKey = todayKey();

    // Tarot daily (deterministic per date)
    try {
      const r = await tarot({ data: { dateKey } });
      if (r.ok) {
        const drawn = normalizeRoxyDraw(r.data)[0];
        if (drawn?.localId) {
          const local = CARDS.find((x) => x.id === drawn.localId);
          if (local) out.cardName = local.name;
        }
        if (r.cached) {
          trackEvent("knowledge_cache_hit", { domain: "tarot" });
        } else {
          trackEvent("knowledge_cache_miss", { domain: "tarot" });
        }
      } else trackEvent("local_meaning_used", { domain: "tarot" });
    } catch {
      trackEvent("local_meaning_used", { domain: "tarot" });
    }
    if (!out.cardName) {
      // local fallback: pick deterministically by date
      const idx = Math.abs([...dateKey].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % CARDS.length;
      out.cardName = CARDS[idx].name;
    }

    // Horoscope (needs sign)
    if (sign) {
      try {
        const r = await horo({ data: { sign: sign as never, dateKey } });
        if (r.ok) {
          const n = normalizeRoxyHoroscope(r.data);
          const m = moonPhaseHU(n.moonPhase);
          if (m) out.moon = m;
          if (r.cached) {
            trackEvent("knowledge_cache_hit", { domain: "horoscope" });
          } else {
            trackEvent("knowledge_cache_miss", { domain: "horoscope" });
          }
        } else trackEvent("local_meaning_used", { domain: "horoscope" });
      } catch {
        trackEvent("local_meaning_used", { domain: "horoscope" });
      }
    }

    // Biorhythm + personal year (need dob)
    if (dob) {
      try {
        const r = await bio({ data: { birthDate: dob, date: dateKey } });
        if (r.ok) {
          const n = normalizeRoxyBiorhythm(r.data);
          const avg = [n.physical, n.emotional, n.intellectual].filter(
            (x): x is number => typeof x === "number",
          );
          if (avg.length) {
            const v = avg.reduce((a, b) => a + b, 0) / avg.length;
            out.bio = bioPhraseHU(v);
          }
          if (r.cached) {
            trackEvent("knowledge_cache_hit", { domain: "biorhythm" });
          } else {
            trackEvent("knowledge_cache_miss", { domain: "biorhythm" });
          }
        } else trackEvent("local_meaning_used", { domain: "biorhythm" });
      } catch {
        trackEvent("local_meaning_used", { domain: "biorhythm" });
      }
      out.personalYear = personalYear(dob);

      // Angel number-of-the-day (sum of date digits)
      const digits = dateKey.replace(/-/g, "");
      try {
        const r = await angel({ data: { number: digits } });
        if (r.ok) {
          const n = normalizeRoxyAngel(r.data);
          const root = n.rootNumber;
          out.angelTitle = angelMeaning(digits, root).title;
          if (r.cached) {
            trackEvent("knowledge_cache_hit", { domain: "angel" });
          } else {
            trackEvent("knowledge_cache_miss", { domain: "angel" });
          }
        } else {
          trackEvent("local_meaning_used", { domain: "angel" });
          out.angelTitle = angelMeaning(digits).title;
        }
      } catch {
        trackEvent("local_meaning_used", { domain: "angel" });
        out.angelTitle = angelMeaning(digits).title;
      }
    }

    // Crystal by current month
    const month = new Date().getMonth() + 1;
    try {
      const r = await crys({ data: { month } });
      if (r.ok) {
        const cn = normalizeRoxyCrystal(r.data).hungarianName;
        if (cn) out.crystalName = cn;
        if (r.cached) {
          trackEvent("knowledge_cache_hit", { domain: "crystal" });
        } else {
          trackEvent("knowledge_cache_miss", { domain: "crystal" });
        }
      } else trackEvent("local_meaning_used", { domain: "crystal" });
    } catch {
      trackEvent("local_meaning_used", { domain: "crystal" });
    }
    if (!out.crystalName) out.crystalName = FALLBACK_BIRTHSTONE[month];
    out.crystalLine = crystalMeaning(out.crystalName).m.oneLine;

    // One-liner blends what we have
    if (out.bio && out.moon) out.oneLine = `${out.moon} alatt: ${out.bio}.`;
    else if (out.bio) out.oneLine = `${out.bio.charAt(0).toUpperCase()}${out.bio.slice(1)}.`;
    else if (out.moon) out.oneLine = `${out.moon} — figyelj a finomságokra.`;

    setC(out);
    rememberDailyCompass(out, sign, focus);
    setLoading(false);
    trackEvent("daily_compass_completed");
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Mai iránytű"
        title="A mai napod röviden"
        lead="Tarot, számminta, holdjel és kristály hagyományos jeleiből induló napi fókusz. Nem jóslat, hanem józan önismereti irány."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-6">
        <form onSubmit={build} className="surface p-6 space-y-4">
          <div>
            <label className="block text-sm text-ivory/80 mb-2">
              Keresztnév <span className="text-ivory/45">(opcionális)</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none"
            />
          </div>
          <HUDateInput value={dob} onChange={setDob} label="Születési dátum (opcionális)" />
          <div>
            <label htmlFor="daily-focus" className="block text-sm text-ivory/80 mb-2">
              Mi foglalkoztat ma? <span className="text-ivory/45">(opcionális)</span>
            </label>
            <input
              id="daily-focus"
              value={focus}
              onChange={(e) => setFocus(e.target.value.slice(0, 160))}
              placeholder="Pl. egy beszélgetés, munkahelyi döntés, belső nyugtalanság"
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-ivory/80 mb-2">
              Csillagjegy <span className="text-ivory/45">(opcionális)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setSign("")}
                className={`px-2 py-2 rounded-md border text-sm ${sign === "" ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/70"}`}
              >
                —
              </button>
              {SIGNS_HU_ORDERED.map((sg) => (
                <button
                  type="button"
                  key={sg}
                  onClick={() => setSign(sg)}
                  className={`px-2 py-2 rounded-md border text-sm ${sign === sg ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                >
                  {SIGN_HU[sg]}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-gold" disabled={loading}>
            {loading ? "Egy pillanat…" : "Mai iránytű"}
          </button>
        </form>

        {loading && !c && <ReadingLoadingState kind="daily" title="A mai iránytű készül" />}

        <GuestMemoryInsightPanel
          readingType="daily_compass"
          topic="mai iránytű"
          situation={focus.trim() || (sign ? SIGN_HU[sign as keyof typeof SIGN_HU] : undefined)}
        />

        {c && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {c.cardName && <Section eyebrow="Mai lap">{c.cardName}</Section>}
              {focus.trim() && (
                <Section eyebrow="A mai fókuszod">{dailyFocusReflection(focus, c)}</Section>
              )}
              {c.angelTitle && <Section eyebrow="Mai szám">{c.angelTitle}</Section>}
              {c.moon && <Section eyebrow="Holdjel">{c.moon}</Section>}
              {c.bio && (
                <Section eyebrow="Belső ritmus">
                  {c.bio.charAt(0).toUpperCase() + c.bio.slice(1)}.
                </Section>
              )}
              {c.crystalName && (
                <Section eyebrow="Mai jel">
                  {c.crystalName} — <em className="text-ivory/70">{c.crystalLine}</em>
                </Section>
              )}
              {c.personalYear && (
                <Section eyebrow="Személyes éved">
                  Ez a {c.personalYear}-es személyes éved napja.
                </Section>
              )}
              <Section eyebrow="Egy mondatban a napod">
                <em>{c.oneLine}</em>
              </Section>
            </div>
            <div className="text-center pt-4 border-t border-[oklch(0.78_0.10_80/0.15)] mt-2">
              <div className="text-sm text-ivory/70 mb-2">
                Részletes, személyre szabott üzenet a mai napodhoz?
              </div>
              <button className="btn-gold" onClick={() => setPaywall(true)}>
                {productCtaLabel("Kérem", "mai_iranytu_ai")}
              </button>
            </div>
            <SmartReadingFollowup
              intent="daily"
              readingType="daily_compass"
              topic="mai iránytű"
              situation={focus.trim() || (sign ? SIGN_HU[sign as keyof typeof SIGN_HU] : undefined)}
              question={focus.trim() || undefined}
              sourceRoute="/mai-iranytu"
              inputPayload={{
                dob,
                name,
                sign,
                question: focus.trim() || undefined,
                situation: focus.trim() || undefined,
                ...c,
              }}
            />
          </div>
        )}
      </div>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="mai_iranytu_ai"
        sourceRoute="/mai-iranytu"
        inputPayload={{
          dob,
          name,
          sign,
          question: focus.trim() || undefined,
          situation: focus.trim() || undefined,
          ...(c ?? {}),
        }}
      />
    </Layout>
  );
}

function dailyFocusReflection(focus: string, compass: Compass): string {
  const clean = focus.trim();
  const lower = clean.toLocaleLowerCase("hu-HU");
  const cardPart = compass.cardName ? `A mai lapod, a ${compass.cardName},` : "A mai iránytű";
  if (/randi|kapcsolat|szerelem|ex|üzenet|nem ír|család/.test(lower)) {
    return `${cardPart} ebben a kapcsolati térben nem gyors választ ad, hanem tempót mutat. A „${clean}” témában ma azt figyeld, hol reagálnál hiányból, és hol tudsz nyugodtabban jelen lenni.`;
  }
  if (/munka|állás|dönt|pénz|vált|projekt|feladat/.test(lower)) {
    return `${cardPart} a „${clean}” kérdésében arra hívhatja fel a figyelmed, hogy ma ne mindent egyszerre akarj megoldani. Válaszd ki azt az egy lépést, ami tisztábbá teszi a következő órákat.`;
  }
  if (/félek|szorong|fáradt|nehéz|elakadt|bizonytalan/.test(lower)) {
    return `${cardPart} a „${clean}” érzése mellett inkább lassítást kér. Ma nem az a fontos, hogy mindent megfejts, hanem hogy észrevedd, melyik gondolat tér vissza túl nagy erővel.`;
  }
  return `${cardPart} a „${clean}” témáját nem végleges válaszként, hanem napi jelként keretezi: mi az az apró döntés vagy felismerés, amit ma már nem érdemes eltolnod?`;
}

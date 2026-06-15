import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { HUDateInput } from "@/components/HUDateInput";
import { qualityCompatibilityReading } from "@/lib/readingQuality/functions";
import {
  calculateCompatibilityProfile,
  composeCompatibilityReading,
  type CompatibilityProfile,
} from "@/lib/readingQuality/compatibilityEngine";
import { type QualityReading } from "@/lib/readingQuality/styleRules";
import { trackEvent } from "@/lib/analytics";
import { getReadingContext, saveReadingMemory } from "@/lib/readingMemory.functions";
import { getGuestReadingContext, recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { recordCompatibilityCheck } from "@/lib/relationshipPattern";
import { useAuth } from "@/hooks/useAuth";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { SmartReadingFollowup } from "@/components/SmartReadingFollowup";

export const Route = createFileRoute("/osszeillunk")({
  head: () => ({
    meta: [
      { title: "Összeillünk? — párkapcsolati összeillés | Jövőd.hu" },
      {
        name: "description",
        content:
          "Számmisztikai összeillés két születési dátum alapján. Milyen minőségeket hoztok ki egymásból?",
      },
    ],
    links: [{ rel: "canonical", href: "/osszeillunk" }],
  }),
  component: Page,
});

const STATUS = [
  "most ismerkedünk",
  "kapcsolatban vagyunk",
  "ex / visszatérő történet",
  "házasság / hosszú táv",
];

function compatibilityMemorySentence(input: {
  status: string;
  relationshipNumber: number;
  score: number;
  isComparing: boolean;
}): string {
  const normalized = input.status.toLocaleLowerCase("hu-HU");
  if (input.isComparing) {
    return "Több emberrel is megnézted az összeillést; itt már nem csak az a fontos, ki illik hozzád, hanem milyen kapcsolati érzést keresel újra.";
  }
  if (normalized.includes("ex") || normalized.includes("visszatér")) {
    return "Visszatérő történetnél nem csak az számít, újra megjelenik-e, hanem hogy más felelősséggel és tempóval tér-e vissza.";
  }
  if (normalized.includes("ismerked")) {
    return "Ennél az ismerkedésnél a kezdeti vonzalom mellett az lesz beszédes, megjelenik-e következetes figyelem is.";
  }
  if (normalized.includes("házasság") || normalized.includes("hosszú")) {
    return "Hosszú távon ez a kapcsolatminta azt kérdezi, hogyan fér meg egymás mellett a biztonság és a szabadság.";
  }
  return `A kapcsolat ${input.relationshipNumber}-es mintája ${input.score}%-os közös tempót jelez, de a számnál fontosabb, hogyan bánik veletek ez a ritmus.`;
}

function Page() {
  const { user } = useAuth();
  const callQuality = useServerFn(qualityCompatibilityReading);
  const loadMemory = useServerFn(getReadingContext);
  const saveMemory = useServerFn(saveReadingMemory);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [na, setNa] = useState("");
  const [nb, setNb] = useState("");
  const [status, setStatus] = useState(STATUS[0]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CompatibilityProfile | null>(null);
  const [reading, setReading] = useState<QualityReading | null>(null);
  const [comparisonContext, setComparisonContext] = useState("");

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) return;
    setLoading(true);
    const browserPattern = recordCompatibilityCheck({
      partnerName: nb || "a nő",
      partnerBirthDate: b,
      status,
    });
    setComparisonContext(browserPattern.contextText);
    const guestMemory = getGuestReadingContext({
      readingType: "compatibility",
      topic: status,
      situation: status,
      limit: 6,
    });
    let memoryContext = [
      guestMemory.contextText,
      guestMemory.themeSummary,
      browserPattern.contextText,
    ]
      .filter(Boolean)
      .join("\n");
    if (user) {
      try {
        const memory = await loadMemory({
          data: { readingType: "compatibility", topic: status, situation: status, limit: 5 },
        });
        memoryContext = [memory.contextText, memory.themeSummary, browserPattern.contextText]
          .filter(Boolean)
          .join("\n");
      } catch {
        /* memory is optional */
      }
    }
    try {
      const r = await callQuality({
        data: {
          birthDateA: a,
          birthDateB: b,
          fullNameA: na.trim() || undefined,
          fullNameB: nb.trim() || undefined,
          status,
          memoryContext: memoryContext || undefined,
        },
      });
      if (r.ok && r.reading && r.profile) {
        setProfile(r.profile);
        setReading(r.reading);
        recordGuestReadingMemory({
          readingType: "compatibility",
          topic: `${na || "én"} + ${nb || "ő"} · ${status}`,
          situation: status,
          sourceRoute: "/osszeillunk",
          title: r.reading.title,
          summary: r.reading.oneSentence,
          oneSentence: r.reading.oneSentence,
          anchors: [
            status,
            `${r.profile.personA.lifePathNumber}`,
            `${r.profile.personB.lifePathNumber}`,
            `${r.profile.relationshipNumber}`,
            ...(browserPattern.isComparing ? ["több összeillés", "választási minta"] : []),
          ],
        });
        if (user) {
          saveMemory({
            data: {
              readingType: "compatibility",
              topic: status,
              question: browserPattern.isComparing
                ? "Több emberrel nézett összeillési mintázat"
                : undefined,
              situation: status,
              sourceRoute: "/osszeillunk",
              title: r.reading.title,
              summary: r.reading.oneSentence,
              oneSentence: r.reading.oneSentence,
              anchors: [
                status,
                `${r.profile.personA.lifePathNumber}`,
                `${r.profile.personB.lifePathNumber}`,
                `${r.profile.relationshipNumber}`,
                ...(browserPattern.isComparing ? ["több összeillés", "választási minta"] : []),
              ],
              metadata: { distinctCompatibilityChecks30d: browserPattern.distinctCount },
            },
          }).catch(() => {});
        }
        trackEvent(r.fallbackUsed ? "roxy_fallback_used" : "roxy_cache_miss", {
          domain: "compatibility_quality",
        });
        setLoading(false);
        return;
      }
    } catch {
      /* ignore */
    }
    const fallbackProfile = calculateCompatibilityProfile({
      birthDateA: a,
      birthDateB: b,
      fullNameA: na,
      fullNameB: nb,
      status,
    });
    const fallbackReading = composeCompatibilityReading(fallbackProfile);
    const memorySentence = compatibilityMemorySentence({
      status,
      relationshipNumber: fallbackProfile.relationshipNumber,
      score: fallbackProfile.score,
      isComparing: browserPattern.isComparing,
    });
    setProfile(fallbackProfile);
    setReading(fallbackReading);
    recordGuestReadingMemory({
      readingType: "compatibility",
      topic: `${na || "én"} + ${nb || "ő"} · ${status}`,
      situation: status,
      sourceRoute: "/osszeillunk",
      title: `${fallbackProfile.score}% · ${fallbackProfile.relationshipNumber}-es kapcsolatminta`,
      summary: `${fallbackReading.oneSentence} ${memorySentence}`,
      oneSentence: memorySentence,
      anchors: [
        status,
        `${fallbackProfile.personA.lifePathNumber}`,
        `${fallbackProfile.personB.lifePathNumber}`,
        `${fallbackProfile.relationshipNumber}`,
        ...(browserPattern.isComparing ? ["több összeillés", "választási minta"] : []),
      ],
    });
    if (user) {
      saveMemory({
        data: {
          readingType: "compatibility",
          topic: status,
          situation: status,
          sourceRoute: "/osszeillunk",
          title: `${fallbackProfile.score}% · ${fallbackProfile.relationshipNumber}-es kapcsolatminta`,
          summary: `${fallbackReading.oneSentence} ${memorySentence}`,
          oneSentence: memorySentence,
          anchors: [
            status,
            `${fallbackProfile.personA.lifePathNumber}`,
            `${fallbackProfile.personB.lifePathNumber}`,
            `${fallbackProfile.relationshipNumber}`,
            ...(browserPattern.isComparing ? ["több összeillés", "választási minta"] : []),
          ],
          metadata: { distinctCompatibilityChecks30d: browserPattern.distinctCount },
        },
      }).catch(() => {});
    }
    trackEvent("roxy_fallback_used", { domain: "compatibility" });
    trackEvent("compatibility_completed", { score: fallbackProfile.score, status });
    setLoading(false);
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Összeillés"
        title="Összeillünk?"
        lead="Két születési dátum, egy közös szám — és mit hoz ki bennetek egymásból."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-8">
        <form onSubmit={calc} className="surface p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="compat-name-a" className="block text-sm text-ivory/80 mb-2">
                A férfi neve (opcionális)
              </label>
              <input
                id="compat-name-a"
                value={na}
                onChange={(e) => setNa(e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label htmlFor="compat-name-b" className="block text-sm text-ivory/80 mb-2">
                A nő neve (opcionális)
              </label>
              <input
                id="compat-name-b"
                value={nb}
                onChange={(e) => setNb(e.target.value)}
                className={inp}
              />
            </div>
            <HUDateInput label="Férfi születési dátuma" required value={a} onChange={setA} />
            <HUDateInput label="Nő születési dátuma" required value={b} onChange={setB} />
          </div>
          <div>
            <label htmlFor="compat-status" className="block text-sm text-ivory/80 mb-2">
              A kapcsolat státusza
            </label>
            <select
              id="compat-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={sel}
            >
              {STATUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button className="btn-gold" disabled={!a || !b || loading}>
            {loading ? "Egy pillanat…" : "Megnézem az összeillést"}
          </button>
        </form>

        {loading && !reading && (
          <ReadingLoadingState kind="compatibility" title="Az összeillés készül" />
        )}

        <GuestMemoryInsightPanel readingType="compatibility" topic={status} situation={status} />

        {profile && reading && (
          <div className="space-y-4">
            <div className="surface p-8 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                Összeillés
              </div>
              <div className="font-display text-7xl md:text-8xl text-gold-gradient my-2">
                {profile.score}%
              </div>
              <p className="font-editorial text-ivory/70 mt-2">
                {na || "A férfi"} és {nb || "a nő"} — {status}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Section eyebrow="A férfi sorsszáma" title={`${profile.personA.lifePathNumber}`}>
                Születési ritmusa ezt a kapcsolati térbe is behozza.
              </Section>
              <Section eyebrow="A nő sorsszáma" title={`${profile.personB.lifePathNumber}`}>
                Ez a szám mutatja, milyen alaptempóból közeledik.
              </Section>
              <Section eyebrow="A kapcsolat száma" title={`${profile.relationshipNumber}`}>
                Ez kettőtök közös mintája, nem egyikőtök külön száma.
              </Section>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {reading.sections.map((section) => (
                <Section key={section.heading} eyebrow={section.heading}>
                  {section.text}
                </Section>
              ))}
              {comparisonContext && (
                <Section eyebrow="A keresésed mintája">
                  Most nem csak az a kérdés, hogy egy emberrel mennyi az összeillés. Ha több
                  kapcsolatot is összehasonlítasz, érdemes lehet azt is figyelned, milyen minőséget
                  keresel újra és újra: biztonságot, izgalmat, lezárást vagy megerősítést. Ez nem
                  baj, inkább jelzés arra, hogy a választás mögötti mintát is érdemes olvasni.
                </Section>
              )}
              <Section eyebrow="Egy mondatban">
                <em>{reading.oneSentence}</em>
              </Section>
            </div>
            <SmartReadingFollowup
              intent="compatibility"
              readingType="compatibility"
              topic={status}
              situation={status}
              question={
                status === "ex / visszatérő történet"
                  ? "Visszatérhet-e ez a kapcsolat más mintával, vagy csak rövid fellángolás lenne?"
                  : "Milyen dinamika van köztünk, és mire kell figyelnünk?"
              }
              sourceRoute="/osszeillunk"
              inputPayload={{
                myName: na,
                hisName: nb,
                myDob: a,
                hisDob: b,
                sit: status,
                score: profile.score,
                relationshipNumber: profile.relationshipNumber,
              }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
const inp =
  "w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none";
const sel =
  "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";

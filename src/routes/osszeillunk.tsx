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

function Page() {
  const callQuality = useServerFn(qualityCompatibilityReading);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [na, setNa] = useState("");
  const [nb, setNb] = useState("");
  const [status, setStatus] = useState(STATUS[0]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CompatibilityProfile | null>(null);
  const [reading, setReading] = useState<QualityReading | null>(null);

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) return;
    setLoading(true);
    try {
      const r = await callQuality({
        data: {
          birthDateA: a,
          birthDateB: b,
          fullNameA: na.trim() || undefined,
          fullNameB: nb.trim() || undefined,
          status,
        },
      });
      if (r.ok && r.reading && r.profile) {
        setProfile(r.profile);
        setReading(r.reading);
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
    setProfile(fallbackProfile);
    setReading(composeCompatibilityReading(fallbackProfile));
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
              <label className="block text-sm text-ivory/80 mb-2">A férfi neve (opcionális)</label>
              <input value={na} onChange={(e) => setNa(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-sm text-ivory/80 mb-2">A nő neve (opcionális)</label>
              <input value={nb} onChange={(e) => setNb(e.target.value)} className={inp} />
            </div>
            <HUDateInput label="Férfi születési dátuma" required value={a} onChange={setA} />
            <HUDateInput label="Nő születési dátuma" required value={b} onChange={setB} />
          </div>
          <div>
            <label className="block text-sm text-ivory/80 mb-2">A kapcsolat státusza</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
              {STATUS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button className="btn-gold" disabled={!a || !b || loading}>
            {loading ? "Egy pillanat…" : "Megnézem az összeillést"}
          </button>
        </form>

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
              <Section eyebrow="Egy mondatban">
                <em>{reading.oneSentence}</em>
              </Section>
            </div>
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

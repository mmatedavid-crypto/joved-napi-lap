import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import {
  compatPairMeaning,
  compatibilityScore,
  lifePath,
  lifePathInfo,
  relationshipNumber,
} from "@/lib/numerology";
import { HUDateInput } from "@/components/HUDateInput";
import { roxyNumerologyCompatibility } from "@/lib/roxy.functions";
import { normalizeRoxyCompat } from "@/lib/roxyNormalize";
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
  const callCompat = useServerFn(roxyNumerologyCompatibility);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [na, setNa] = useState("");
  const [nb, setNb] = useState("");
  const [status, setStatus] = useState(STATUS[0]);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{
    aN: number;
    bN: number;
    rel: number;
    score: number;
    communication?: number;
    attraction?: number;
    longTerm?: number;
    roxyUsed?: boolean;
  } | null>(null);

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) return;
    setLoading(true);
    const aN = lifePath(a);
    const bN = lifePath(b);
    const base = { aN, bN, rel: relationshipNumber(aN, bN), score: compatibilityScore(aN, bN) };
    try {
      const r = await callCompat({
        data: {
          birthDate1: a,
          birthDate2: b,
          fullName1: na.trim() || undefined,
          fullName2: nb.trim() || undefined,
        },
      });
      if (r.ok && r.data) {
        const n = normalizeRoxyCompat(r.data);
        if (r.cached) trackEvent("roxy_cache_hit", { domain: "compatibility" });
        else trackEvent("roxy_cache_miss", { domain: "compatibility" });
        setRes({
          ...base,
          aN: n.lifePathA ?? base.aN,
          bN: n.lifePathB ?? base.bN,
          score: n.score ?? base.score,
          communication: n.communication,
          attraction: n.attraction,
          longTerm: n.longTerm,
          roxyUsed: true,
        });
      } else {
        trackEvent("roxy_fallback_used", { domain: "compatibility" });
        setRes(base);
      }
    } catch {
      trackEvent("roxy_fallback_used", { domain: "compatibility" });
      setRes(base);
    }
    trackEvent("compatibility_completed", { score: base.score, status });
    setLoading(false);
  }

  const ai = res && lifePathInfo(res.aN);
  const bi = res && lifePathInfo(res.bN);
  const ri = res && lifePathInfo(res.rel);
  const pair = res && compatPairMeaning(res.aN, res.bN);

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

        {res && ai && bi && ri && pair && (
          <div className="space-y-4">
            <div className="surface p-8 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                Összeillés
              </div>
              <div className="font-display text-7xl md:text-8xl text-gold-gradient my-2">
                {res.score}%
              </div>
              <p className="font-editorial text-ivory/70 mt-2">
                {na || "A férfi"} és {nb || "a nő"} — {status}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Section eyebrow="A férfi sorsszáma" title={`${res.aN} · ${ai.title}`}>
                {ai.meaning}
              </Section>
              <Section eyebrow="A nő sorsszáma" title={`${res.bN} · ${bi.title}`}>
                {bi.meaning}
              </Section>
              <Section eyebrow="A kapcsolat száma" title={`${res.rel} · ${ri.title}`}>
                {ri.meaning}
              </Section>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Section eyebrow="Miért működhet">{pair.works}</Section>
              <Section eyebrow="Hol lehet nehéz">{pair.tension}</Section>
              <Section eyebrow="Kommunikáció">
                {res.communication
                  ? metricText(res.communication, "kommunikáció")
                  : "A kapcsolat hangja akkor tisztul, ha nem egymást javítjátok, hanem a saját ritmusotokat nevezitek meg."}
              </Section>
              <Section eyebrow="Vonzalom">
                {res.attraction
                  ? metricText(res.attraction, "vonzalom")
                  : "A vonzalom itt nem csak szikra: inkább az mutat irányt, mennyire mertek természetesek maradni egymás mellett."}
              </Section>
              <Section eyebrow="Hosszú táv">
                {res.longTerm
                  ? metricText(res.longTerm, "hosszú táv")
                  : "Hosszabb távon az dönthet, tudtok-e közös keretet építeni anélkül, hogy egyikőtök eltűnne benne."}
              </Section>
              <Section eyebrow="Egy mondatban">
                <em>{pair.advice}</em>
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

function metricText(value: number, label: string): string {
  if (value >= 80) {
    return `A ${label} erős tartóelem lehet köztetek, ha nem használjátok bizonyításra vagy kontrollra.`;
  }
  if (value >= 60) {
    return `A ${label} működőképes mintát mutat, de időnként tudatos figyelmet kérhet.`;
  }
  return `A ${label} érzékenyebb pont lehet: nem lezárást, hanem több finom egyeztetést jelez.`;
}

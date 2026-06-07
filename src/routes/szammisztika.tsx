import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { HUDateInput } from "@/components/HUDateInput";
import { loadLocal, saveLocal } from "@/lib/storage";
import { qualityNumerologyReading } from "@/lib/readingQuality/functions";
import {
  composeNumerologyReading,
  calculateNumerologyProfile,
  type NumerologyProfile,
} from "@/lib/readingQuality/numerologyEngine";
import { type QualityReading } from "@/lib/readingQuality/styleRules";
import { trackEvent } from "@/lib/analytics";
import { PaywallDialog } from "@/components/PaywallDialog";

export const Route = createFileRoute("/szammisztika")({
  head: () => ({
    meta: [
      { title: "Sorsszám — számmisztika magyarul | Jövőd.hu" },
      {
        name: "description",
        content: "Számold ki a sorsszámod és a személyes éved. Mit mond rólad a születési dátumod?",
      },
    ],
    links: [{ rel: "canonical", href: "/szammisztika" }],
  }),
  component: Page,
});

function Page() {
  const callQuality = useServerFn(qualityNumerologyReading);
  const [dob, setDob] = useState("");
  const [name, setName] = useState("");
  const [callName, setCallName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QualityReading | null>(null);
  const [profile, setProfile] = useState<NumerologyProfile | null>(null);
  const [paywall, setPaywall] = useState(false);

  async function fetchReading(d: string, nm?: string, cn?: string) {
    setLoading(true);
    try {
      const r = await callQuality({
        data: {
          birthDate: d,
          fullName: nm || undefined,
          preferredName: cn?.trim() || undefined,
        },
      });
      if (r.ok && r.reading) {
        setResult(r.reading);
        setProfile(r.profile);
        setLoading(false);
        return;
      }
    } catch {
      /* ignore */
    }
    const fallbackProfile = calculateNumerologyProfile({ birthDate: d, fullName: nm });
    setProfile(fallbackProfile);
    setResult(composeNumerologyReading(fallbackProfile));
    trackEvent("roxy_fallback_used", { domain: "numerology" });
    setLoading(false);
  }

  // Reuse the dob/name the user already entered on the home page.
  useEffect(() => {
    const last = loadLocal<{ dob: string; name?: string; callName?: string }>("numerology:last");
    if (last?.dob) {
      setDob(last.dob);
      if (last.name) setName(last.name);
      if (last.callName) setCallName(last.callName);
      fetchReading(last.dob, last.name, last.callName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!dob) return;
    saveLocal("numerology:last", { dob, name, callName });
    fetchReading(dob, name, callName);
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Számmisztika"
        title="A sorsszámod"
        lead="Egy szám, ami a születésed napjából érkezik veled."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-8">
        <form onSubmit={calc} className="surface p-6 space-y-5">
          <HUDateInput label="Születési dátumod" required value={dob} onChange={setDob} />
          <div>
            <label className="block text-sm text-ivory/80 mb-2">Teljes neved (opcionális)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pl. Kovács Dávid Máté — családnév + keresztnevek"
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-ivory/80 mb-2">Ahogy szólítanak (opcionális)</label>
            <input
              value={callName}
              onChange={(e) => setCallName(e.target.value)}
              placeholder="Pl. Máté"
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
            <p className="text-xs text-ivory/55 mt-2 font-editorial">
              Ezen a néven szólítunk meg az olvasatban — pl. ha Máténak hívnak, nem a vezetéknevedet
              használjuk.
            </p>
          </div>
          <button className="btn-gold" disabled={!dob || loading}>
            {loading ? "Egy pillanat…" : "Megnézem a sorsszámom"}
          </button>
        </form>

        {result && (
          <div className="space-y-4">
            <div className="surface p-8 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                A sorsszámod{callName.trim() ? `, ${callName.trim()}` : ""}
              </div>
              <div className="font-display text-8xl text-gold-gradient my-3">
                {profile?.lifePathNumber}
              </div>
              <div className="font-display text-2xl text-ivory">{result.title}</div>
            </div>
            {profile && (
              <div className="grid md:grid-cols-2 gap-4">
                <Section eyebrow="Születésnap száma" title={`${profile.birthDayNumber}`}>
                  A születésnap száma azt mutatja, milyen adottságod jelenik meg ösztönösen, külön
                  erőlködés nélkül.
                </Section>
                <Section eyebrow="Személyes hónapod" title={`${profile.personalMonthNumber}`}>
                  Ez a hónap közelebb hozza az idei személyes éved témáját: kisebb döntésekben, napi
                  ritmusban, visszatérő érzésekben.
                </Section>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {result.sections.map((section) => (
                <Section key={section.heading} eyebrow={section.heading}>
                  {section.text}
                </Section>
              ))}
            </div>
            <Section eyebrow="Egy mondatban">
              <em>{result.oneSentence}</em>
            </Section>
            <div className="text-center pt-4 border-t border-[oklch(0.78_0.10_80/0.15)] mt-2">
              <div className="text-sm text-ivory/70 mb-2">
                Teljes numerológiai életút elemzést kérsz emailben?
              </div>
              <button className="btn-gold" onClick={() => setPaywall(true)}>
                Életút elemzés · 2490 Ft
              </button>
            </div>
          </div>
        )}
      </div>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="szammisztika_eletut"
        sourceRoute="/szammisztika"
        inputPayload={{ dob, name }}
      />
    </Layout>
  );
}

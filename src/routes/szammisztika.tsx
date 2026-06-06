import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { lifePath, lifePathInfo, personalYear } from "@/lib/numerology";
import { HUDateInput } from "@/components/HUDateInput";
import { loadLocal } from "@/lib/storage";
import { aiNumerologyHU, type NumerologyHU } from "@/lib/roxyTranslate.functions";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/szammisztika")({
  head: () => ({
    meta: [
      { title: "Sorsszám — számmisztika magyarul | Jövőd.hu" },
      { name: "description", content: "Számold ki a sorsszámod és a személyes éved. Mit mond rólad a születési dátumod?" },
    ],
    links: [{ rel: "canonical", href: "/szammisztika" }],
  }),
  component: Page,
});

function Page() {
  const callAi = useServerFn(aiNumerologyHU);
  const [dob, setDob] = useState(""); const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NumerologyHU | null>(null);

  async function fetchReading(d: string, nm?: string) {
    setLoading(true);
    try {
      const r = await callAi({ data: { birthDate: d, fullName: nm || undefined } });
      if (r.ok && r.reading) {
        setResult(r.reading);
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }
    // Fallback: helyi sorsszám
    const n = lifePath(d);
    const py = personalYear(d);
    const info = lifePathInfo(n);
    const pyInfo = lifePathInfo(py);
    setResult({
      lifePathNumber: n,
      title: info.title,
      meaning: info.meaning,
      strengths: info.strengths,
      shadow: info.shadow,
      love: info.love,
      work: info.work,
      personalYearNumber: py,
      personalYearMeaning: pyInfo.meaning,
    });
    trackEvent("roxy_fallback_used", { domain: "numerology" });
    setLoading(false);
  }

  // Reuse the dob/name the user already entered on the home page.
  useEffect(() => {
    const last = loadLocal<{ dob: string; name?: string }>("numerology:last");
    if (last?.dob) {
      setDob(last.dob);
      if (last.name) setName(last.name);
      fetchReading(last.dob, last.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!dob) return;
    fetchReading(dob, name);
  }

  return (
    <Layout>
      <PageHeader eyebrow="Számmisztika" title="A sorsszámod" lead="Egy szám, ami a születésed napjából érkezik veled." />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-8">
        <form onSubmit={calc} className="surface p-6 space-y-5">
          <HUDateInput label="Születési dátumod" required value={dob} onChange={setDob} />
          <div>
            <label className="block text-sm text-ivory/80 mb-2">Keresztneved (opcionális)</label>
            <input value={name} onChange={(e)=>setName(e.target.value)}
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none" />
          </div>
          <button className="btn-gold" disabled={!dob || loading}>{loading ? "Egy pillanat…" : "Megnézem a sorsszámom"}</button>
        </form>

        {result && (
          <div className="space-y-4">
            <div className="surface p-8 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">A sorsszámod{name && `, ${name}`}</div>
              <div className="font-display text-8xl text-gold-gradient my-3">{result.lifePathNumber}</div>
              <div className="font-display text-2xl text-ivory">{result.title}</div>
            </div>
            <Section eyebrow="Mit jelent ez rólad?">{result.meaning}</Section>
            <div className="grid md:grid-cols-2 gap-4">
              {result.strengths && <Section eyebrow="Erősségeid">{result.strengths}</Section>}
              {result.shadow && <Section eyebrow="Árnyékoldalad">{result.shadow}</Section>}
              {result.love && <Section eyebrow="Szerelemben">{result.love}</Section>}
              {result.work && <Section eyebrow="Munkában">{result.work}</Section>}
            </div>
            {result.personalYearNumber && (
              <Section eyebrow="Az idei személyes éved" title={`${result.personalYearNumber}-es év`}>
                {result.personalYearMeaning ?? `Ebben az évben a ${result.personalYearNumber} energiája kísér.`}
              </Section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
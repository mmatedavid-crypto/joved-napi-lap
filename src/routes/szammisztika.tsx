import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { lifePath, lifePathInfo, personalYear } from "@/lib/numerology";
import { HUDateInput } from "@/components/HUDateInput";

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
  const [dob, setDob] = useState(""); const [name, setName] = useState("");
  const [result, setResult] = useState<{ n: number; py: number } | null>(null);

  function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!dob) return;
    setResult({ n: lifePath(dob), py: personalYear(dob) });
  }

  const info = result ? lifePathInfo(result.n) : null;

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
          <button className="btn-gold" disabled={!dob}>Megnézem a sorsszámom</button>
        </form>

        {result && info && (
          <div className="space-y-4">
            <div className="surface p-8 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">A sorsszámod{name && `, ${name}`}</div>
              <div className="font-display text-8xl text-gold-gradient my-3">{result.n}</div>
              <div className="font-display text-2xl text-ivory">{info.title}</div>
            </div>
            <Section eyebrow="Mit jelent ez rólad?">{info.meaning}</Section>
            <div className="grid md:grid-cols-2 gap-4">
              <Section eyebrow="Erősségeid">{info.strengths}</Section>
              <Section eyebrow="Árnyékoldalad">{info.shadow}</Section>
              <Section eyebrow="Szerelemben">{info.love}</Section>
              <Section eyebrow="Munkában">{info.work}</Section>
            </div>
            <Section eyebrow="Az idei személyes éved" title={`${result.py}-es év`}>
              Ebben az évben a {result.py} energiája kísér. Érdemes lehet erre az alaphangra figyelni, mielőtt nagy döntéseket hozol.
            </Section>
          </div>
        )}
      </div>
    </Layout>
  );
}
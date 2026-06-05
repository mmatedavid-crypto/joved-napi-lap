import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { compatPairMeaning, compatibilityScore, lifePath, lifePathInfo, relationshipNumber } from "@/lib/numerology";
import { HUDateInput } from "@/components/HUDateInput";

export const Route = createFileRoute("/osszeillunk")({
  head: () => ({
    meta: [
      { title: "Összeillünk? — párkapcsolati összeillés | Jövőd.hu" },
      { name: "description", content: "Számmisztikai összeillés két születési dátum alapján. Milyen minőségeket hoztok ki egymásból?" },
    ],
    links: [{ rel: "canonical", href: "/osszeillunk" }],
  }),
  component: Page,
});

const STATUS = ["most ismerkedünk", "kapcsolatban vagyunk", "ex / visszatérő történet", "házasság / hosszú táv"];

function Page() {
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [na, setNa] = useState(""); const [nb, setNb] = useState("");
  const [status, setStatus] = useState(STATUS[0]);
  const [res, setRes] = useState<{ aN: number; bN: number; rel: number; score: number } | null>(null);

  function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) return;
    const aN = lifePath(a), bN = lifePath(b);
    setRes({ aN, bN, rel: relationshipNumber(aN, bN), score: compatibilityScore(aN, bN) });
  }

  const ai = res && lifePathInfo(res.aN);
  const bi = res && lifePathInfo(res.bN);
  const ri = res && lifePathInfo(res.rel);
  const pair = res && compatPairMeaning(res.aN, res.bN);

  return (
    <Layout>
      <PageHeader eyebrow="Összeillés" title="Összeillünk?" lead="Két születési dátum, egy közös szám — és mit hoz ki bennetek egymásból." />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-8">
        <form onSubmit={calc} className="surface p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-ivory/80 mb-2">A férfi neve (opcionális)</label><input value={na} onChange={(e)=>setNa(e.target.value)} className={inp}/></div>
            <div><label className="block text-sm text-ivory/80 mb-2">A nő neve (opcionális)</label><input value={nb} onChange={(e)=>setNb(e.target.value)} className={inp}/></div>
            <HUDateInput label="Férfi születési dátuma" required value={a} onChange={setA} />
            <HUDateInput label="Nő születési dátuma" required value={b} onChange={setB} />
          </div>
          <div><label className="block text-sm text-ivory/80 mb-2">A kapcsolat státusza</label>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className={sel}>{STATUS.map((s)=><option key={s}>{s}</option>)}</select>
          </div>
          <button className="btn-gold" disabled={!a || !b}>Megnézem az összeillést</button>
        </form>

        {res && ai && bi && ri && pair && (
          <div className="space-y-4">
            <div className="surface p-8 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">Összeillés</div>
              <div className="font-display text-7xl md:text-8xl text-gold-gradient my-2">{res.score}%</div>
              <p className="font-editorial text-ivory/70 mt-2">{na || "A férfi"} és {nb || "a nő"} — {status}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Section eyebrow="A férfi sorsszáma" title={`${res.aN} · ${ai.title}`}>{ai.meaning}</Section>
              <Section eyebrow="A nő sorsszáma" title={`${res.bN} · ${bi.title}`}>{bi.meaning}</Section>
              <Section eyebrow="A kapcsolat száma" title={`${res.rel} · ${ri.title}`}>{ri.meaning}</Section>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Section eyebrow="Miért működhet">{pair.works}</Section>
              <Section eyebrow="Hol lehet nehéz">{pair.tension}</Section>
              <Section eyebrow="Egy mondat, amit vigyetek magatokkal"><em>{pair.advice}</em></Section>
              <Section eyebrow="A kapcsolat hangja">A {res.rel}-es kapcsolatszám lassabb, őszintébb beszélgetéseket kér — nem a vita tisztáz, hanem a kimondás.</Section>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
const inp = "w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none";
const sel = "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";
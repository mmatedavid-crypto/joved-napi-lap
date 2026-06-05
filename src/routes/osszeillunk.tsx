import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { compatibilityScore, lifePath, lifePathInfo, relationshipNumber } from "@/lib/numerology";

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

  return (
    <Layout>
      <PageHeader eyebrow="Összeillés" title="Összeillünk?" lead="Két születési dátum, egy közös szám — és mit hoz ki bennetek egymásból." />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-8">
        <form onSubmit={calc} className="surface p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-ivory/80 mb-2">A férfi neve (opcionális)</label><input value={na} onChange={(e)=>setNa(e.target.value)} className={inp}/></div>
            <div><label className="block text-sm text-ivory/80 mb-2">A nő neve (opcionális)</label><input value={nb} onChange={(e)=>setNb(e.target.value)} className={inp}/></div>
            <div><label className="block text-sm text-ivory/80 mb-2">Férfi születési dátuma</label><input required type="date" value={a} onChange={(e)=>setA(e.target.value)} className={inp}/></div>
            <div><label className="block text-sm text-ivory/80 mb-2">Nő születési dátuma</label><input required type="date" value={b} onChange={(e)=>setB(e.target.value)} className={inp}/></div>
          </div>
          <div><label className="block text-sm text-ivory/80 mb-2">A kapcsolat státusza</label>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className={sel}>{STATUS.map((s)=><option key={s}>{s}</option>)}</select>
          </div>
          <button className="btn-gold">Megnézem az összeillést</button>
        </form>

        {res && ai && bi && ri && (
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
              <Section eyebrow="Miért működhet?">A {ai.title.toLowerCase()} és a {bi.title.toLowerCase()} energiája akkor erősíti egymást, ha mindketten tudtok teret adni a másik tempójának.</Section>
              <Section eyebrow="Hol lehet nehéz?">{ai.shadow} A másik oldalon: {bi.shadow}</Section>
              <Section eyebrow="Kommunikáció">A {res.rel}-es kapcsolatszám szerint az őszinte, lassabb beszélgetések többet visznek, mint a tisztázó vita.</Section>
              <Section eyebrow="Vonzalom">A vonzás akkor él, ha mindketten önmagatok maradtok — nem akkor, ha a másikért átalakultok.</Section>
              <Section eyebrow="Hosszú táv">A hosszú táv nem a hasonlóságon, hanem a közös ritmuson múlik.</Section>
              <Section eyebrow="Egy mondatban"><em>Nem lezárást, hanem irányt mutat.</em></Section>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
const inp = "w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none";
const sel = "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardBack, CardFace } from "@/components/TarotCard";
import { pickCards, type TarotCard } from "@/data/cards";

export const Route = createFileRoute("/dontes-elott")({
  head: () => ({
    meta: [
      { title: "Döntés előtti húzás | Jövőd.hu" },
      { name: "description", content: "Húzz egy lapot, mielőtt döntesz. Egy vagy három lapos tarot a tisztánlátáshoz." },
    ],
    links: [{ rel: "canonical", href: "/dontes-elott" }],
  }),
  component: Page,
});

const CATS = ["szerelem", "munka", "pénz", "család", "költözés", "ex / visszatérés", "egyéb"];

function Page() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [type, setType] = useState<1 | 3>(1);
  const [cards, setCards] = useState<TarotCard[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([]);

  function draw() {
    const c = pickCards(type);
    setCards(c);
    setRevealed(new Array(type).fill(false));
  }

  const main = cards?.[Math.min(1, (cards?.length ?? 1) - 1)];

  return (
    <Layout>
      <PageHeader eyebrow="Döntés előtt" title="Húzz egy lapot, mielőtt döntesz" lead="Egy csendes pillanat, mielőtt cselekszel." />
      <div className="mx-auto max-w-4xl px-4 md:px-6 pb-20 space-y-8">
        {!cards && (
          <form onSubmit={(e) => { e.preventDefault(); draw(); }} className="surface p-6 space-y-5">
            <Field label="A helyzet röviden (opcionális)">
              <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3}
                placeholder="Pl. Elfogadjam-e az új állást?"
                className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none" />
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Kategória">
                <select value={cat} onChange={(e) => setCat(e.target.value)} className={selectCls}>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Húzás típusa">
                <select value={type} onChange={(e) => setType(Number(e.target.value) as 1 | 3)} className={selectCls}>
                  <option value={1}>1 lapos gyors húzás</option>
                  <option value={3}>3 lapos Múlt / Jelen / Jövő</option>
                </select>
              </Field>
            </div>
            <button className="btn-gold">Húzom a lapot</button>
          </form>
        )}
        {cards && (
          <>
            <div className={`grid gap-4 ${cards.length === 1 ? "max-w-[260px] mx-auto" : "grid-cols-3 max-w-2xl mx-auto"}`}>
              {cards.map((c, i) => (
                revealed[i]
                  ? <CardFace key={i} card={c} label={cards.length === 3 ? ["Múlt","Jelen","Jövő"][i] : undefined} />
                  : <button key={i} onClick={() => setRevealed((r) => r.map((v, j) => j === i ? true : v))} className="block w-full"><CardBack /></button>
              ))}
            </div>
            {revealed.every(Boolean) && main && (
              <div className="grid md:grid-cols-2 gap-4">
                <Section eyebrow="A lap üzenete">{main.decision}</Section>
                <Section eyebrow="Amit most nem látsz tisztán">{main.warning}</Section>
                <Section eyebrow="Mi szól mellette?">A {main.keywords[0]} energia most veled van — érdemes lehet erre építeni, ha valódi belső igen van mögötte.</Section>
                <Section eyebrow="Mi szól ellene?">Ha a lépés csak elhárít egy kényelmetlenséget, valószínűleg nem oldja meg, csak elhalasztja.</Section>
                <Section eyebrow="Mire figyelj?">{main.warning}</Section>
                <Section eyebrow="Következő lépés"><em>{main.daily}</em></Section>
              </div>
            )}
            <div className="text-center"><button className="btn-ghost-gold" onClick={() => setCards(null)}>Új húzás</button></div>
          </>
        )}
      </div>
    </Layout>
  );
}

const selectCls = "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-sm text-ivory/80 mb-2">{label}</label>{children}</div>);
}
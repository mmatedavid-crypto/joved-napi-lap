import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardFace } from "@/components/TarotCard";
import { pickCards, type TarotCard } from "@/data/cards";
import { HUDateInput } from "@/components/HUDateInput";

export const Route = createFileRoute("/randi-elott")({
  head: () => ({
    meta: [
      { title: "Randi előtt — szerelmi tarot húzás | Jövőd.hu" },
      { name: "description", content: "Egy lap a kapcsolatról, mielőtt írsz vagy találkoztok. Finom, elegáns magyar olvasat." },
    ],
    links: [{ rel: "canonical", href: "/randi-elott" }],
  }),
  component: Page,
});

const SITUATIONS = ["randi előtt", "randi után", "most ismerkedünk", "nem ír vissza", "ex / visszatérő történet", "nem tudom, mit akar"];

function Page() {
  const [myDob, setMyDob] = useState(""); const [hisDob, setHisDob] = useState("");
  const [myName, setMyName] = useState(""); const [hisName, setHisName] = useState("");
  const [sit, setSit] = useState(SITUATIONS[0]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<1 | 3>(1);
  const [cards, setCards] = useState<TarotCard[] | null>(null);

  function draw(e: React.FormEvent) { e.preventDefault(); setCards(pickCards(type)); }

  return (
    <Layout>
      <PageHeader eyebrow="Randi előtt" title="Egy lap a kapcsolatról" lead="Egy kis tisztánlátás, mielőtt írsz, találkozol, vagy döntesz." />
      <div className="mx-auto max-w-4xl px-4 md:px-6 pb-20 space-y-8">
        {!cards && (
          <form onSubmit={draw} className="surface p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <F label="Te (név, opcionális)"><input value={myName} onChange={(e)=>setMyName(e.target.value)} className={inp} /></F>
              <F label="Ő (név, opcionális)"><input value={hisName} onChange={(e)=>setHisName(e.target.value)} className={inp} /></F>
              <HUDateInput label="Születési dátumod (opcionális)" value={myDob} onChange={setMyDob} />
              <HUDateInput label="Az ő születési dátuma (opcionális)" value={hisDob} onChange={setHisDob} />
            </div>
            <F label="A helyzet">
              <select value={sit} onChange={(e)=>setSit(e.target.value)} className={sel}>{SITUATIONS.map((s)=><option key={s}>{s}</option>)}</select>
            </F>
            <F label="Konkrét kérdés (opcionális)">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Pl. Komolyan gondolja?" className={inp} />
            </F>
            <F label="Húzás típusa">
              <select value={type} onChange={(e)=>setType(Number(e.target.value) as 1 | 3)} className={sel}>
                <option value={1}>1 lapos gyors húzás</option>
                <option value={3}>3 lapos kapcsolat-húzás</option>
              </select>
            </F>
            <button className="btn-gold">Húzom a lapot</button>
          </form>
        )}
        {cards && (
          <>
            <div className={`grid gap-4 ${cards.length === 1 ? "max-w-[260px] mx-auto" : "grid-cols-3 max-w-2xl mx-auto"}`}>
              {cards.map((c, i) => <CardFace key={i} card={c} label={cards.length === 3 ? ["Te","Köztetek","Ő"][i] : undefined} />)}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {cards.map((c, i) => (
                <Section key={i} eyebrow={cards.length === 3 ? ["Te","A kapcsolat","Ő"][i] : "A lap üzenete"} title={c.name}>{c.love}</Section>
              ))}
              <Section eyebrow="Egy mondatban"><em>{cards[cards.length - 1].daily}</em></Section>
            </div>
            <div className="surface p-5 opacity-60 border-dashed">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-1">Hamarosan</div>
              <div className="font-display text-xl text-ivory">Részletes kapcsolatdinamika-jelentés</div>
              <p className="font-editorial text-ivory/60 mt-1">Mélyebb olvasat a két ember energiájáról — később lesz elérhető.</p>
            </div>
            <div className="text-center"><button className="btn-ghost-gold" onClick={() => setCards(null)}>Új húzás</button></div>
          </>
        )}
      </div>
    </Layout>
  );
}

const inp = "w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none";
const sel = "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-sm text-ivory/80 mb-2">{label}</label>{children}</div>);
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardBack, CardFace } from "@/components/TarotCard";
import { pickCards, type TarotCard } from "@/data/cards";
import { roxyIchingDailyCast, aiTarotReadingHU, type TarotReadingHU } from "@/lib/roxy.functions";
import { normalizeRoxyIching } from "@/lib/roxyNormalize";
import { hexHU } from "@/lib/iching.hu";
import { trackEvent } from "@/lib/analytics";
import { todayKey } from "@/lib/storage";

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

type Mode = "tarot" | "iching" | "both";

function Page() {
  const callIching = useServerFn(roxyIchingDailyCast);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [type, setType] = useState<1 | 3>(1);
  const [mode, setMode] = useState<Mode>("tarot");
  const [cards, setCards] = useState<TarotCard[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [hex, setHex] = useState<{ number?: number; name: string; m: ReturnType<typeof hexHU>["m"] } | null>(null);
  const [ichingFailed, setIchingFailed] = useState(false);
  const [reading, setReading] = useState<TarotReadingHU | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const aiReading = useServerFn(aiTarotReadingHU);

  async function draw() {
    setIchingFailed(false);
    setReading(null);
    if (mode === "tarot" || mode === "both") {
      const c = pickCards(type);
      setCards(c);
      setRevealed(new Array(type).fill(false));
    } else {
      setCards(null);
      setRevealed([]);
    }
    if (mode === "iching" || mode === "both") {
      trackEvent("iching_started");
      try {
        const seed = `${todayKey()}:${q}:${cat}:${Math.floor(Math.random() * 1e6)}`.slice(0, 60);
        const r = await callIching({ data: { seed } });
        if (r.ok) {
          (r.cached ? trackEvent("roxy_cache_hit", { domain: "iching" }) : trackEvent("roxy_cache_miss", { domain: "iching" }));
          const n = normalizeRoxyIching(r.data);
          const h = hexHU(n.primary?.number);
          setHex({ number: n.primary?.number, name: h.name, m: h.m });
          trackEvent("iching_completed", { hex: n.primary?.number });
        } else throw new Error("iching-fail");
      } catch {
        trackEvent("roxy_fallback_used", { domain: "iching" });
        setIchingFailed(true);
        if (mode === "iching") {
          // fallback to tarot-only
          const c = pickCards(1);
          setCards(c);
          setRevealed([false]);
        }
      }
    } else {
      setHex(null);
    }
  }

  useEffect(() => {
    if (!cards || !revealed.length || !revealed.every(Boolean)) return;
    let cancelled = false;
    setLoadingReading(true);
    aiReading({
      data: {
        spread: cards.length === 3 ? "decision-3" : "decision-1",
        cards: cards.map((c) => ({
          id: c.id, name: c.name, keywords: c.keywords,
          general: c.general, love: c.love, decision: c.decision,
          warning: c.warning, daily: c.daily,
        })),
        question: q || undefined,
        category: cat,
      },
    }).then((r) => {
      if (cancelled) return;
      if (r.ok && r.reading) setReading(r.reading);
      setLoadingReading(false);
    }).catch(() => { if (!cancelled) setLoadingReading(false); });
    return () => { cancelled = true; };
  }, [cards, revealed]);

  const main = cards?.[Math.min(1, (cards?.length ?? 1) - 1)];

  return (
    <Layout>
      <PageHeader eyebrow="Döntés előtt" title="Húzz egy lapot, mielőtt döntesz" lead="Egy csendes pillanat, mielőtt cselekszel." />
      <div className="mx-auto max-w-4xl px-4 md:px-6 pb-20 space-y-8">
        {!cards && !hex && (
          <form onSubmit={(e) => { e.preventDefault(); draw(); }} className="surface p-6 space-y-5">
            <Field label="A helyzet röviden (opcionális)">
              <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3}
                placeholder="Pl. Elfogadjam-e az új állást?"
                className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none" />
            </Field>
            <Field label="Mit szeretnél húzni?">
              <div className="flex flex-wrap gap-2">
                {([
                  { v: "tarot", l: "Tarot húzás" },
                  { v: "iching", l: "I-Ching jel" },
                  { v: "both", l: "Tarot + I-Ching" },
                ] as const).map((m) => (
                  <button type="button" key={m.v} onClick={() => setMode(m.v)}
                    className={`px-3 py-1.5 rounded-md border text-sm ${mode === m.v ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                  >{m.l}</button>
                ))}
              </div>
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Kategória">
                <select value={cat} onChange={(e) => setCat(e.target.value)} className={selectCls}>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              {(mode === "tarot" || mode === "both") && (
                <Field label="Húzás típusa">
                  <select value={type} onChange={(e) => setType(Number(e.target.value) as 1 | 3)} className={selectCls}>
                    <option value={1}>1 lapos gyors húzás</option>
                    <option value={3}>3 lapos Múlt / Jelen / Jövő</option>
                  </select>
                </Field>
              )}
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
                {loadingReading && !reading && (
                  <div className="md:col-span-2 text-ivory/55 text-sm font-editorial italic">Egy pillanat — személyes olvasatot készítek…</div>
                )}
                <Section eyebrow="A lap üzenete">{reading?.intro ?? reading?.cardMessage ?? main.decision}</Section>
                <Section eyebrow="Amit most nem látsz tisztán">{reading?.warn ?? main.warning}</Section>
                <Section eyebrow="Mi szól mellette?">{reading?.pro ?? `A ${main.keywords[0]} energia most veled van — érdemes lehet erre építeni, ha valódi belső igen van mögötte.`}</Section>
                <Section eyebrow="Mi szól ellene?">{reading?.contra ?? "Ha a lépés csak elhárít egy kényelmetlenséget, valószínűleg nem oldja meg, csak elhalasztja."}</Section>
                <Section eyebrow="Mire figyelj?">{reading?.warn ?? main.warning}</Section>
                <Section eyebrow="Következő lépés"><em>{reading?.nextStep ?? reading?.oneLine ?? main.daily}</em></Section>
              </div>
            )}
          </>
        )}
        {hex && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">I-Ching jel{hex.number ? ` · ${hex.number}` : ""}</div>
              <h2 className="font-display text-3xl md:text-4xl text-ivory mt-1">{hex.name}</h2>
              {ichingFailed && <p className="text-xs text-ivory/50 mt-1">Csendes jel — egy egyszerű olvasattal dolgozunk.</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Section eyebrow="A jel">{hex.name}</Section>
              <Section eyebrow="Mit mutat a helyzetben?">{hex.m.show}</Section>
              <Section eyebrow="Mire figyelmeztet?">{hex.m.warn}</Section>
              <Section eyebrow="Merre mozdulhat?">{hex.m.move}</Section>
              <Section eyebrow="Egy mondatban az útmutatás"><em>{hex.m.oneLine}</em></Section>
            </div>
          </div>
        )}
        {(cards || hex) && (
          <div className="text-center"><button className="btn-ghost-gold" onClick={() => { setCards(null); setHex(null); setIchingFailed(false); }}>Új húzás</button></div>
        )}
      </div>
    </Layout>
  );
}

const selectCls = "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-sm text-ivory/80 mb-2">{label}</label>{children}</div>);
}
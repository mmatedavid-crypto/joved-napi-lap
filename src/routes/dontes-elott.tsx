import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardBack, CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { roxyIchingDailyCast } from "@/lib/roxy.functions";
import { aiTarotDrawHU, type TarotSlot } from "@/lib/roxyTranslate.functions";
import { normalizeRoxyIching } from "@/lib/roxyNormalize";
import { CARDS, type TarotCard } from "@/data/cards";
import { hexHU } from "@/lib/iching.hu";
import { trackEvent } from "@/lib/analytics";
import { todayKey } from "@/lib/storage";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";
import { saveReadingMemory } from "@/lib/readingMemory.functions";
import { getGuestReadingContext, recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dontes-elott")({
  head: () => ({
    meta: [
      { title: "Döntés előtti húzás | Jövőd.hu" },
      {
        name: "description",
        content: "Húzz egy lapot, mielőtt döntesz. Egy vagy három lapos tarot a tisztánlátáshoz.",
      },
    ],
    links: [{ rel: "canonical", href: "/dontes-elott" }],
  }),
  component: Page,
});

const CATS = ["szerelem", "munka", "pénz", "család", "költözés", "ex / visszatérés", "egyéb"];

type Mode = "tarot" | "iching" | "both";

function localCardFromSlot(slot: TarotSlot): TarotCard {
  const id = slot.roxy.localId;
  const found = id ? CARDS.find((c) => c.id === id) : null;
  return found ?? CARDS[0];
}

function pickDomain(cat: string): "love" | "career" | "finances" {
  if (cat === "szerelem" || cat === "család" || cat === "ex / visszatérés") return "love";
  if (cat === "pénz") return "finances";
  return "career";
}

function Page() {
  const { user } = useAuth();
  const callIching = useServerFn(roxyIchingDailyCast);
  const drawCards = useServerFn(aiTarotDrawHU);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [type, setType] = useState<1 | 3>(1);
  const [mode, setMode] = useState<Mode>("tarot");
  const [slots, setSlots] = useState<TarotSlot[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [hex, setHex] = useState<{
    number?: number;
    name: string;
    m: ReturnType<typeof hexHU>["m"];
  } | null>(null);
  const [ichingFailed, setIchingFailed] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const saveMemory = useServerFn(saveReadingMemory);

  async function draw() {
    setIchingFailed(false);
    setDrawError(null);
    setDrawing(true);
    try {
      if (mode === "tarot" || mode === "both") {
        const seed = `decision:${Date.now()}:${Math.floor(Math.random() * 1_000_000)}`.slice(0, 60);
        const r = await drawCards({ data: { count: type, allowReversals: true, seed } });
        if (!r.ok || r.slots.length < type) {
          setDrawError("A húzás most nem érkezett meg. Próbáld újra.");
          return;
        }
        setSlots(r.slots.slice(0, type));
        setRevealed(new Array(type).fill(false));
      } else {
        setSlots(null);
        setRevealed([]);
      }
    } finally {
      setDrawing(false);
    }
    if (mode === "iching" || mode === "both") {
      trackEvent("iching_started");
      try {
        const seed = `${todayKey()}:${q}:${cat}:${Math.floor(Math.random() * 1e6)}`.slice(0, 60);
        const r = await callIching({ data: { seed } });
        if (r.ok) {
          if (r.cached) {
            trackEvent("roxy_cache_hit", { domain: "iching" });
          } else {
            trackEvent("roxy_cache_miss", { domain: "iching" });
          }
          const n = normalizeRoxyIching(r.data);
          const h = hexHU(n.primary?.number);
          setHex({ number: n.primary?.number, name: h.name, m: h.m });
          recordGuestReadingMemory({
            readingType: "decision",
            topic: q || cat,
            question: q || undefined,
            situation: cat,
            sourceRoute: "/dontes-elott",
            title: `I-Ching · ${h.name}`,
            summary: h.m.oneLine,
            oneSentence: h.m.oneLine,
            anchors: [cat, h.name, mode],
          });
          trackEvent("iching_completed", { hex: n.primary?.number });
        } else throw new Error("iching-fail");
      } catch {
        trackEvent("roxy_fallback_used", { domain: "iching" });
        setIchingFailed(true);
      }
    } else {
      setHex(null);
    }
  }

  useEffect(() => {
    if (!slots || !revealed.length || !revealed.every(Boolean)) return;
    const cardNames = slots.map((s) => localCardFromSlot(s).name);
    const oneLine = slots[slots.length - 1]?.hu.oneLine ?? slots[0]?.hu.oneLine ?? "Döntési húzás";
    const summary = slots.map((s) => s.hu.meaning).join(" ");
    recordGuestReadingMemory({
      readingType: "decision",
      topic: q || cat,
      question: q || undefined,
      situation: cat,
      sourceRoute: "/dontes-elott",
      title: "Döntés előtt",
      summary,
      oneSentence: oneLine,
      anchors: [cat, ...cardNames],
    });
    if (user) {
      saveMemory({
        data: {
          readingType: "decision",
          topic: q || cat,
          question: q || undefined,
          situation: cat,
          sourceRoute: "/dontes-elott",
          title: "Döntés előtt",
          summary,
          oneSentence: oneLine,
          anchors: [cat, ...cardNames],
        },
      }).catch(() => {});
    }
  }, [slots, revealed, cat, q, saveMemory, user]);

  const domain = pickDomain(cat);
  const domainLabel =
    domain === "love" ? "Szerelemben" : domain === "finances" ? "Pénzügyek" : "Munka és tervek";

  return (
    <Layout>
      <PageHeader
        eyebrow="Döntés előtt"
        title="Húzz egy lapot, mielőtt döntesz"
        lead="Egy csendes pillanat, mielőtt cselekszel."
      />
      <div className="mx-auto max-w-4xl px-4 md:px-6 pb-20 space-y-8">
        {!slots && !hex && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              draw();
            }}
            className="surface p-6 space-y-5"
          >
            <Field id="decision-question" label="A helyzet röviden (opcionális)">
              <textarea
                id="decision-question"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                rows={3}
                placeholder="Pl. Elfogadjam-e az új állást?"
                className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
              />
            </Field>
            <Field label="Mit szeretnél húzni?">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { v: "tarot", l: "Tarot húzás" },
                    { v: "iching", l: "I-Ching jel" },
                    { v: "both", l: "Tarot + I-Ching" },
                  ] as const
                ).map((m) => (
                  <button
                    type="button"
                    key={m.v}
                    onClick={() => setMode(m.v)}
                    className={`px-3 py-1.5 rounded-md border text-sm ${mode === m.v ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field id="decision-category" label="Kategória">
                <select
                  id="decision-category"
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className={selectCls}
                >
                  {CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              {(mode === "tarot" || mode === "both") && (
                <Field id="decision-draw-type" label="Húzás típusa">
                  <select
                    id="decision-draw-type"
                    value={type}
                    onChange={(e) => setType(Number(e.target.value) as 1 | 3)}
                    className={selectCls}
                  >
                    <option value={1}>1 lapos gyors húzás</option>
                    <option value={3}>3 lapos Múlt / Jelen / Jövő</option>
                  </select>
                </Field>
              )}
            </div>
            <button className="btn-gold" disabled={drawing}>
              {drawing ? "Húzás..." : "Húzom a lapot"}
            </button>
            {drawError && <p className="text-sm text-ivory/60">{drawError}</p>}
          </form>
        )}
        <GuestMemoryInsightPanel readingType="decision" topic={q || cat} situation={cat} />
        {slots && (
          <>
            <div
              className={`grid gap-4 ${slots.length === 1 ? "max-w-[260px] mx-auto" : "grid-cols-3 max-w-2xl mx-auto"}`}
            >
              {slots.map((s, i) =>
                revealed[i] ? (
                  <CardFace
                    key={i}
                    card={localCardFromSlot(s)}
                    reversed={s.roxy.reversed}
                    label={slots.length === 3 ? ["Múlt", "Jelen", "Jövő"][i] : undefined}
                  />
                ) : (
                  <button
                    key={i}
                    onClick={() => setRevealed((r) => r.map((v, j) => (j === i ? true : v)))}
                    className="block w-full"
                  >
                    <CardBack />
                  </button>
                ),
              )}
            </div>
            {revealed.every(Boolean) && (
              <div className="grid md:grid-cols-2 gap-4">
                {slots.length === 3 ? (
                  <>
                    {slots.map((s, i) => (
                      <Section
                        key={i}
                        eyebrow={["Múlt", "Jelen", "Jövő"][i]}
                        title={localCardFromSlot(s).name}
                      >
                        {s.hu.meaning}
                      </Section>
                    ))}
                    {slots[2]?.hu[domain] && (
                      <Section eyebrow={domainLabel} className="md:col-span-2">
                        {slots[2].hu[domain]!}
                      </Section>
                    )}
                    {slots[slots.length - 1]?.hu.oneLine && (
                      <div className="md:col-span-2">
                        <Section eyebrow="Egy mondatban">
                          <em>{slots[slots.length - 1].hu.oneLine}</em>
                        </Section>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Section eyebrow="A lap üzenete" title={localCardFromSlot(slots[0]).name}>
                      {slots[0].hu.meaning}
                    </Section>
                    {slots[0].hu[domain] && (
                      <Section eyebrow={domainLabel}>{slots[0].hu[domain]!}</Section>
                    )}
                    {slots[0].hu.oneLine && (
                      <div className="md:col-span-2">
                        <Section eyebrow="Egy mondatban">
                          <em>{slots[0].hu.oneLine}</em>
                        </Section>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
        {hex && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                I-Ching jel{hex.number ? ` · ${hex.number}` : ""}
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ivory mt-1">{hex.name}</h2>
              {ichingFailed && (
                <p className="text-xs text-ivory/50 mt-1">
                  Csendes jel — egy egyszerű olvasattal dolgozunk.
                </p>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {q.trim() && (
                <Section eyebrow="A kérdésed felől" title={`„${q.trim()}”`}>
                  {ichingQuestionReflection(q, cat, hex.name)}
                </Section>
              )}
              <Section eyebrow="A jel">{hex.name}</Section>
              <Section eyebrow="Mit mutat a helyzetben?">{hex.m.show}</Section>
              <Section eyebrow="Mire figyelmeztet?">{hex.m.warn}</Section>
              <Section eyebrow="Merre mozdulhat?">{hex.m.move}</Section>
              <Section eyebrow="Egy mondatban az útmutatás">
                <em>{hex.m.oneLine}</em>
              </Section>
            </div>
          </div>
        )}
        {(slots || hex) && (
          <div className="text-center">
            <button
              className="btn-ghost-gold"
              onClick={() => {
                setSlots(null);
                setHex(null);
                setIchingFailed(false);
              }}
            >
              Új húzás
            </button>
            <div className="mt-6 border-t border-[oklch(0.78_0.10_80/0.15)] pt-6">
              <div className="text-sm text-ivory/70 mb-2">
                Komplex döntéselőkészítő elemzést kérsz?
              </div>
              <button className="btn-gold" onClick={() => setPaywall(true)}>
                {productCtaLabel("Komplex elemzés", "dontes_komplex")}
              </button>
            </div>
          </div>
        )}
      </div>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="dontes_komplex"
        sourceRoute="/dontes-elott"
        inputPayload={{
          q,
          cat,
          mode,
          cards: slots?.map((s) => localCardFromSlot(s).name),
          hex: hex?.name,
          memoryContext:
            getGuestReadingContext({ readingType: "decision", topic: q || cat, situation: cat })
              .contextText || undefined,
        }}
      />
    </Layout>
  );
}

const selectCls =
  "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";
function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-ivory/80 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function ichingQuestionReflection(question: string, category: string, hexName: string): string {
  return `A „${question}” kérdésben a ${hexName} jele nem azt mondja meg, mit kell tenned. Inkább azt mutatja, hogy a ${category} témájában milyen mozgás érett meg, és hol lenne korai erőltetni a választ. Akkor használd jól ezt a jelet, ha a döntés feltételeit tisztítod vele, nem bizonyosságot próbálsz kicsikarni belőle.`;
}

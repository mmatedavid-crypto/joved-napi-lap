import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardBack, CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { SmartReadingFollowup } from "@/components/SmartReadingFollowup";
import { roxyIchingDailyCast } from "@/lib/roxy.functions";
import { aiTarotDrawHU, type TarotSlot } from "@/lib/roxyTranslate.functions";
import { normalizeRoxyIching } from "@/lib/roxyNormalize";
import { CARDS, type TarotCard } from "@/data/cards";
import { hexHU } from "@/lib/iching.hu";
import { SITE_LEGAL } from "@/lib/legal";
import { trackEvent } from "@/lib/analytics";
import { todayKey } from "@/lib/storage";
import { saveReadingMemory } from "@/lib/readingMemory.functions";
import { recordGuestReadingMemory } from "@/lib/guestReadingMemory";
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
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/dontes-elott` }],
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

function decisionTarotSynthesis(slots: TarotSlot[], question: string, category: string) {
  const cards = slots.map((slot) => ({
    card: localCardFromSlot(slot),
    reversed: slot.roxy.reversed,
    oneLine: slot.hu.oneLine,
  }));
  const questionText = question.trim();
  const opening = questionText
    ? `A döntési helyzeted: „${questionText}”.`
    : `Most a ${category} témájában kérsz tisztább irányt.`;
  const categoryHint = decisionCategoryHint(category);

  if (cards.length === 1) {
    const card = cards[0];
    const direction = card.reversed
      ? "inkább azt jelzi, hol tartasz vissza valamit vagy hol félsz túl gyorsan lépni"
      : "inkább azt mutatja, melyik belső szempont kér most több figyelmet";
    return {
      heading: "Mit tisztít a döntés?",
      text: `${opening} A ${card.card.name} ${direction}. ${categoryHint} Ez a lap nem dönt helyetted: abban segít, hogy ne a sürgetésből, hanem a valódi tét felismeréséből mozdulj.`,
      oneLine:
        card.oneLine ??
        `A ${card.card.name} most nem parancsot ad, hanem a döntés valódi súlyát mutatja.`,
    };
  }

  const [past, present, future] = cards;
  return {
    heading: "A döntés íve",
    text: `${opening} A ${past.card.name} azt mutatja, milyen előzményből jössz; a ${present.card.name} a mostani nyomást vagy lehetőséget teszi láthatóvá; a ${future.card.name} pedig arra utalhat, milyen irány nyílhat, ha tisztábban választasz. ${categoryHint} Itt nem az a cél, hogy azonnal kimondj egy végleges igent vagy nemet, hanem hogy meglásd, melyik félelem és melyik valódi vágy beszél benned.`,
    oneLine:
      future.oneLine ??
      `${past.card.name}, ${present.card.name} és ${future.card.name} együtt a döntés belső ívét mutatja.`,
  };
}

function decisionCategoryHint(category: string): string {
  switch (category) {
    case "szerelem":
      return "Kapcsolati döntésnél most az érzelmi biztonság és a vágy tempója különválhat egymástól.";
    case "munka":
      return "Munkahelyi döntésnél a felelősség, a fejlődés és a kimerülés határát érdemes külön megnézni.";
    case "pénz":
      return "Anyagi kérdésnél ez önismereti jelzés, nem pénzügyi tanács: azt mutatja, hol döntesz félelemből vagy túlzott reményből.";
    case "család":
      return "Családi döntésnél gyakran régi szerepek is beleszólnak abba, mit érzel kötelességnek.";
    case "költözés":
      return "Költözésnél nem csak a hely változik, hanem az is, milyen életformához szeretnél közelebb kerülni.";
    case "ex / visszatérés":
      return "Visszatérő történetnél külön figyeld, valódi változás látszik-e, vagy csak a régi hiány kér új választ.";
    default:
      return "A döntés most akkor tisztul, ha nem csak a külső következményt, hanem a belső indítékot is látod.";
  }
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
          setDrawError(
            "A húzás most nem érkezett meg. Nem mentettünk félkész olvasatot; indíts új húzást nyugodtan.",
          );
          return;
        }
        setSlots(r.slots.slice(0, type));
        setRevealed(new Array(type).fill(false));
      } else {
        setSlots(null);
        setRevealed([]);
      }
    } catch {
      setDrawError(
        "A húzás most nem érkezett meg. Nem mentettünk félkész olvasatot; indíts új húzást nyugodtan.",
      );
      return;
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
            trackEvent("knowledge_cache_hit", { domain: "iching" });
          } else {
            trackEvent("knowledge_cache_miss", { domain: "iching" });
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
        trackEvent("local_meaning_used", { domain: "iching" });
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
        lead="Egy csendes tarot-fókusz, mielőtt cselekszel. Nem dönt helyetted, hanem segít különválasztani a vágyat, a félelmet és a józan belső irányt."
      />
      <div className="mx-auto max-w-4xl px-4 md:px-6 pb-20 space-y-8">
        {!slots && !hex && !drawing && (
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
            {drawError && (
              <p
                aria-live="polite"
                className="rounded-md border border-gold/15 bg-gold/[0.06] px-3 py-2 text-sm leading-relaxed text-ivory/68"
              >
                {drawError}
              </p>
            )}
          </form>
        )}
        {drawing && (
          <div className="max-w-2xl mx-auto space-y-6">
            <ReadingLoadingState
              kind="tarot"
              title="A pakli most keveredik"
              steps={[
                "Tartsd magad előtt a döntést, de ne kényszeríts még végső választ.",
                "A lapok azt keresik, mi húz előre, és mi tart vissza.",
                "Külön figyeljük a vágyat, a félelmet és a józan belső irányt.",
                "Nem az a cél, hogy a lap döntsön helyetted, hanem hogy tisztább legyen a mérleg.",
                "A húzás most azt keresi, melyik szempont kér több figyelmet.",
                "A pakli azt a képet emeli ki, amelyik ehhez a döntési pillanathoz tartozik.",
              ]}
            />
            <div className="text-center">
              <div className="inline-block relative w-16 h-16">
                <span className="absolute inset-0 rounded-full border border-gold/20 animate-ping" />
                <span
                  className="absolute inset-2 rounded-full border border-gold/40 animate-ping"
                  style={{ animationDelay: "300ms" }}
                />
                <span className="absolute inset-4 rounded-full bg-gold/10 animate-pulse" />
              </div>
              <p className="mt-4 text-xs tracking-[0.25em] uppercase text-ivory/40">
                Keverés · Kérdezés · Kiválasztás
              </p>
            </div>
          </div>
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
                      <div className="md:col-span-2">
                        <Section eyebrow={domainLabel}>{slots[2].hu[domain]!}</Section>
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
                  </>
                )}
                {(() => {
                  const synthesis = decisionTarotSynthesis(slots, q, cat);
                  return (
                    <>
                      <div className="md:col-span-2">
                        <Section eyebrow={synthesis.heading}>{synthesis.text}</Section>
                      </div>
                      <div className="md:col-span-2">
                        <Section eyebrow="Egy mondatban">
                          <em>{synthesis.oneLine}</em>
                        </Section>
                      </div>
                    </>
                  );
                })()}
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
          </div>
        )}
        {(slots || hex) && (
          <SmartReadingFollowup
            intent="decision"
            readingType="decision"
            topic={q || cat}
            situation={cat}
            question={q}
            sourceRoute="/dontes-elott"
            inputPayload={{
              q,
              cat,
              mode,
              cards: slots?.map((s) => localCardFromSlot(s).name),
              hex: hex?.name,
            }}
          />
        )}
      </div>
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

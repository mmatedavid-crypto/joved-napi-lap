import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardBack, CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { aiTarotReadingHU, roxyTarotThreeCard, type TarotReadingHU } from "@/lib/roxy.functions";
import { normalizeRoxySpread } from "@/lib/roxyNormalize";
import { mapRoxyToLocal, toAIInput, type LocalDrawn } from "@/lib/roxyCardMap";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";
import { getReadingContext, saveReadingMemory } from "@/lib/readingMemory.functions";
import { getGuestReadingContext, recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/harom-lap")({
  head: () => ({
    meta: [
      { title: "3 lapos tarot — Múlt, Jelen, Jövő | Jövőd.hu" },
      {
        name: "description",
        content:
          "Klasszikus három lapos tarot húzás magyarul. Múlt, jelen, jövő — egy összefüggő történet.",
      },
    ],
    links: [{ rel: "canonical", href: "/harom-lap" }],
  }),
  component: HaromLap,
});

const CATEGORIES = [
  "szerelem",
  "randi / ismerkedés",
  "ex / visszatérés",
  "munka",
  "pénz",
  "család",
  "döntés előtt",
  "általános élethelyzet",
];
const LABELS = ["Múlt", "Jelen", "Jövő"] as const;

function HaromLap() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [drawn, setDrawn] = useState<LocalDrawn[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [reading, setReading] = useState<TarotReadingHU | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [paywallProduct, setPaywallProduct] = useState<"harom_lap_mely" | "kelta_kereszt">(
    "harom_lap_mely",
  );
  const aiReading = useServerFn(aiTarotReadingHU);
  const drawSpread = useServerFn(roxyTarotThreeCard);
  const loadMemory = useServerFn(getReadingContext);
  const saveMemory = useServerFn(saveReadingMemory);

  async function draw() {
    setDrawing(true);
    setDrawError(null);
    setReading(null);
    try {
      const seed = `three:${Date.now()}:${Math.floor(Math.random() * 1_000_000)}`.slice(0, 60);
      const r = await drawSpread({ data: { seed, question: question || undefined } });
      if (!r.ok) {
        setDrawError("A húzás most nem érkezett meg. Próbáld újra egy pillanat múlva.");
        return;
      }
      const spread = normalizeRoxySpread(r.data);
      const mapped = mapRoxyToLocal(spread.positions.map((p) => p.card!).filter(Boolean));
      if (mapped.length < 3) {
        setDrawError("A húzás nem teljes — próbáld újra.");
        return;
      }
      setDrawn(mapped.slice(0, 3));
      setRevealed([false, false, false]);
    } finally {
      setDrawing(false);
    }
  }

  useEffect(() => {
    if (!drawn || !revealed.every(Boolean)) return;
    const drawnLocal = drawn;
    let cancelled = false;
    setLoadingReading(true);
    async function load() {
      const guestMemory = getGuestReadingContext({
        readingType: "tarot",
        topic: question || category,
        situation: category,
        limit: 5,
      });
      let memoryContext: string | undefined =
        guestMemory.contextText || guestMemory.themeSummary || undefined;
      if (user) {
        try {
          const memory = await loadMemory({
            data: {
              readingType: "tarot",
              topic: question || category,
              situation: category,
              limit: 5,
            },
          });
          memoryContext = memory.contextText || memory.themeSummary || undefined;
        } catch {
          /* memory is optional */
        }
      }
      return aiReading({
        data: {
          spread: "three",
          cards: drawnLocal.map((d) => toAIInput(d)),
          question: question || undefined,
          category,
          memoryContext,
        },
      });
    }
    load()
      .then((r) => {
        if (cancelled) return;
        if (r.ok && r.reading) {
          setReading(r.reading);
          const cardNames = drawnLocal.map((d) => d.card.name);
          recordGuestReadingMemory({
            readingType: "tarot",
            topic: question || category,
            question: question || undefined,
            situation: category,
            sourceRoute: "/harom-lap",
            title: r.reading.oneLine || "Három lapos húzás",
            summary: r.reading.together || r.reading.questionAnswer || r.reading.oneLine,
            oneSentence: r.reading.oneLine,
            anchors: [category, ...cardNames],
          });
          if (user) {
            saveMemory({
              data: {
                readingType: "tarot",
                topic: question || category,
                question: question || undefined,
                situation: category,
                sourceRoute: "/harom-lap",
                title: r.reading.oneLine || "Három lapos húzás",
                summary: r.reading.together || r.reading.questionAnswer || r.reading.oneLine,
                oneSentence: r.reading.oneLine,
                anchors: [category, ...cardNames],
              },
            }).catch(() => {});
          }
        }
        setLoadingReading(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingReading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [aiReading, drawn, category, loadMemory, question, revealed, saveMemory, user]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Három lap"
        title="Múlt · Jelen · Jövő"
        lead="Három lap, egy ív. Nem külön-külön, hanem együtt mond valamit."
      />
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-20 space-y-8">
        {!drawn && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              draw();
            }}
            className="surface p-6 md:p-7 space-y-5 max-w-2xl mx-auto"
          >
            <div>
              <label htmlFor="three-card-question" className="block text-sm text-ivory/80 mb-2">
                Mire kérdezel? <span className="text-ivory/50">(opcionális)</span>
              </label>
              <input
                id="three-card-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pl. Most lépjek-e tovább ebben?"
                className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
              />
            </div>
            <div>
              <label htmlFor="three-card-category" className="block text-sm text-ivory/80 mb-2">
                Kategória
              </label>
              <select
                id="three-card-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-gold w-full md:w-auto" disabled={drawing}>
              {drawing ? "Húzás..." : "Húzom a három lapot"}
            </button>
            {drawError && <p className="text-sm text-ivory/60">{drawError}</p>}
          </form>
        )}

        <GuestMemoryInsightPanel
          readingType="tarot"
          topic={question || category}
          situation={category}
        />

        {drawn && (
          <>
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto">
              {drawn.map((d, i) => (
                <div key={i}>
                  <div className="text-center text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-2">
                    {LABELS[i]}
                  </div>
                  {revealed[i] ? (
                    <CardFace card={d.card} reversed={d.reversed} />
                  ) : (
                    <button
                      type="button"
                      aria-label={`${LABELS[i]} lap felfedése`}
                      onClick={() => setRevealed((r) => r.map((v, j) => (j === i ? true : v)))}
                      className="block w-full"
                    >
                      <CardBack />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {revealed.every(Boolean) && (
              <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {loadingReading && !reading && (
                  <ReadingLoadingState
                    kind="tarot"
                    title="A három lap története készül"
                    className="md:col-span-2"
                  />
                )}
                {reading && (
                  <>
                    {question.trim() && reading.questionAnswer && (
                      <Section eyebrow="A kérdésedre" title={`„${question.trim()}”`}>
                        {reading.questionAnswer}
                      </Section>
                    )}
                    {reading.past && (
                      <Section eyebrow="Múlt — honnan jön ez a helyzet?">{reading.past}</Section>
                    )}
                    {reading.present && (
                      <Section eyebrow="Jelen — mi történik most valójában?">
                        {reading.present}
                      </Section>
                    )}
                    {reading.future && (
                      <Section eyebrow="Jövő — merre mozdulhat?">{reading.future}</Section>
                    )}
                    {reading.together && (
                      <Section eyebrow="A három lap együtt">{reading.together}</Section>
                    )}
                    {reading.warn && (
                      <Section eyebrow="Mire figyelj most?">{reading.warn}</Section>
                    )}
                    {reading.oneLine && (
                      <Section eyebrow="Egy mondatban az üzenet">
                        <em>{reading.oneLine}</em>
                      </Section>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="text-center pt-4">
              <button onClick={() => setDrawn(null)} className="btn-ghost-gold">
                Új húzás
              </button>
              <div className="mt-6 border-t border-[oklch(0.78_0.10_80/0.15)] pt-6">
                <div className="text-sm text-ivory/70 mb-2">Részletes, írott elemzést kérsz?</div>
                <p className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-ivory/58">
                  A három lap mély elemzése a most húzott múlt-jelen-jövő ívet bontja ki 24 órán
                  belül. Ha a kérdés nagyobb, több szereplős vagy régóta húzódik, a Kelta kereszt 10
                  pozícióban nézi meg a rejtett mintákat is.
                </p>
                <button
                  className="btn-gold"
                  onClick={() => {
                    setPaywallProduct("harom_lap_mely");
                    setPaywall(true);
                  }}
                >
                  {productCtaLabel("Három lap — mély elemzés", "harom_lap_mely")}
                </button>
                <div className="mt-4 text-sm text-ivory/65">
                  Kelta keresztet akkor válassz, ha nem csak választ, hanem teljesebb képet
                  szeretnél: mi tart vissza, mi mozgat belül, mi látszik kívülről, és merre nyílhat
                  út.
                </div>
                <button
                  className="btn-ghost-gold mt-2"
                  onClick={() => {
                    setPaywallProduct("kelta_kereszt");
                    setPaywall(true);
                  }}
                >
                  {productCtaLabel("Kelta kereszt — nagy spread", "kelta_kereszt")}
                </button>
              </div>
            </div>
            {question && (
              <p className="text-center text-ivory/50 text-sm font-editorial italic">
                A kérdésed: „{question}" — kategória: {category}
              </p>
            )}
          </>
        )}
      </div>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug={paywallProduct}
        sourceRoute="/harom-lap"
        inputPayload={{
          cards: drawn?.map((d) => d.card.name),
          question,
          category,
          memoryContext:
            getGuestReadingContext({
              readingType: "tarot",
              topic: question || category,
              situation: category,
            }).contextText || undefined,
        }}
      />
    </Layout>
  );
}


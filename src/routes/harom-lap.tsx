import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardBack, CardFace } from "@/components/TarotCard";
import { pickCards, type TarotCard } from "@/data/cards";
import { aiTarotReadingHU, type TarotReadingHU } from "@/lib/roxy.functions";
import { PaywallDialog } from "@/components/PaywallDialog";
import { withHungarianArticle } from "@/lib/huGrammar";

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
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cards, setCards] = useState<TarotCard[] | null>(null);
  const [reversedFlags, setReversedFlags] = useState<boolean[]>([]);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [reading, setReading] = useState<TarotReadingHU | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const aiReading = useServerFn(aiTarotReadingHU);

  function draw() {
    setCards(pickCards(3));
    setReversedFlags([Math.random() < 0.3, Math.random() < 0.3, Math.random() < 0.3]);
    setRevealed([false, false, false]);
    setReading(null);
  }

  useEffect(() => {
    if (!cards || !revealed.every(Boolean)) return;
    let cancelled = false;
    setLoadingReading(true);
    aiReading({
      data: {
        spread: "three",
        cards: cards.map((c, i) => ({
          id: c.id,
          name: c.name,
          keywords: c.keywords,
          general: c.general,
          love: c.love,
          decision: c.decision,
          warning: c.warning,
          daily: c.daily,
          reversed: reversedFlags[i] === true,
        })),
        question: question || undefined,
        category,
      },
    })
      .then((r) => {
        if (cancelled) return;
        if (r.ok && r.reading) setReading(r.reading);
        setLoadingReading(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingReading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cards, revealed, reversedFlags]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Három lap"
        title="Múlt · Jelen · Jövő"
        lead="Három lap, egy ív. Nem külön-külön, hanem együtt mond valamit."
      />
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-20 space-y-8">
        {!cards && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              draw();
            }}
            className="surface p-6 md:p-7 space-y-5 max-w-2xl mx-auto"
          >
            <div>
              <label className="block text-sm text-ivory/80 mb-2">
                Mire kérdezel? <span className="text-ivory/50">(opcionális)</span>
              </label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pl. Most lépjek-e tovább ebben?"
                className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-ivory/80 mb-2">Kategória</label>
              <select
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
            <button type="submit" className="btn-gold w-full md:w-auto">
              Húzom a három lapot
            </button>
          </form>
        )}

        {cards && (
          <>
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto">
              {cards.map((c, i) => (
                <div key={i}>
                  <div className="text-center text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-2">
                    {LABELS[i]}
                  </div>
                  {revealed[i] ? (
                    <CardFace card={c} reversed={reversedFlags[i] === true} />
                  ) : (
                    <button
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
                  <div className="md:col-span-2 text-ivory/55 text-sm font-editorial italic">
                    Egy pillanat — személyes olvasatot készítek…
                  </div>
                )}
                {question.trim() && (
                  <Section eyebrow="A kérdésedre" title={`„${question.trim()}”`}>
                    {reading?.questionAnswer ??
                      threeCardQuestionFallback(question, cards[1], category)}
                  </Section>
                )}
                <Section eyebrow="Múlt — honnan jön ez a helyzet?">
                  {reading?.past ?? cards[0].general}
                </Section>
                <Section eyebrow="Jelen — mi történik most valójában?">
                  {reading?.present ?? cards[1].general}
                </Section>
                <Section eyebrow="Jövő — merre mozdulhat?">
                  {reading?.future ?? cards[2].general}
                </Section>
                <Section eyebrow="A három lap együtt">
                  {reading?.together ?? (
                    <>
                      Ami {cards[0].keywords[0]}-ként indult, most {cards[1].keywords[0]} formájában
                      kér figyelmet, és {cards[2].keywords[0]} felé hív. Nem három különálló dolog —
                      egy ív, ami most rajtad keresztül folytatódik.
                    </>
                  )}
                </Section>
                <Section eyebrow="Mire figyelj most?">{reading?.warn ?? cards[1].warning}</Section>
                <Section eyebrow="Egy mondatban az üzenet">
                  <em>{reading?.oneLine ?? cards[2].daily}</em>
                </Section>
              </div>
            )}

            <div className="text-center pt-4">
              <button onClick={() => setCards(null)} className="btn-ghost-gold">
                Új húzás
              </button>
              <div className="mt-6 border-t border-[oklch(0.78_0.10_80/0.15)] pt-6">
                <div className="text-sm text-ivory/70 mb-2">
                  Részletes, írott elemzést kérsz emailben?
                </div>
                <button className="btn-gold" onClick={() => setPaywall(true)}>
                  Három lap — mély elemzés · 1990 Ft
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
        productSlug="harom_lap_mely"
        sourceRoute="/harom-lap"
        inputPayload={{ cards: cards?.map((c) => c.name), question, category }}
      />
    </Layout>
  );
}

function threeCardQuestionFallback(question: string, card: TarotCard, category: string): string {
  return `A kérdésedre ${withHungarianArticle(card.name)} azt mutatja, hogy a ${category} témájában most nem a gyors lezárás, hanem a jelen helyzet pontosabb érzékelése visz közelebb. A válasz inkább abban látszik, hogy ${card.keywords[0].toLowerCase()} minősége támogat-e vagy feszít benned.`;
}

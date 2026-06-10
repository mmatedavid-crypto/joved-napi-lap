import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { HUDateInput } from "@/components/HUDateInput";
import { aiTarotReadingHU, roxyTarotDraw, roxyTarotLove, type TarotReadingHU } from "@/lib/roxy.functions";
import { normalizeRoxyDraw, normalizeRoxySpread } from "@/lib/roxyNormalize";
import { mapRoxyToLocal, toAIInput, type LocalDrawn } from "@/lib/roxyCardMap";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";
import { getReadingContext, saveReadingMemory } from "@/lib/readingMemory.functions";
import { getGuestReadingContext, recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/randi-elott")({
  head: () => ({
    meta: [
      { title: "Randi előtt — szerelmi tarot húzás | Jövőd.hu" },
      {
        name: "description",
        content:
          "Egy lap a kapcsolatról, mielőtt írsz vagy találkoztok. Finom, elegáns magyar olvasat.",
      },
    ],
    links: [{ rel: "canonical", href: "/randi-elott" }],
  }),
  component: Page,
});

const SITUATIONS = [
  "randi előtt",
  "randi után",
  "most ismerkedünk",
  "nem ír vissza",
  "ex / visszatérő történet",
  "nem tudom, mit akar",
];

function Page() {
  const { user } = useAuth();
  const [myDob, setMyDob] = useState("");
  const [hisDob, setHisDob] = useState("");
  const [myName, setMyName] = useState("");
  const [hisName, setHisName] = useState("");
  const [sit, setSit] = useState(SITUATIONS[0]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<1 | 3>(1);
  const [drawn, setDrawn] = useState<LocalDrawn[] | null>(null);
  const [reading, setReading] = useState<TarotReadingHU | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const aiReading = useServerFn(aiTarotReadingHU);
  const drawOne = useServerFn(roxyTarotDraw);
  const drawLove = useServerFn(roxyTarotLove);
  const loadMemory = useServerFn(getReadingContext);
  const saveMemory = useServerFn(saveReadingMemory);

  async function draw(e: React.FormEvent) {
    e.preventDefault();
    setDrawing(true);
    setDrawError(null);
    setReading(null);
    try {
      const seed = `love:${Date.now()}:${Math.floor(Math.random() * 1_000_000)}`.slice(0, 60);
      const question = q || sit;
      if (type === 1) {
        const r = await drawOne({ data: { count: 1, allowReversals: true, seed } });
        if (!r.ok) {
          setDrawError("A húzás most nem érkezett meg. Próbáld újra.");
          return;
        }
        const mapped = mapRoxyToLocal(normalizeRoxyDraw(r.data));
        if (mapped.length < 1) {
          setDrawError("Üres húzás — próbáld újra.");
          return;
        }
        setDrawn(mapped.slice(0, 1));
      } else {
        const r = await drawLove({ data: { seed, question } });
        if (!r.ok) {
          setDrawError("A húzás most nem érkezett meg. Próbáld újra.");
          return;
        }
        const spread = normalizeRoxySpread(r.data);
        const cards = spread.positions
          .slice(0, 3)
          .map((p) => p.card!)
          .filter(Boolean);
        const mapped = mapRoxyToLocal(cards);
        if (mapped.length < 3) {
          setDrawError("A húzás nem teljes — próbáld újra.");
          return;
        }
        setDrawn(mapped);
      }
    } finally {
      setDrawing(false);
    }
  }

  useEffect(() => {
    if (!drawn) return;
    const drawnLocal = drawn;
    let cancelled = false;
    setLoadingReading(true);
    async function load() {
      const guestMemory = getGuestReadingContext({
        readingType: "love",
        topic: q || sit,
        situation: sit,
        limit: 5,
      });
      let memoryContext: string | undefined =
        guestMemory.contextText || guestMemory.themeSummary || undefined;
      if (user) {
        try {
          const memory = await loadMemory({
            data: { readingType: "love", topic: q || sit, situation: sit, limit: 5 },
          });
          memoryContext = memory.contextText || memory.themeSummary || undefined;
        } catch {
          /* memory is optional */
        }
      }
      return aiReading({
        data: {
          spread: drawnLocal.length === 3 ? "love-3" : "love-1",
          cards: drawnLocal.map((d) => toAIInput(d)),
          question: q || sit,
          category: sit,
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
            readingType: "love",
            topic: q || sit,
            question: q || undefined,
            situation: sit,
            sourceRoute: "/randi-elott",
            title: "Randi előtt",
            summary: r.reading.questionAnswer || r.reading.cardMessage || r.reading.oneLine,
            oneSentence: r.reading.oneLine,
            anchors: [sit, ...cardNames],
          });
          if (user) {
            saveMemory({
              data: {
                readingType: "love",
                topic: q || sit,
                question: q || undefined,
                situation: sit,
                sourceRoute: "/randi-elott",
                title: "Randi előtt",
                summary: r.reading.questionAnswer || r.reading.cardMessage || r.reading.oneLine,
                oneSentence: r.reading.oneLine,
                anchors: [sit, ...cardNames],
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
  }, [drawn, aiReading, loadMemory, q, saveMemory, sit, user]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Randi előtt"
        title="Egy lap a kapcsolatról"
        lead="Egy kis tisztánlátás, mielőtt írsz, találkozol, vagy döntesz."
      />
      <div className="mx-auto max-w-4xl px-4 md:px-6 pb-20 space-y-8">
        {!cards && (
          <form onSubmit={draw} className="surface p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <F id="date-my-name" label="Te (név, opcionális)">
                <input
                  id="date-my-name"
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  className={inp}
                />
              </F>
              <F id="date-his-name" label="Ő (név, opcionális)">
                <input
                  id="date-his-name"
                  value={hisName}
                  onChange={(e) => setHisName(e.target.value)}
                  className={inp}
                />
              </F>
              <HUDateInput
                label="Születési dátumod (opcionális)"
                value={myDob}
                onChange={setMyDob}
              />
              <HUDateInput
                label="Az ő születési dátuma (opcionális)"
                value={hisDob}
                onChange={setHisDob}
              />
            </div>
            <F id="date-situation" label="A helyzet">
              <select
                id="date-situation"
                value={sit}
                onChange={(e) => setSit(e.target.value)}
                className={sel}
              >
                {SITUATIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </F>
            <F id="date-question" label="Konkrét kérdés (opcionális)">
              <input
                id="date-question"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Pl. Komolyan gondolja?"
                className={inp}
              />
            </F>
            <F id="date-draw-type" label="Húzás típusa">
              <select
                id="date-draw-type"
                value={type}
                onChange={(e) => setType(Number(e.target.value) as 1 | 3)}
                className={sel}
              >
                <option value={1}>1 lapos gyors húzás</option>
                <option value={3}>3 lapos kapcsolat-húzás</option>
              </select>
            </F>
            <button className="btn-gold" disabled={drawing}>
              {drawing ? "Húzás..." : "Húzom a lapot"}
            </button>
            {drawError && <p className="text-sm text-ivory/60">{drawError}</p>}
          </form>
        )}
        <GuestMemoryInsightPanel readingType="love" topic={q || sit} situation={sit} />
        {drawn && (
          <>
            <div
              className={`grid gap-4 ${drawn.length === 1 ? "max-w-[260px] mx-auto" : "grid-cols-3 max-w-2xl mx-auto"}`}
            >
              {drawn.map((d, i) => (
                <CardFace
                  key={i}
                  card={d.card}
                  reversed={d.reversed}
                  label={drawn.length === 3 ? ["Te", "Köztetek", "Ő"][i] : undefined}
                />
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {loadingReading && !reading && (
                <ReadingLoadingState
                  kind="tarot"
                  title="A kapcsolati olvasat készül"
                  className="md:col-span-2"
                />
              )}
              {reading && (
                <>
                  {q.trim() && reading.questionAnswer && (
                    <Section eyebrow="A kérdésedre" title={`„${q.trim()}”`}>
                      {reading.questionAnswer}
                    </Section>
                  )}
                  {drawn.length === 3 ? (
                    <>
                      {reading.you && (
                        <Section eyebrow="Te" title={drawn[0].card.name}>
                          {reading.you}
                        </Section>
                      )}
                      {reading.between && (
                        <Section eyebrow="A helyzet köztetek" title={drawn[1].card.name}>
                          {reading.between}
                        </Section>
                      )}
                      {reading.them && (
                        <Section eyebrow="Ő" title={drawn[2].card.name}>
                          {reading.them}
                        </Section>
                      )}
                    </>
                  ) : (
                    (reading.cardMessage || reading.intro) && (
                      <Section eyebrow="A helyzet üzenete" title={drawn[0].card.name}>
                        {reading.cardMessage ?? reading.intro}
                      </Section>
                    )
                  )}
                  {reading.warn && <Section eyebrow="Mire figyelj?">{reading.warn}</Section>}
                  {reading.oneLine && (
                    <Section eyebrow="Egy mondatban">
                      <em>{reading.oneLine}</em>
                    </Section>
                  )}
                </>
              )}
            </div>
            <div className="surface p-5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-1">
                Részletes elemzés
              </div>
              <div className="font-display text-xl text-ivory">Párkapcsolat — mély elemzés</div>
              <p className="font-editorial text-ivory/60 mt-1">
                Mélyebb kapcsolati olvasat 24 órán belül, email értesítéssel és közvetlen rendelési
                hozzáféréssel.
              </p>
              <button className="btn-gold mt-3" onClick={() => setPaywall(true)}>
                {productCtaLabel("Megrendelem", "parkapcsolat_elemzes")}
              </button>
            </div>
            <div className="text-center">
              <button className="btn-ghost-gold" onClick={() => setDrawn(null)}>
                Új húzás
              </button>
            </div>
          </>
        )}
      </div>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="parkapcsolat_elemzes"
        sourceRoute="/randi-elott"
        inputPayload={{
          myName,
          hisName,
          myDob,
          hisDob,
          sit,
          q,
          cards: drawn?.map((d) => d.card.name),
          memoryContext:
            getGuestReadingContext({ readingType: "love", topic: q || sit, situation: sit })
              .contextText || undefined,
        }}
      />
    </Layout>
  );
}

const inp =
  "w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none";
const sel =
  "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";
function F({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-ivory/80 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

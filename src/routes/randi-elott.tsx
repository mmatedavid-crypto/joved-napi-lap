import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { HUDateInput } from "@/components/HUDateInput";
import { aiTarotDrawHU, type TarotSlot } from "@/lib/roxyTranslate.functions";
import { CARDS, type TarotCard } from "@/data/cards";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";
import { saveReadingMemory } from "@/lib/readingMemory.functions";
import { getGuestReadingContext, recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/randi-elott")({
  head: () => ({
    meta: [
      { title: "Szerelmi tarot — kapcsolati húzás | Jövőd.hu" },
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

function localCardFromSlot(slot: TarotSlot): TarotCard {
  const id = slot.roxy.localId;
  const found = id ? CARDS.find((c) => c.id === id) : null;
  return found ?? CARDS[0];
}

function Page() {
  const { user } = useAuth();
  const [myDob, setMyDob] = useState("");
  const [hisDob, setHisDob] = useState("");
  const [myName, setMyName] = useState("");
  const [hisName, setHisName] = useState("");
  const [sit, setSit] = useState(SITUATIONS[0]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<1 | 3>(1);
  const [slots, setSlots] = useState<TarotSlot[] | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const drawCards = useServerFn(aiTarotDrawHU);
  const saveMemory = useServerFn(saveReadingMemory);

  async function draw(e: React.FormEvent) {
    e.preventDefault();
    setDrawing(true);
    setDrawError(null);
    try {
      const seed = `love:${Date.now()}:${Math.floor(Math.random() * 1_000_000)}`.slice(0, 60);
      const r = await drawCards({ data: { count: type, allowReversals: true, seed } });
      if (!r.ok || r.slots.length < type) {
        setDrawError("A húzás most nem érkezett meg. Próbáld újra.");
        return;
      }
      setSlots(r.slots.slice(0, type));
    } finally {
      setDrawing(false);
    }
  }

  useEffect(() => {
    if (!slots) return;
    const cardNames = slots.map((s) => localCardFromSlot(s).name);
    const oneLine = slots[slots.length - 1]?.hu.oneLine ?? slots[0]?.hu.oneLine ?? "Szerelmi tarot";
    const summary = slots.map((s) => s.hu.love ?? s.hu.meaning).join(" ");
    recordGuestReadingMemory({
      readingType: "love",
      topic: q || sit,
      question: q || undefined,
      situation: sit,
      sourceRoute: "/randi-elott",
      title: "Szerelmi tarot",
      summary,
      oneSentence: oneLine,
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
          title: "Szerelmi tarot",
          summary,
          oneSentence: oneLine,
          anchors: [sit, ...cardNames],
        },
      }).catch(() => {});
    }
  }, [slots, q, saveMemory, sit, user]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Szerelmi tarot"
        title="Egy lap a kapcsolatról"
        lead="Egy kis tisztánlátás, mielőtt írsz, találkozol, vagy döntesz."
      />
      <div className="mx-auto max-w-4xl px-4 md:px-6 pb-20 space-y-8">
        {!slots && !drawing && (
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
        {drawing && (
          <div className="max-w-2xl mx-auto space-y-6">
            <ReadingLoadingState
              kind="tarot"
              title="A pakli most keveredik"
              steps={[
                "Vegyél egy mély levegőt, és engedd el a gondolataidat.",
                "Képzeld el, hogy körülvesz egy lágy, aranyszínű fény.",
                "Most nem a fejeddel, hanem a szíveddel érzel — hagyd, hogy az vezessen.",
                "Gondolj arra, amire választ keresel. Nem kell szavakat találni, elég az érzés.",
                "A lapok már úton vannak feléd… figyeld a belső rezgést.",
                "A pakli most eldönti, melyik kép tartozik a mai pillanathoz.",
              ]}
            />
            <div className="text-center">
              <div className="inline-block relative w-16 h-16">
                <span className="absolute inset-0 rounded-full border border-gold/20 animate-ping" />
                <span className="absolute inset-2 rounded-full border border-gold/40 animate-ping" style={{ animationDelay: "300ms" }} />
                <span className="absolute inset-4 rounded-full bg-gold/10 animate-pulse" />
              </div>
              <p className="mt-4 text-xs tracking-[0.25em] uppercase text-ivory/40">
                Keverés · Kérdezés · Kiválasztás
              </p>
            </div>
          </div>
        )}
        <GuestMemoryInsightPanel readingType="love" topic={q || sit} situation={sit} />
        {slots && (
          <>
            <div className="surface p-5 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-2">
                A te helyzeted
              </div>
              <p className="font-editorial text-ivory/80 italic">
                {sitReflection(sit, type, hisName)}
              </p>
            </div>
            <div
              className={`grid gap-4 ${slots.length === 1 ? "max-w-[260px] mx-auto" : "grid-cols-3 max-w-2xl mx-auto"}`}
            >
              {slots.map((s, i) => (
                <CardFace
                  key={i}
                  card={localCardFromSlot(s)}
                  reversed={s.roxy.reversed}
                  label={slots.length === 3 ? ["Te", "Köztetek", "Ő"][i] : undefined}
                />
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {slots.length === 3 ? (
                <>
                  {slots.map((s, i) => (
                    <Section
                      key={i}
                      eyebrow={["Te", "A helyzet köztetek", "Ő"][i]}
                      title={localCardFromSlot(s).name}
                    >
                      {s.hu.love ?? s.hu.meaning}
                    </Section>
                  ))}
                </>
              ) : (
                <>
                  <Section eyebrow="A lap üzenete" title={localCardFromSlot(slots[0]).name}>
                    {slots[0].hu.meaning}
                  </Section>
                  {slots[0].hu.love && (
                    <Section eyebrow="Szerelmi vonalon">{slots[0].hu.love}</Section>
                  )}
                </>
              )}
              {slots[slots.length - 1]?.hu.oneLine && (
                <div className="md:col-span-2">
                  <Section eyebrow="Egy mondatban">
                    <em>{slots[slots.length - 1].hu.oneLine}</em>
                  </Section>
                </div>
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
              <button className="btn-ghost-gold" onClick={() => setSlots(null)}>
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
          cards: slots?.map((s) => localCardFromSlot(s).name),
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

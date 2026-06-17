import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardBack, CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { aiTarotDrawHU, type TarotSlot } from "@/lib/roxyTranslate.functions";
import { CARDS, type TarotCard } from "@/data/cards";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";
import { SITE_LEGAL } from "@/lib/legal";
import { saveReadingMemory } from "@/lib/readingMemory.functions";
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
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/harom-lap` }],
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

function localCardFromSlot(slot: TarotSlot): TarotCard {
  const id = slot.roxy.localId;
  const found = id ? CARDS.find((c) => c.id === id) : null;
  return found ?? CARDS[0];
}

function threeCardFreeSynthesis(slots: TarotSlot[], question: string, category: string) {
  const cards = slots.map((slot) => ({
    card: localCardFromSlot(slot),
    reversed: slot.roxy.reversed,
    meaning: slot.hu.meaning,
    oneLine: slot.hu.oneLine,
  }));
  const [past, present, future] = cards;
  const questionText = question.trim();
  const situation = questionText
    ? `A kérdésed nem általános: „${questionText}”.`
    : `Most ebben a témában kérsz irányt: ${category}.`;
  const categoryHint = categoryFreeHint(category);
  const pastTone = past.reversed ? "nem teljesen lezárt minta" : "hozott minta";
  const presentTone = present.reversed ? "belső ellenállás" : "most látható középpont";
  const futureTone = future.reversed ? "lassabban nyíló irány" : "lehetséges továbblépés";

  return {
    together: `${situation} A ${past.card.name} a múltban inkább ${pastTone}: azt mutatja, honnan hozod ezt a helyzetet. A ${present.card.name} most a ${presentTone}, ezért nem csak az számít, mit szeretnél, hanem az is, mire reagálsz túl gyorsan vagy túl csendben. A ${future.card.name} nem kész jóslat, hanem ${futureTone}: arra utalhat, merre mozdulhat a történet, ha nem a régi automatikus válaszodat ismétled.`,
    attention: `${categoryHint} Figyeld meg, melyik lapnál érzel feszültséget: a múlt mutatja az ismétlést, a jelen a valódi tétet, a jövő pedig azt, ahol több szabadságod lehet, mint elsőre gondolnád.`,
    oneLine:
      future.oneLine ??
      `${past.card.name}, ${present.card.name} és ${future.card.name} együtt nem lezárást, hanem irányt mutat.`,
  };
}

function categoryFreeHint(category: string): string {
  const normalized = category.toLocaleLowerCase("hu-HU");
  if (normalized.includes("randi") || normalized.includes("ismerked")) {
    return "Ennél a találkozásnál most nem az a legfontosabb, hogy gyorsan címkét kapjon, hanem hogy lásd, milyen tempóban közeledtek.";
  }
  if (normalized.includes("ex") || normalized.includes("visszatér")) {
    return "Visszatérő történetnél érdemes külön figyelni, mi valódi változás, és mi csak ismerős hiányérzet.";
  }
  if (normalized.includes("szerelem")) {
    return "Kapcsolati kérdésnél a lapok inkább a dinamika minőségét mutatják, nem azt, hogy valaki mit fog biztosan tenni.";
  }
  if (normalized.includes("munka")) {
    return "Munkahelyi kérdésnél most a ritmus, a felelősség és a saját határaid adhatják a legtöbb információt.";
  }
  if (normalized.includes("pénz")) {
    return "Anyagi témánál ez önismereti jelzés: nem pénzügyi tanács, hanem annak tükre, hol érdemes tisztábban látnod a mintát.";
  }
  if (normalized.includes("család")) {
    return "Családi helyzetben gyakran nem csak a mostani mondat számít, hanem az, milyen régi szerep szólal meg benned.";
  }
  if (normalized.includes("döntés")) {
    return "Döntés előtt a lapok nem helyetted választanak, hanem megmutathatják, melyik belső szempont kér több figyelmet.";
  }
  return "Általános élethelyzetnél a három lap azt segít szétválasztani, mi múltbeli teher, mi jelenlegi tét, és mi lehet új irány.";
}

function threeCardPaidPayload(slots: TarotSlot[] | null, question: string, category: string) {
  if (!slots) return { question, category };
  const synthesis = threeCardFreeSynthesis(slots, question, category);
  return {
    cards: slots.map((slot) => localCardFromSlot(slot).name),
    cardSpread: slots.map((slot, index) => {
      const card = localCardFromSlot(slot);
      return {
        position: LABELS[index],
        cardName: card.name,
        orientation: slot.roxy.reversed ? "fordított" : "álló",
        keywords: card.keywords,
        meaning: slot.hu.meaning,
        oneLine: slot.hu.oneLine,
      };
    }),
    freeSynthesis: {
      together: synthesis.together,
      attention: synthesis.attention,
      oneLine: synthesis.oneLine,
    },
    question,
    category,
  };
}

function HaromLap() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [slots, setSlots] = useState<TarotSlot[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [paywallProduct, setPaywallProduct] = useState<"harom_lap_mely" | "kelta_kereszt">(
    "harom_lap_mely",
  );
  const drawCards = useServerFn(aiTarotDrawHU);
  const saveMemory = useServerFn(saveReadingMemory);

  async function draw() {
    setDrawing(true);
    setDrawError(null);
    try {
      const seed = `three:${Date.now()}:${Math.floor(Math.random() * 1_000_000)}`.slice(0, 60);
      const r = await drawCards({ data: { count: 3, allowReversals: true, seed } });
      if (!r.ok) {
        setDrawError("A húzás most nem érkezett meg. Nem mentettünk félkész olvasatot; indíts új húzást nyugodtan.");
        return;
      }
      if (r.slots.length < 3) {
        setDrawError("A húzás nem teljes. Nem mentettünk félkész olvasatot; indíts új húzást nyugodtan.");
        return;
      }
      setSlots(r.slots.slice(0, 3));
      setRevealed([false, false, false]);
    } finally {
      setDrawing(false);
    }
  }

  useEffect(() => {
    if (!slots || !revealed.every(Boolean)) return;
    const cardNames = slots.map((s) => localCardFromSlot(s).name);
    const oneLine = slots[2]?.hu.oneLine ?? slots[0]?.hu.oneLine ?? "Három lapos húzás";
    const summary = slots.map((s, i) => `${LABELS[i]}: ${s.hu.meaning}`).join(" ");
    recordGuestReadingMemory({
      readingType: "tarot",
      topic: question || category,
      question: question || undefined,
      situation: category,
      sourceRoute: "/harom-lap",
      title: oneLine,
      summary,
      oneSentence: oneLine,
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
          title: oneLine,
          summary,
          oneSentence: oneLine,
          anchors: [category, ...cardNames],
        },
      }).catch(() => {});
    }
  }, [slots, revealed, category, question, saveMemory, user]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Három lap"
        title="Múlt · Jelen · Jövő"
        lead="Három lap, egy ív. Nem külön-külön, hanem együtt mond valamit."
      />
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-20 space-y-8">
        {!slots && !drawing && (
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

        {drawing && (
          <div className="max-w-2xl mx-auto space-y-6">
            <ReadingLoadingState
              kind="tarot"
              title="A pakli most keveredik"
              steps={[
                "Tartsd magad előtt a kérdést, amelyhez a három lapot kéred.",
                "Az első lap a kiinduló mintát, a második a jelen feszültségét, a harmadik az irányt keresi.",
                "Nem külön lapmagyarázat készül, hanem egy összefüggő történet.",
                "A húzás azt figyeli, mi ismétlődik, mi nyílik, és mire érdemes ránézned.",
                "Nem biztos jövőt keresünk, hanem használható belső térképet.",
                "A pakli azt a három képet emeli ki, amelyik ehhez a kérdéshez tartozik.",
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

        <GuestMemoryInsightPanel
          readingType="tarot"
          topic={question || category}
          situation={category}
        />

        {slots && (
          <>
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-3xl mx-auto">
              {slots.map((s, i) => (
                <div key={i}>
                  <div className="text-center text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-2">
                    {LABELS[i]}
                  </div>
                  {revealed[i] ? (
                    <CardFace card={localCardFromSlot(s)} reversed={s.roxy.reversed} />
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
                {slots.map((s, i) => (
                  <Section key={i} eyebrow={LABELS[i]} title={localCardFromSlot(s).name}>
                    {s.hu.meaning}
                  </Section>
                ))}
                {(() => {
                  const synthesis = threeCardFreeSynthesis(slots, question, category);
                  return (
                    <>
                      <div className="md:col-span-2">
                        <Section eyebrow="A három lap együtt">
                          {synthesis.together}
                        </Section>
                      </div>
                      <div className="md:col-span-2">
                        <Section eyebrow="Mire figyelj most?">
                          {synthesis.attention}
                        </Section>
                      </div>
                      <div className="md:col-span-2">
                        <Section eyebrow="Egy mondatban az üzenet">
                          <em>{synthesis.oneLine}</em>
                        </Section>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="text-center pt-4">
              <button onClick={() => setSlots(null)} className="btn-ghost-gold">
                Új húzás
              </button>
              <div className="mt-6 border-t border-[oklch(0.78_0.10_80/0.15)] pt-6">
                <div className="text-sm text-ivory/70 mb-2">Részletes, írott elemzést kérsz?</div>
                <p className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-ivory/58">
                  A három lap mély elemzése a most húzott múlt-jelen-jövő ívet bontja ki, általában
                  néhány percen belül. Ha a kérdés nagyobb, több szereplős vagy régóta húzódik, a
                  Kelta kereszt 10 pozícióban nézi meg a rejtett mintákat is.
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
          ...threeCardPaidPayload(slots, question, category),
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

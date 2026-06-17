import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { SmartReadingFollowup } from "@/components/SmartReadingFollowup";
import { HUDateInput } from "@/components/HUDateInput";
import { aiTarotDrawHU, type TarotSlot } from "@/lib/roxyTranslate.functions";
import { CARDS, type TarotCard } from "@/data/cards";
import { SITE_LEGAL } from "@/lib/legal";
import { saveReadingMemory } from "@/lib/readingMemory.functions";
import { recordGuestReadingMemory } from "@/lib/guestReadingMemory";
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
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/randi-elott` }],
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

function loveQuestionSynthesis(slots: TarotSlot[], sit: string, question: string, hisName: string) {
  const him = hisName.trim() || "ő";
  const cards = slots.map((slot) => ({
    card: localCardFromSlot(slot),
    reversed: slot.roxy.reversed,
    oneLine: slot.hu.oneLine,
  }));
  const questionText = question.trim();
  const opening = questionText
    ? `A kérdésedre figyelve: „${questionText}”.`
    : `A helyzeted most innen indul: ${sit}.`;
  const situation = loveSituationHint(sit, him);

  if (cards.length === 1) {
    const card = cards[0];
    const direction = card.reversed ? "óvatosságot és belső visszatartást" : "egy tisztább irányt";
    return {
      heading: "Mit mutat ez rólatok?",
      text: `${opening} A ${card.card.name} ebben a kapcsolati térben ${direction} jelezhet. ${situation} Ez nem bizonyíték arra, hogy ${him} mit fog tenni, inkább azt mutatja, milyen tempóban érdemes olvasnod a jeleket.`,
      oneLine:
        card.oneLine ??
        `A ${card.card.name} most nem biztos választ, hanem kapcsolati tempót mutat.`,
    };
  }

  const [you, between, them] = cards;
  return {
    heading: "A három lap együtt",
    text: `${opening} A ${you.card.name} azt mutatja, mit hozol te ebbe a történetbe; a ${between.card.name} a köztetek lévő valódi feszültséget vagy lehetőséget jelzi; a ${them.card.name} pedig inkább ${him} oldalának tempójára utalhat. ${situation} Ha visszatérésről vagy bizonytalanságról van szó, ne csak azt nézd, megjelenik-e, hanem azt is, hogy a közeledés tartósabb figyelemmel jár-e, vagy csak rövid érzelmi hullám.`,
    oneLine:
      them.oneLine ??
      `${you.card.name}, ${between.card.name} és ${them.card.name} együtt a kapcsolati tempót mutatja.`,
  };
}

function loveSituationHint(sit: string, him: string): string {
  switch (sit) {
    case "randi előtt":
      return "Ez a randi most inkább azt taníthatja, hogyan maradj jelen anélkül, hogy előre eldöntenéd a történet végét.";
    case "randi után":
      return "A találkozás utóhangja beszédesebb lehet, mint az első benyomás: figyeld, mi maradt benned nyugodt és mi lett túl hangos.";
    case "most ismerkedünk":
      return "Új ismerkedésnél a vonzalom mellett az számít, megjelenik-e következetes figyelem és valódi kíváncsiság.";
    case "nem ír vissza":
      return "A csend most nem automatikus válasz: inkább azt érdemes nézni, hogy a hallgatás milyen hatást vált ki belőled.";
    case "ex / visszatérő történet":
      return `Visszatérő történetnél ${him} esetleges közeledése csak akkor jelent többet rövid fellángolásnál, ha más tempó és több felelősség is látszik mellette.`;
    case "nem tudom, mit akar":
      return "A bizonytalanságban most az a fontos, hogy ne csak az ő jelzéseit olvasd, hanem a saját nyugalmad hiányát is.";
    default:
      return "A kapcsolati tér most inkább mintát mutat, nem végleges választ.";
  }
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
        setDrawError("A húzás most nem érkezett meg. Nem mentettünk félkész olvasatot; indíts új húzást nyugodtan.");
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
                "Tartsd magad előtt azt a találkozást vagy üzenetet, amiről kérdezel.",
                "A lapok nem ígéretet keresnek, hanem a helyzet érzelmi mintáját.",
                "Külön figyeljük a te tempódat, a köztetek lévő teret és a másik oldal jelzéseit.",
                "Nem kell túlmagyaráznod magadban; elég, ha pontosan megnevezed a helyzetet.",
                "A húzás most azt keresi, hol van valódi közeledés, és hol csak bizonytalanság.",
                "A pakli azt a képet emeli ki, amelyik ehhez a kapcsolati pillanathoz tartozik.",
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
              {(() => {
                const synthesis = loveQuestionSynthesis(slots, sit, q, hisName);
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
            <SmartReadingFollowup
              intent="love"
              readingType="love"
              topic={q || sit}
              situation={sit}
              question={q}
              sourceRoute="/randi-elott"
              inputPayload={{
                myName,
                hisName,
                myDob,
                hisDob,
                sit,
                q,
                cards: slots.map((s) => localCardFromSlot(s).name),
              }}
            />
            <div className="text-center">
              <button className="btn-ghost-gold" onClick={() => setSlots(null)}>
                Új húzás
              </button>
            </div>
          </>
        )}
      </div>
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

function sitReflection(sit: string, type: 1 | 3, hisName: string): string {
  const him = hisName.trim() || "ő";
  switch (sit) {
    case "randi előtt":
      return type === 3
        ? `A lapok arra a találkozásra hangolódnak, ami előtted áll — mit hozol te, mi feszül köztetek, és mit hoz ${him}.`
        : `A lapok a közelgő randira hangolódnak — arra, amivel érdemes belépned a térbe.`;
    case "randi után":
      return type === 3
        ? `A találkozás már megtörtént — most a lapok megmutatják, mit vittél bele te, mi maradt köztetek, és mi mozdult ${him} oldalán.`
        : `A találkozás már megtörtént — a lap arra felel, mi a legfontosabb üzenete annak, ami történt.`;
    case "most ismerkedünk":
      return type === 3
        ? `Egy frissen induló szál — a lapok megmutatják a te alaphangod, a köztetek lévő dinamikát, és ${him} valódi szándékát.`
        : `Egy frissen induló szál — a lap a most legfontosabb felismerést hozza el.`;
    case "nem ír vissza":
      return type === 3
        ? `A csend érzékeny terep. A lapok megmutatják, mit érzel te, mi feszül a kapcsolatban, és valójában mi zajlik ${him} oldalán.`
        : `A csend érzékeny terep — a lap arra felel, mit érdemes most látnod a hallgatás mögött.`;
    case "ex / visszatérő történet":
      return type === 3
        ? `Egy régi szál tér vissza. A lapok megmutatják, hol állsz most te, mi köt még össze, és mi mozgatja ${him} visszatérését.`
        : `Egy régi szál tér vissza — a lap arra felel, mit érdemes most meglátnod ebben az ismétlődésben.`;
    case "nem tudom, mit akar":
      return type === 3
        ? `A bizonytalanság közepén állsz. A lapok megmutatják a te tisztább helyed, a köztetek lévő valódi dinamikát, és ${him} belső irányát.`
        : `A bizonytalanság közepén állsz — a lap arra felel, mit érdemes most tisztábban látnod.`;
    default:
      return `A lapok a megadott helyzetre hangolódnak — figyelj arra, ami először megérint.`;
  }
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { pickCards, type TarotCard } from "@/data/cards";
import { HUDateInput } from "@/components/HUDateInput";
import { aiTarotReadingHU, type TarotReadingHU } from "@/lib/roxy.functions";
import { PaywallDialog } from "@/components/PaywallDialog";
import { withHungarianArticle } from "@/lib/huGrammar";
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
  const [cards, setCards] = useState<TarotCard[] | null>(null);
  const [reversedFlags, setReversedFlags] = useState<boolean[]>([]);
  const [reading, setReading] = useState<TarotReadingHU | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const aiReading = useServerFn(aiTarotReadingHU);
  const loadMemory = useServerFn(getReadingContext);
  const saveMemory = useServerFn(saveReadingMemory);

  function draw(e: React.FormEvent) {
    e.preventDefault();
    setCards(pickCards(type));
    setReversedFlags(Array.from({ length: type }, () => Math.random() < 0.3));
    setReading(null);
  }

  useEffect(() => {
    if (!cards) return;
    const cardsLocal = cards;
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
          spread: cardsLocal.length === 3 ? "love-3" : "love-1",
          cards: cardsLocal.map((c, i) => ({
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
          recordGuestReadingMemory({
            readingType: "love",
            topic: q || sit,
            question: q || undefined,
            situation: sit,
            sourceRoute: "/randi-elott",
            title: "Randi előtt",
            summary: r.reading.questionAnswer || r.reading.cardMessage || r.reading.oneLine,
            oneSentence: r.reading.oneLine,
            anchors: [sit, ...cards.map((card) => card.name)],
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
                anchors: [sit, ...cards.map((card) => card.name)],
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
  }, [cards, reversedFlags, aiReading, loadMemory, q, saveMemory, sit, user]);

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
            <button className="btn-gold">Húzom a lapot</button>
          </form>
        )}
        {cards && (
          <>
            <div
              className={`grid gap-4 ${cards.length === 1 ? "max-w-[260px] mx-auto" : "grid-cols-3 max-w-2xl mx-auto"}`}
            >
              {cards.map((c, i) => (
                <CardFace
                  key={i}
                  card={c}
                  reversed={reversedFlags[i] === true}
                  label={cards.length === 3 ? ["Te", "Köztetek", "Ő"][i] : undefined}
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
              {q.trim() && (
                <Section eyebrow="A kérdésedre" title={`„${q.trim()}”`}>
                  {reading?.questionAnswer ?? loveQuestionFallback(q, cards[cards.length - 1], sit)}
                </Section>
              )}
              <Section eyebrow="A helyzet szerint">
                {loveStatusReflection(sit, q, cards[cards.length - 1])}
              </Section>
              {cards.length === 3 ? (
                <>
                  <Section eyebrow="Te" title={cards[0].name}>
                    {reading?.you ?? loveSituationFallback(sit, cards[0], "you")}
                  </Section>
                  <Section eyebrow="A helyzet köztetek" title={cards[1].name}>
                    {reading?.between ?? loveSituationFallback(sit, cards[1], "between")}
                  </Section>
                  <Section eyebrow="Ő" title={cards[2].name}>
                    {reading?.them ?? loveSituationFallback(sit, cards[2], "them")}
                  </Section>
                </>
              ) : (
                <Section eyebrow="A helyzet üzenete" title={cards[0].name}>
                  {reading?.cardMessage ?? reading?.intro ?? loveSituationFallback(sit, cards[0])}
                </Section>
              )}
              <Section eyebrow="Egy mondatban">
                <em>{reading?.oneLine ?? cards[cards.length - 1].daily}</em>
              </Section>
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
              <button className="btn-ghost-gold" onClick={() => setCards(null)}>
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
          cards: cards?.map((c) => c.name),
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

function loveQuestionFallback(question: string, card: TarotCard, situation: string): string {
  return `A „${question}” kérdésre ${withHungarianArticle(card.name)} nem biztos választ ad, inkább irányt: ${loveSituationLead(situation)} most a ${card.keywords[0].toLowerCase()} minőségét taníthatja. Érdemes lehet azt nézned, hogy a másik viselkedése mellett te nyugodtabbnak vagy bizonytalanabbnak érzed-e magad.`;
}

function loveStatusReflection(situation: string, question: string, card: TarotCard): string {
  const keyword = card.keywords[0].toLowerCase();
  if (situation === "ex / visszatérő történet") {
    return `Ex vagy visszatérő történetnél a valódi kérdés ritkán csak az, hogy visszajön-e. A ${card.name} inkább azt mutatja, milyen minőségben térhet vissza ez a kapcsolat: ${keyword} formájában. Rövid visszacsúszásra utalhat, ha csak a hiány, nosztalgia vagy megszokás mozdítja meg. Tartósabb irány akkor látszik, ha a visszatérés mellett tisztább szándék, következetesebb jelenlét és másfajta felelősség is megjelenik.`;
  }
  if (situation === "nem ír vissza") {
    return `A csend most nem bizonyíték arra, hogy mit érez, inkább azt mutatja, hogyan hat rád a bizonytalanság. A ${card.name} arra kérhet, hogy ne csak az üzenetet várd, hanem figyeld meg: ebben a várakozásban te mennyire maradsz önmagadnál.`;
  }
  if (situation === "randi előtt") {
    return `Ez a randi most nem vizsga, hanem találkozási pont. A ${card.name} szerint azt érdemes figyelned, hogy a ${keyword} minősége oldottabbá tesz-e köztetek valamit, vagy inkább szerepbe kényszerít.`;
  }
  if (situation === "randi után") {
    return `Ez a találkozó utólag nem csak abból olvasható, mit mondott a másik. A ${card.name} inkább azt kérdezi: a testedben több nyugalom vagy több feszültség maradt utána?`;
  }
  if (situation === "most ismerkedünk") {
    return `Ismerkedésnél a kezdeti szikra mellett a tempó számít. A ${card.name} azt mutathatja, hogy a ${keyword} minősége akkor jó jel, ha nem csak egyszeri intenzitásként, hanem ismétlődő figyelemként is megjelenik.`;
  }
  if (situation === "nem tudom, mit akar") {
    return `Ha nem látod, mit akar, ez a lap nem helyette mond választ. Inkább azt mutatja, hogy a ${keyword} körül hol homályosodik el a helyzet, és mit kellene tisztábban látnod, mielőtt még többet beleteszel.`;
  }
  return question.trim()
    ? `A megadott kérdésedhez ez a helyzet a ${keyword} minőségén keresztül kapcsolódik.`
    : `Ez a helyzet most a ${keyword} minőségét teszi láthatóvá.`;
}

function loveSituationFallback(
  situation: string,
  card: TarotCard,
  position: "you" | "between" | "them" | "single" = "single",
): string {
  const lead = loveSituationLead(situation);
  if (position === "you") {
    return `${lead} azt mutathatja, hogy te most a ${card.keywords[0].toLowerCase()} minőségén keresztül érkezel ebbe a kapcsolódásba. ${card.love}`;
  }
  if (position === "between") {
    return `${lead} köztetek most nem kész választ, hanem tükröt ad: ${withHungarianArticle(card.name)} szerint ez a helyzet a ${card.keywords[0].toLowerCase()} témáját hozhatja felszínre. ${card.love}`;
  }
  if (position === "them") {
    return `${lead} arra is rávilágíthat, milyen minőséget érzékelsz a másik oldaláról. A ${card.name} itt óvatosan, nem biztos állításként mutat irányt: ${card.love}`;
  }
  return `${lead} most ezt taníthatja: ${withHungarianArticle(card.name)} szerint a ${card.keywords[0].toLowerCase()} minősége lesz az, amit érdemes észrevenned. ${card.love}`;
}

function loveSituationLead(situation: string): string {
  switch (situation) {
    case "randi előtt":
      return "Ez a randi";
    case "randi után":
      return "Ez a találkozó";
    case "most ismerkedünk":
      return "Ez az ismerkedés";
    case "nem ír vissza":
      return "Ez a csend";
    case "ex / visszatérő történet":
      return "Ez a visszatérő történet";
    case "nem tudom, mit akar":
      return "Ez a bizonytalanság";
    default:
      return "Ez a helyzet";
  }
}

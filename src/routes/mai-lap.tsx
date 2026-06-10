import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { StreamingText } from "@/components/StreamingText";
import { ShareCardButton } from "@/components/ShareCardButton";
import { CardBack, CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { CARDS, dailySeed, pickCards, type TarotCard } from "@/data/cards";
import { loadLocal, saveLocal, todayKey } from "@/lib/storage";
import { aiTarotReadingHU, type TarotReadingHU } from "@/lib/roxy.functions";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";

export const Route = createFileRoute("/mai-lap")({
  head: () => ({
    meta: [
      { title: "Mai lap — napi tarot húzás | Jövőd.hu" },
      {
        name: "description",
        content: "Húzz egy napi tarot lapot. Rövid, elegáns magyar üzenet a mai napodra.",
      },
    ],
    links: [{ rel: "canonical", href: "/mai-lap" }],
  }),
  component: MaiLap,
});

type Daily = { date: string; cardId: string; reversed?: boolean };

function MaiLap() {
  const [card, setCard] = useState<TarotCard | null>(null);
  const [reversed, setReversed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reading, setReading] = useState<TarotReadingHU | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallProduct, setPaywallProduct] = useState<"napi_lap_ai" | "extra_huzas">(
    "napi_lap_ai",
  );
  const [alreadyDrawnToday, setAlreadyDrawnToday] = useState(false);
  const [extraPaidCard, setExtraPaidCard] = useState<TarotCard | null>(null);
  const aiReading = useServerFn(aiTarotReadingHU);

  useEffect(() => {
    const stored = loadLocal<Daily>("daily");
    if (stored && stored.date === todayKey()) {
      const c = CARDS.find((x) => x.id === stored.cardId) ?? null;
      setCard(c);
      setReversed(stored.reversed === true);
      setRevealed(true);
      setAlreadyDrawnToday(true);
    }
  }, []);

  function draw() {
    const c = pickCards(1, dailySeed() + Math.floor(Math.random() * 1000))[0];
    const rev = Math.random() < 0.3; // ~30% chance, mint a klasszikus pakliban
    setCard(c);
    setReversed(rev);
    setReading(null);
    setAlreadyDrawnToday(true);
    saveLocal<Daily>("daily", { date: todayKey(), cardId: c.id, reversed: rev });
  }

  useEffect(() => {
    if (!card || !revealed) return;
    const currentCard = card;
    let cancelled = false;
    setLoadingReading(true);
    aiReading({
      data: {
        spread: "single",
        cards: [
          {
            id: currentCard.id,
            name: currentCard.name,
            keywords: currentCard.keywords,
            general: currentCard.general,
            love: currentCard.love,
            decision: currentCard.decision,
            warning: currentCard.warning,
            daily: currentCard.daily,
            reversed,
          },
        ],
        dateKey: todayKey(),
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
  }, [aiReading, card, revealed, reversed]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Napi rituálé"
        title="Mai lap"
        lead="Egy lap, egy üzenet a mai napodra. Engedd, hogy szóljon hozzád."
      />
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-20">
        {!card && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-56">
              <CardBack />
            </div>
            <button className="btn-gold" onClick={draw}>
              Húzom a mai lapom
            </button>
          </div>
        )}
        {card && (
          <div className="grid md:grid-cols-[260px,1fr] gap-8 md:gap-10 items-start">
            <div className="mx-auto w-full max-w-[260px]">
              {revealed ? (
                <CardFace card={card} reversed={reversed} />
              ) : (
                <button onClick={() => setRevealed(true)} className="block w-full">
                  <CardBack />
                </button>
              )}
              {!revealed && (
                <p className="text-center text-ivory/60 text-sm mt-3">
                  Koppints a lapra a felfedéshez
                </p>
              )}
            </div>
            {revealed && (
              <div className="space-y-4">
                {alreadyDrawnToday && (
                  <div className="rounded-md border border-[oklch(0.78_0.10_80/0.25)] bg-[oklch(0.78_0.10_80/0.06)] px-3 py-2 text-xs text-ivory/70 font-editorial italic">
                    Ma már húztál lapot. Egy nap egy lap — így marad tiszta az üzenet. Ha mégis új
                    nézőpontot szeretnél, kérhetsz extra húzást.
                  </div>
                )}
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                    A mai lapod
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl text-ivory mt-1">{card.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-3 text-sm text-ivory/60">
                    {card.keywords.map((k) => (
                      <span key={k}>· {k}</span>
                    ))}
                  </div>
                </div>
                {loadingReading && !reading && (
                  <ReadingLoadingState kind="tarot" title="A napi lapod készül" />
                )}
                <Section eyebrow="Mit üzen ma?">
                  <StreamingText
                    text={reading?.cardMessage ?? reading?.intro ?? card.general}
                    instant={!reading}
                  />
                </Section>
                <Section eyebrow="Mire figyelj?">
                  <StreamingText text={reading?.warn ?? card.warning} instant={!reading} />
                </Section>
                <Section eyebrow="Egy mondat, amit vigyél magaddal">
                  <StreamingText as="em" text={reading?.oneLine ?? card.daily} instant={!reading} />
                </Section>
                <div className="pt-2">
                  <ShareCardButton
                    card={card}
                    oneLine={reading?.oneLine ?? card.daily}
                    eyebrow="A mai lapod"
                  />
                </div>
                <div className="pt-3 border-t border-[oklch(0.78_0.10_80/0.15)] mt-4">
                  <div className="text-sm text-ivory/70 mb-2">
                    Mélyebb, személyre szabott üzenetet szeretnél?
                  </div>
                  <button
                    className="btn-gold"
                    onClick={() => {
                      setPaywallProduct("napi_lap_ai");
                      setPaywallOpen(true);
                    }}
                  >
                    {productCtaLabel("Kérek személyes olvasatot", "napi_lap_ai")}
                  </button>
                  {alreadyDrawnToday && (
                    <div className="mt-4 rounded-md border border-[oklch(0.78_0.10_80/0.16)] p-4">
                      <div className="text-sm text-ivory/72">
                        Második nézőpontot kérsz a mai napra?
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ivory/50">
                        Az extra húzás nem írja felül a napi lapodat. Fizetés után külön olvasatként
                        kapsz egy új lapot és egy új szempontot arra, ami ma még benned mozog.
                      </p>
                      <button
                        className="btn-ghost-gold mt-3"
                        onClick={() => {
                          setExtraPaidCard(pickCards(1, Date.now() % 1_000_000)[0]);
                          setPaywallProduct("extra_huzas");
                          setPaywallOpen(true);
                        }}
                      >
                        {productCtaLabel("Extra napi húzás", "extra_huzas")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <PaywallDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        productSlug={paywallProduct}
        sourceRoute="/mai-lap"
        inputPayload={
          card
            ? {
                cardId: paywallProduct === "extra_huzas" ? (extraPaidCard?.id ?? card.id) : card.id,
                cardName:
                  paywallProduct === "extra_huzas" ? (extraPaidCard?.name ?? card.name) : card.name,
                question:
                  paywallProduct === "extra_huzas"
                    ? "Második nézőpontot kérek a mai napra."
                    : "Mire figyeljek ma?",
                category: paywallProduct === "extra_huzas" ? "extra napi húzás" : "mai lap",
              }
            : undefined
        }
      />
    </Layout>
  );
}

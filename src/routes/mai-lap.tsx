import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { StreamingText } from "@/components/StreamingText";
import { ShareCardButton } from "@/components/ShareCardButton";
import { CardBack, CardFace } from "@/components/TarotCard";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { CARDS, type TarotCard } from "@/data/cards";
import { loadLocal, saveLocal, todayKey } from "@/lib/storage";
import {
  aiTarotDailyHU,
  aiTarotDrawHU,
  type TarotCardHU,
  type TarotSlot,
} from "@/lib/roxyTranslate.functions";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { recordGuestReadingMemory } from "@/lib/guestReadingMemory";

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

function localCardFromSlot(slot: TarotSlot): TarotCard {
  const id = slot.roxy.localId;
  const found = id ? CARDS.find((c) => c.id === id) : null;
  return found ?? CARDS[0];
}

function rememberDailyCard(card: TarotCard, reversed: boolean, hu: TarotCardHU | null) {
  recordGuestReadingMemory({
    readingType: "tarot",
    topic: "mai lap",
    situation: reversed ? "fordított lap" : "álló lap",
    sourceRoute: "/mai-lap",
    title: `Mai lap · ${card.name}${reversed ? " fordítva" : ""}`,
    summary: [hu?.oneLine, hu?.meaning].filter(Boolean).join(" ") || `${card.name} napi tarot lap.`,
    oneSentence: hu?.oneLine ?? undefined,
    anchors: [card.name, reversed ? "fordított lap" : "álló lap", ...card.keywords],
  });
}

function MaiLap() {
  const [slot, setSlot] = useState<TarotSlot | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallProduct, setPaywallProduct] = useState<"napi_lap_ai" | "extra_huzas">(
    "napi_lap_ai",
  );
  const [alreadyDrawnToday, setAlreadyDrawnToday] = useState(false);
  const [extraSlot, setExtraSlot] = useState<TarotSlot | null>(null);
  const callDaily = useServerFn(aiTarotDailyHU);
  const callDraw = useServerFn(aiTarotDrawHU);
  const rememberedDrawKeyRef = useRef<string | null>(null);

  const card = slot ? localCardFromSlot(slot) : null;
  const reversed = slot?.roxy.reversed ?? false;
  const hu = slot?.hu ?? null;

  useEffect(() => {
    const stored = loadLocal<Daily>("daily");
    if (stored && stored.date === todayKey()) {
      setDrawing(true);
      callDaily({ data: { dateKey: todayKey() } })
        .then((r) => {
          if (r.ok && r.slot) {
            setSlot(r.slot);
            setRevealed(true);
            setAlreadyDrawnToday(true);
          }
        })
        .finally(() => setDrawing(false));
    }
  }, [callDaily]);

  async function draw() {
    setDrawing(true);
    setDrawError(null);
    try {
      const r = await callDaily({ data: { dateKey: todayKey() } });
      if (!r.ok || !r.slot) {
        setDrawError("A húzás most nem érkezett meg. Próbáld újra egy pillanat múlva.");
        return;
      }
      setSlot(r.slot);
      setRevealed(false);
      setAlreadyDrawnToday(true);
      const lc = localCardFromSlot(r.slot);
      saveLocal<Daily>("daily", {
        date: todayKey(),
        cardId: lc.id,
        reversed: r.slot.roxy.reversed,
      });
    } finally {
      setDrawing(false);
    }
  }

  async function drawExtra() {
    setDrawing(true);
    try {
      const seed = `extra:${todayKey()}:${Math.floor(Math.random() * 1_000_000)}`;
      const r = await callDraw({ data: { count: 1, allowReversals: true, seed } });
      if (r.ok && r.slots[0]) {
        setExtraSlot(r.slots[0]);
        setPaywallProduct("extra_huzas");
        setPaywallOpen(true);
      }
    } finally {
      setDrawing(false);
    }
  }

  useEffect(() => {
    if (!slot || !revealed) return;
    const lc = localCardFromSlot(slot);
    const memoryKey = `${todayKey()}:${lc.id}:${slot.roxy.reversed ? "reversed" : "upright"}`;
    if (rememberedDrawKeyRef.current === memoryKey) return;
    rememberDailyCard(lc, slot.roxy.reversed, slot.hu);
    rememberedDrawKeyRef.current = memoryKey;
  }, [slot, revealed]);

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
            <button className="btn-gold" onClick={draw} disabled={drawing}>
              {drawing ? "Húzás..." : "Húzom a mai lapom"}
            </button>
            {drawError && <p className="text-sm text-ivory/60">{drawError}</p>}
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
                {drawing && !hu && <ReadingLoadingState kind="tarot" title="A napi lapod készül" />}
                <GuestMemoryInsightPanel
                  readingType="tarot"
                  topic="mai lap"
                  situation={reversed ? "fordított lap" : "álló lap"}
                />
                {hu && (
                  <>
                    {hu.meaning && (
                      <Section eyebrow="Mit üzen ma?">
                        <StreamingText text={hu.meaning} />
                      </Section>
                    )}
                    {hu.oneLine && (
                      <Section eyebrow="Egy mondat, amit vigyél magaddal">
                        <StreamingText as="em" text={hu.oneLine} />
                      </Section>
                    )}
                    <div className="pt-2">
                      <ShareCardButton
                        card={card}
                        oneLine={hu.oneLine ?? ""}
                        eyebrow="A mai lapod"
                      />
                    </div>
                  </>
                )}
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
                        onClick={drawExtra}
                        disabled={drawing}
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
                cardId:
                  paywallProduct === "extra_huzas"
                    ? extraSlot
                      ? localCardFromSlot(extraSlot).id
                      : card.id
                    : card.id,
                cardName:
                  paywallProduct === "extra_huzas"
                    ? extraSlot
                      ? localCardFromSlot(extraSlot).name
                      : card.name
                    : card.name,
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

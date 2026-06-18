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
import { SITE_LEGAL } from "@/lib/legal";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { SmartReadingFollowup } from "@/components/SmartReadingFollowup";

export const Route = createFileRoute("/mai-lap")({
  head: () => ({
    meta: [
      { title: "Mai lap — napi tarot húzás | Jövőd.hu" },
      {
        name: "description",
        content: "Húzz egy napi tarot lapot. Rövid, elegáns magyar üzenet a mai napodra.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/mai-lap` }],
  }),
  component: MaiLap,
});

type Daily = { date: string; cardId: string; reversed?: boolean };

function localCardFromSlot(slot: TarotSlot): TarotCard {
  const id = slot.roxy.localId;
  const found = id ? CARDS.find((c) => c.id === id) : null;
  return found ?? CARDS[0];
}

function rememberDailyCard(
  card: TarotCard,
  reversed: boolean,
  hu: TarotCardHU | null,
  focus: string,
) {
  const cleanFocus = focus.trim();
  recordGuestReadingMemory({
    readingType: "tarot",
    topic: "mai lap",
    question: cleanFocus || undefined,
    situation: cleanFocus || (reversed ? "fordított lap" : "álló lap"),
    sourceRoute: "/mai-lap",
    title: `Mai lap · ${card.name}${reversed ? " fordítva" : ""}`,
    summary:
      [
        cleanFocus ? `Mai fókusz: ${cleanFocus}.` : null,
        hu?.oneLine,
        hu?.meaning,
      ]
        .filter(Boolean)
        .join(" ") || `${card.name} napi tarot lap.`,
    oneSentence: hu?.oneLine ?? undefined,
    anchors: [cleanFocus, card.name, reversed ? "fordított lap" : "álló lap", ...card.keywords].filter(
      Boolean,
    ),
  });
}

function dailyFocusReflection(card: TarotCard, focus: string, reversed: boolean): string {
  const clean = focus.trim();
  if (!clean) {
    return `${card.name} ma nem nagy jóslatként érkezik, hanem figyelmi pontként: azt mutatja, melyik belső minőséget érdemes észrevenned, mielőtt automatikusan reagálnál.`;
  }
  const lower = clean.toLocaleLowerCase("hu-HU");
  const orientation = reversed
    ? "fordított állásban inkább azt kérdezi, hol akadsz el vagy hol húzódsz vissza"
    : "álló lapként inkább azt mutatja, milyen minőségre támaszkodhatsz";
  if (/randi|kapcsolat|szerelem|ex|üzenet|nem ír|ismerked/.test(lower)) {
    return `A „${clean}” helyzetében ${card.name} ${orientation}. Ma nem azt érdemes bizonyítékként keresned, hogy a másik mit fog tenni, hanem azt, milyen tempóban maradsz nyugodt és önazonos.`;
  }
  if (/munka|állás|karrier|projekt|főnök|pénz|fizetés/.test(lower)) {
    return `A „${clean}” témájában ${card.name} ${orientation}. A lap most azt segíthet látni, hol van valódi felelősséged, és hol viszel túl sok feszültséget puszta megfelelésből.`;
  }
  if (/dönt|válassz|lépjek|maradjak|menjek|igen|nem/.test(lower)) {
    return `A „${clean}” kérdésében ${card.name} ${orientation}. Nem dönt helyetted, inkább megmutathatja, melyik válasz mögött van több belső nyugalom, és melyik csak a bizonytalanság gyors csökkentése.`;
  }
  if (/család|anya|apa|gyerek|barát|barátnő/.test(lower)) {
    return `A „${clean}” helyzetében ${card.name} ${orientation}. Ma érdemes különválasztanod, mi a saját érzésed, és mi az a szerep, amit megszokásból veszel magadra.`;
  }
  return `A „${clean}” témájában ${card.name} ${orientation}. A mai üzenet akkor lesz használható, ha nem általános tanácsként olvasod, hanem egyetlen konkrét helyzetre viszed vissza.`;
}

function MaiLap() {
  const [slot, setSlot] = useState<TarotSlot | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [dailyFocus, setDailyFocus] = useState("");
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
        setDrawError("A húzás most nem érkezett meg. Nem mentettünk félkész olvasatot; indíts új húzást nyugodtan.");
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
    rememberDailyCard(lc, slot.roxy.reversed, slot.hu, dailyFocus);
    rememberedDrawKeyRef.current = memoryKey;
  }, [slot, revealed, dailyFocus]);

  return (
    <Layout>
      <PageHeader
        eyebrow="Napi rituálé"
        title="Mai lap"
        lead="Egy lap, egy napi fókusz a tarot hagyományából. Nem jóslatként kezeljük, hanem csendes önismereti jelként."
      />
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-20">
        {!card && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-56">
              <CardBack />
            </div>
            <div className="w-full max-w-md space-y-2">
              <label htmlFor="daily-card-focus" className="block text-sm text-ivory/78">
                Mire kérsz ma finomabb fókuszt?{" "}
                <span className="text-ivory/45">(opcionális)</span>
              </label>
              <input
                id="daily-card-focus"
                value={dailyFocus}
                onChange={(e) => setDailyFocus(e.target.value)}
                maxLength={140}
                placeholder="Pl. randi előtt, munkahelyi döntés, belső nyugtalanság"
                className="w-full rounded-md border border-[oklch(0.78_0.10_80/0.25)] bg-transparent px-4 py-3 text-ivory outline-none placeholder:text-ivory/40 focus:border-gold"
              />
              <p className="text-xs leading-relaxed text-ivory/45">
                A napi lap ugyanaz marad, de az olvasatot ehhez a helyzethez kötjük vissza.
              </p>
            </div>
            <button className="btn-gold" onClick={draw} disabled={drawing}>
              {drawing ? "Húzás..." : "Húzom a mai lapom"}
            </button>
            {drawError && (
              <p
                aria-live="polite"
                className="rounded-md border border-gold/15 bg-gold/[0.06] px-3 py-2 text-sm leading-relaxed text-ivory/68"
              >
                {drawError}
              </p>
            )}
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
                  topic={dailyFocus.trim() || "mai lap"}
                  situation={dailyFocus.trim() || (reversed ? "fordított lap" : "álló lap")}
                />
                <Section eyebrow="A te fókuszodban">
                  <StreamingText text={dailyFocusReflection(card, dailyFocus, reversed)} />
                </Section>
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
                  <SmartReadingFollowup
                    intent="daily"
                    readingType="tarot"
                    topic="mai lap"
                    situation={dailyFocus.trim() || (reversed ? "fordított lap" : "álló lap")}
                    question={dailyFocus.trim() || "Mire figyeljek ma?"}
                    sourceRoute="/mai-lap"
                    inputPayload={{
                      cardId: card.id,
                      cardName: card.name,
                      question: dailyFocus.trim() || "Mire figyeljek ma?",
                      situation: dailyFocus.trim() || undefined,
                      category: "mai lap",
                    }}
                  />
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
                    ? dailyFocus.trim()
                      ? `Második nézőpontot kérek erre: ${dailyFocus.trim()}`
                      : "Második nézőpontot kérek a mai napra."
                    : dailyFocus.trim() || "Mire figyeljek ma?",
                situation: dailyFocus.trim() || undefined,
                category: paywallProduct === "extra_huzas" ? "extra napi húzás" : "mai lap",
              }
            : undefined
        }
      />
    </Layout>
  );
}

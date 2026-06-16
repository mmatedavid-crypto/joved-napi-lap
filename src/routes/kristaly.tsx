import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { aiCrystalHU, type CrystalHU } from "@/lib/roxyTranslate.functions";
import { SIGNS_HU_ORDERED, SIGN_HU } from "@/lib/roxyNormalize";
import {
  crystalMeaning,
  MONTH_HU,
  FALLBACK_BIRTHSTONE,
  FALLBACK_ZODIAC_CRYSTAL,
} from "@/lib/crystal.hu";
import { trackEvent } from "@/lib/analytics";
import { PaywallDialog } from "@/components/PaywallDialog";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { productCtaLabel } from "@/lib/products";
import { SITE_LEGAL } from "@/lib/legal";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { SmartReadingFollowup } from "@/components/SmartReadingFollowup";

export const Route = createFileRoute("/kristaly")({
  head: () => ({
    meta: [
      { title: "Kristály jelentése — születési és horoszkóp kristály | Jövőd.hu" },
      {
        name: "description",
        content:
          "Születési kristály és horoszkóp kristály magyarul. Mit jelképez, milyen minőséget hordoz — önismereti jelként.",
      },
      { property: "og:title", content: "Kristály jelentése | Jövőd.hu" },
      {
        property: "og:description",
        content: "Mai kristályod — születési hónap vagy csillagjegy alapján.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/kristaly` }],
  }),
  component: Page,
});

type Mode = "month" | "zodiac";

function crystalTopic(mode: Mode, month: number, sign: string): string {
  return mode === "month" ? MONTH_HU[month - 1] : SIGN_HU[sign as keyof typeof SIGN_HU];
}

function rememberCrystalReading(reading: CrystalHU, topic: string) {
  recordGuestReadingMemory({
    readingType: "crystal",
    topic: reading.name,
    situation: topic,
    sourceRoute: "/kristaly",
    title: `${reading.name} · ${topic}`,
    summary:
      [reading.oneLine, reading.quality, reading.symbol].filter(Boolean).join(" ") ||
      `${reading.name} kristály · ${topic}`,
    oneSentence: reading.oneLine,
    anchors: [reading.name, topic, reading.quality, reading.symbol],
  });
}

function Page() {
  const callAi = useServerFn(aiCrystalHU);
  const [mode, setMode] = useState<Mode>("month");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [sign, setSign] = useState<string>("aries");
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<CrystalHU | null>(null);
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    trackEvent("crystal_opened");
  }, []);

  async function load({ remember = false }: { remember?: boolean } = {}) {
    setLoading(true);
    const topic = crystalTopic(mode, month, sign);
    try {
      const res = await callAi({
        data: mode === "month" ? { mode: "month", month } : { mode: "zodiac", sign: sign as never },
      });
      if (res.ok && res.reading) {
        if (res.cached) trackEvent("knowledge_cache_hit", { domain: "crystal" });
        else trackEvent("knowledge_cache_miss", { domain: "crystal" });
        setR(res.reading);
        if (remember) rememberCrystalReading(res.reading, topic);
        setLoading(false);
        return;
      } else {
        trackEvent("local_meaning_used", { domain: "crystal" });
      }
    } catch {
      trackEvent("local_meaning_used", { domain: "crystal" });
    }
    // Fallback: helyi kristály-szövegtár.
    let crystalName: string | undefined;
    if (!crystalName && mode === "month") crystalName = FALLBACK_BIRTHSTONE[month];
    if (!crystalName && mode === "zodiac") crystalName = FALLBACK_ZODIAC_CRYSTAL[sign];
    if (!crystalName) crystalName = "Hegyikristály";
    const cm = crystalMeaning(crystalName);
    const fallbackReading = {
      name: cm.name,
      symbol: cm.m.symbol,
      quality: cm.m.quality,
      when: cm.m.when,
      oneLine: cm.m.oneLine,
    };
    setR(fallbackReading);
    if (remember) rememberCrystalReading(fallbackReading, topic);
    setLoading(false);
  }

  useEffect(() => {
    load(); /* initial */ /* eslint-disable-next-line */
  }, []);

  return (
    <Layout>
      <PageHeader
        eyebrow="Kristály"
        title="Mai kristály"
        lead="Egy kő, amit hagyományosan ehhez a hónaphoz vagy jegyhez társítanak. Önismereti jelként."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-6">
        <div className="surface p-5 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("month")}
              className={`px-3 py-1.5 rounded-md border text-sm ${mode === "month" ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
            >
              Születési hónap
            </button>
            <button
              onClick={() => setMode("zodiac")}
              className={`px-3 py-1.5 rounded-md border text-sm ${mode === "zodiac" ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
            >
              Csillagjegy
            </button>
          </div>
          {mode === "month" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {MONTH_HU.map((mo, i) => (
                <button
                  key={mo}
                  onClick={() => setMonth(i + 1)}
                  className={`px-2 py-2 rounded-md border text-sm ${month === i + 1 ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                >
                  {mo}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {SIGNS_HU_ORDERED.map((sg) => (
                <button
                  key={sg}
                  onClick={() => setSign(sg)}
                  className={`px-2 py-2 rounded-md border text-sm ${sign === sg ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                >
                  {SIGN_HU[sg]}
                </button>
              ))}
            </div>
          )}
          <button className="btn-gold" onClick={() => load({ remember: true })} disabled={loading}>
            {loading ? "Egy pillanat…" : "Megnézem"}
          </button>
        </div>

        {loading && !r && <ReadingLoadingState kind="crystal" title="A kristályolvasat készül" />}

        <GuestMemoryInsightPanel
          readingType="crystal"
          topic={r?.name}
          situation={crystalTopic(mode, month, sign)}
        />

        {r && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                Mai kristály
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ivory mt-1">{r.name}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {r.symbol && <Section eyebrow="Mit jelképez?">{r.symbol}</Section>}
              {r.quality && <Section eyebrow="Milyen minőséget hordoz?">{r.quality}</Section>}
              {r.when && <Section eyebrow="Mikor érdemes figyelni rá?">{r.when}</Section>}
              {r.oneLine && (
                <Section eyebrow="Egy mondatban">
                  <em>{r.oneLine}</em>
                </Section>
              )}
            </div>
            <p className="text-xs text-ivory/45 font-editorial text-center">
              A kristályok hagyományosan szimbólumok. Itt önismereti jelként használjuk őket.
            </p>
            <div className="text-center">
              <button className="btn-gold" onClick={() => setPaywall(true)}>
                {productCtaLabel("Személyes kristály-ajánlás", "kristaly_ai")}
              </button>
            </div>
            <SmartReadingFollowup
              intent="crystal"
              readingType="crystal"
              topic={r.name}
              situation={crystalTopic(mode, month, sign)}
              sourceRoute="/kristaly"
              inputPayload={{
                ...(mode === "month" ? { mode, month } : { mode, sign }),
                crystal: r.name,
                situation: crystalTopic(mode, month, sign),
                title: r.oneLine,
              }}
            />
          </div>
        )}
      </div>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="kristaly_ai"
        sourceRoute="/kristaly"
        inputPayload={mode === "month" ? { mode, month } : { mode, sign }}
      />
    </Layout>
  );
}

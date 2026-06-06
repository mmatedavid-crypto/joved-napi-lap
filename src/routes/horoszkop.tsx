import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { aiHoroscopeHU, type HoroscopeHU } from "@/lib/roxyTranslate.functions";
import { SIGNS_HU_ORDERED, SIGN_HU } from "@/lib/roxyNormalize";
import { localHoroscope } from "@/lib/horoscope.hu";
import { todayKey } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/horoszkop")({
  head: () => ({
    meta: [
      { title: "Napi horoszkóp magyarul | Jövőd.hu" },
      {
        name: "description",
        content: "Mai horoszkóp magyarul — rövid, elegáns napi útmutató minden csillagjegyre.",
      },
      { property: "og:title", content: "Napi horoszkóp magyarul | Jövőd.hu" },
      {
        property: "og:description",
        content: "Mai horoszkóp magyarul, csendesen, lényegre törően.",
      },
    ],
    links: [{ rel: "canonical", href: "/horoszkop" }],
  }),
  component: Page,
});

type State = { loading: boolean; sign: string; reading: HoroscopeHU | null; fallback: boolean };

function Page() {
  const call = useServerFn(aiHoroscopeHU);
  const [sign, setSign] = useState<string>("aries");
  const [s, setS] = useState<State>({
    loading: false,
    sign: "aries",
    reading: null,
    fallback: false,
  });

  useEffect(() => {
    trackEvent("horoscope_opened");
  }, []);

  async function load(next: string) {
    setS({ loading: true, sign: next, reading: null, fallback: false });
    try {
      const r = await call({ data: { sign: next as never, dateKey: todayKey() } });
      if (r.ok && r.reading) {
        if (r.cached) trackEvent("roxy_cache_hit", { domain: "horoscope" });
        else trackEvent("roxy_cache_miss", { domain: "horoscope" });
        setS({ loading: false, sign: next, reading: r.reading, fallback: false });
      } else {
        trackEvent("roxy_fallback_used", { domain: "horoscope" });
        setS({ loading: false, sign: next, reading: null, fallback: true });
      }
    } catch {
      trackEvent("roxy_fallback_used", { domain: "horoscope" });
      setS({ loading: false, sign: next, reading: null, fallback: true });
    }
  }

  function onPick(next: string) {
    setSign(next);
    load(next);
  }

  const local = localHoroscope(s.sign);
  const r = s.reading;
  const moon = r?.moonPhase ?? null;
  const color = r?.luckyColor ?? null;
  // Prefer AI HU output; fall back to local copy when a given field is missing or AI failed.
  const mood = r?.mood ?? local.mood;
  const love = r?.love ?? local.love;
  const work = r?.work ?? local.work;
  const warn = r?.warn ?? local.warn;
  const oneLine = r?.oneLine ?? local.oneLine;

  return (
    <Layout>
      <PageHeader
        eyebrow="Napi horoszkóp"
        title="Mai horoszkóp"
        lead="Válaszd ki a jegyed — egy rövid, csendes olvasat a mai napodra."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-6">
        <div className="surface p-5">
          <label className="block text-sm text-ivory/80 mb-2">Csillagjegy</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {SIGNS_HU_ORDERED.map((sg) => (
              <button
                key={sg}
                onClick={() => onPick(sg)}
                className={`px-2 py-2 rounded-md border text-sm transition ${sign === sg ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80 hover:text-gold"}`}
              >
                {SIGN_HU[sg]}
              </button>
            ))}
          </div>
          {!s.reading && !s.loading && !s.fallback && (
            <p className="text-xs text-ivory/55 mt-3 font-editorial">
              Válassz egy jegyet a mai olvasathoz.
            </p>
          )}
          {s.loading && (
            <p className="text-xs text-ivory/55 mt-3 font-editorial">
              Egy pillanat — most kérjük le.
            </p>
          )}
        </div>

        {(s.reading || s.fallback) && (
          <>
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                A mai jegyed
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ivory mt-1">
                {SIGN_HU[s.sign]}
              </h2>
              {(moon || color) && (
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 text-sm text-ivory/60">
                  {moon && <span>· holdfázis: {moon}</span>}
                  {color && <span>· szerencsés szín: {color}</span>}
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Section eyebrow="Mai hangulat">{mood}</Section>
              <Section eyebrow="Szerelem">{love}</Section>
              <Section eyebrow="Munka">{work}</Section>
              <Section eyebrow="Mire figyelj?">{warn}</Section>
              <Section eyebrow="Egy mondatban">
                <em>{oneLine}</em>
              </Section>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

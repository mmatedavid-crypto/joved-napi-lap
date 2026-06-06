import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { roxyCrystalBirthstone, roxyCrystalZodiac } from "@/lib/roxy.functions";
import { normalizeRoxyCrystal, SIGNS_HU_ORDERED, SIGN_HU } from "@/lib/roxyNormalize";
import { crystalMeaning, MONTH_HU, FALLBACK_BIRTHSTONE, type CrystalMeaning } from "@/lib/crystal.hu";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/kristaly")({
  head: () => ({
    meta: [
      { title: "Kristály jelentése — születési és horoszkóp kristály | Jövőd.hu" },
      { name: "description", content: "Születési kristály és horoszkóp kristály magyarul. Mit jelképez, milyen minőséget hoz elő — önismereti jelként." },
      { property: "og:title", content: "Kristály jelentése | Jövőd.hu" },
      { property: "og:description", content: "Mai kristályod — születési hónap vagy csillagjegy alapján." },
    ],
    links: [{ rel: "canonical", href: "/kristaly" }],
  }),
  component: Page,
});

type Mode = "month" | "zodiac";

function Page() {
  const callMonth = useServerFn(roxyCrystalBirthstone);
  const callZodiac = useServerFn(roxyCrystalZodiac);
  const [mode, setMode] = useState<Mode>("month");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [sign, setSign] = useState<string>("aries");
  const [loading, setLoading] = useState(false);
  const [r, setR] = useState<{ name: string; m: CrystalMeaning } | null>(null);

  useEffect(() => { trackEvent("crystal_opened"); }, []);

  async function load() {
    setLoading(true);
    let crystalName: string | undefined;
    try {
      const res = mode === "month"
        ? await callMonth({ data: { month } })
        : await callZodiac({ data: { sign: sign as never } });
      if (res.ok) {
        if (res.cached) trackEvent("roxy_cache_hit", { domain: "crystal" });
        else trackEvent("roxy_cache_miss", { domain: "crystal" });
        crystalName = normalizeRoxyCrystal(res.data).hungarianName;
      } else {
        trackEvent("roxy_fallback_used", { domain: "crystal" });
      }
    } catch {
      trackEvent("roxy_fallback_used", { domain: "crystal" });
    }
    if (!crystalName && mode === "month") crystalName = FALLBACK_BIRTHSTONE[month];
    if (!crystalName) crystalName = "Hegyikristály";
    setR(crystalMeaning(crystalName));
    setLoading(false);
  }

  useEffect(() => { load(); /* initial */ /* eslint-disable-next-line */ }, []);

  return (
    <Layout>
      <PageHeader eyebrow="Kristály" title="Mai kristály" lead="Egy kő, amit hagyományosan ehhez a hónaphoz vagy jegyhez társítanak. Önismereti jelként." />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-6">
        <div className="surface p-5 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("month")}
              className={`px-3 py-1.5 rounded-md border text-sm ${mode === "month" ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
            >Születési hónap</button>
            <button
              onClick={() => setMode("zodiac")}
              className={`px-3 py-1.5 rounded-md border text-sm ${mode === "zodiac" ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
            >Csillagjegy</button>
          </div>
          {mode === "month" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {MONTH_HU.map((mo, i) => (
                <button key={mo} onClick={() => setMonth(i + 1)}
                  className={`px-2 py-2 rounded-md border text-sm ${month === i + 1 ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                >{mo}</button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {SIGNS_HU_ORDERED.map((sg) => (
                <button key={sg} onClick={() => setSign(sg)}
                  className={`px-2 py-2 rounded-md border text-sm ${sign === sg ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                >{SIGN_HU[sg]}</button>
              ))}
            </div>
          )}
          <button className="btn-gold" onClick={load} disabled={loading}>{loading ? "Egy pillanat…" : "Megnézem"}</button>
        </div>

        {r && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">Mai kristály</div>
              <h2 className="font-display text-3xl md:text-4xl text-ivory mt-1">{r.name}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Section eyebrow="Mit jelképez?">{r.m.symbol}</Section>
              <Section eyebrow="Milyen minőséget hoz elő?">{r.m.quality}</Section>
              <Section eyebrow="Mikor érdemes figyelni rá?">{r.m.when}</Section>
              <Section eyebrow="Egy mondatban"><em>{r.m.oneLine}</em></Section>
            </div>
            <p className="text-xs text-ivory/45 font-editorial text-center">A kristályok hagyományosan szimbólumok. Nem gyógyítanak — önismereti jelként használjuk.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
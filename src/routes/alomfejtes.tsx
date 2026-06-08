import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { aiDreamHU, type DreamHU } from "@/lib/roxyTranslate.functions";
import { dreamTextToSlug } from "@/lib/roxyNormalize";
import { dreamMeaning, DREAM_SLUG_OPTIONS } from "@/lib/dream.hu";
import { trackEvent } from "@/lib/analytics";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";

export const Route = createFileRoute("/alomfejtes")({
  head: () => ({
    meta: [
      { title: "Álomfejtés magyarul — mit jelent az álmom? | Jövőd.hu" },
      {
        name: "description",
        content:
          "Álomfejtés magyarul. Visszatérő álom, álom jelentése, mit jelent az álmom — csendes belső tükör.",
      },
      { property: "og:title", content: "Álomfejtés | Jövőd.hu" },
      { property: "og:description", content: "Mit jelent az álmod? Belső tükör, nem jóslat." },
    ],
    links: [{ rel: "canonical", href: "/alomfejtes" }],
  }),
  component: Page,
});

const EMOTIONS = [
  { v: "fear", l: "félelem" },
  { v: "desire", l: "vágy" },
  { v: "uncertain", l: "bizonytalanság" },
  { v: "calm", l: "nyugalom" },
  { v: "recurring", l: "visszatérő álom" },
  { v: "other", l: "egyéb" },
] as const;

function Page() {
  const call = useServerFn(aiDreamHU);
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState<string>("calm");
  const [chosen, setChosen] = useState<string>(""); // manual fallback slug
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DreamHU | null>(null);
  const [noSymbol, setNoSymbol] = useState(false);
  const [paywall, setPaywall] = useState(false);

  async function run(slug: string) {
    setLoading(true);
    setNoSymbol(false);
    let reading: DreamHU | null = null;
    try {
      const r = await call({ data: { slug } });
      if (r.ok && r.reading) {
        if (r.cached) trackEvent("roxy_cache_hit", { domain: "dream" });
        else trackEvent("roxy_cache_miss", { domain: "dream" });
        reading = r.reading;
      } else {
        trackEvent("roxy_fallback_used", { domain: "dream" });
      }
    } catch {
      trackEvent("roxy_fallback_used", { domain: "dream" });
    }
    if (!reading) {
      const local = dreamMeaning(slug);
      if (local) {
        reading = {
          title: local.title,
          surface: local.surface,
          notice: local.notice,
          oneLine: local.oneLine,
        };
      }
    }
    if (reading) {
      setResult(reading);
      trackEvent("dream_completed", { slug });
    } else {
      setNoSymbol(true);
    }
    setLoading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    trackEvent("dream_started", { emotion });
    const slug = dreamTextToSlug(text);
    if (slug) {
      await run(slug);
      return;
    }
    // fall back to manual symbol picker
    setResult(null);
    setNoSymbol(true);
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Álomfejtés"
        title="Mit álmodtál?"
        lead="Egy belső tükör, nem jóslat. Írd le röviden — egy fő jelet keresünk benne."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-6">
        <form onSubmit={submit} className="surface p-6 space-y-4">
          <div>
            <label className="block text-sm text-ivory/80 mb-2">Mit álmodtál?</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Pl. Egy nagy víz partján álltam, és egy kígyó tekergett mellettem..."
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-ivory/80 mb-2">
              Milyen érzés volt? <span className="text-ivory/45">(opcionális)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((em) => (
                <button
                  type="button"
                  key={em.v}
                  onClick={() => setEmotion(em.v)}
                  className={`px-3 py-1.5 rounded-md border text-sm ${emotion === em.v ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                >
                  {em.l}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-gold" disabled={loading}>
            {loading ? "Egy pillanat…" : "Megfejtem"}
          </button>
        </form>

        {noSymbol && !result && (
          <div className="surface p-6 space-y-3">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
              Nem találtunk fő jelet
            </div>
            <p className="font-editorial text-ivory/80">
              Válaszd ki, mi volt a legerősebb kép az álomban:
            </p>
            <div className="flex flex-wrap gap-2">
              {DREAM_SLUG_OPTIONS.map((o) => (
                <button
                  key={o.slug}
                  type="button"
                  onClick={() => {
                    setChosen(o.slug);
                    run(o.slug);
                  }}
                  className={`px-3 py-1.5 rounded-md border text-sm ${chosen === o.slug ? "border-gold text-gold" : "border-[oklch(0.78_0.10_80/0.22)] text-ivory/80"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                Az álom fő jele
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ivory mt-1">{result.title}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {result.surface && (
                <Section eyebrow="Mit hozhat felszínre?">{result.surface}</Section>
              )}
              {result.notice && <Section eyebrow="Mire figyelhetsz?">{result.notice}</Section>}
              <Section eyebrow="Nem jóslat, inkább belső tükör">
                Az álom nem előrejelzés. Egy belső kép, amit érdemes meghallgatni, de nem szó
                szerint venni.
              </Section>
              {result.oneLine && (
                <Section eyebrow="Egy mondatban">
                  <em>{result.oneLine}</em>
                </Section>
              )}
            </div>
            <div className="text-center pt-2">
              <button className="btn-gold" onClick={() => setPaywall(true)}>
                {productCtaLabel("Rövid személyes álomfejtés", "alomfejtes_rovid")}
              </button>
            </div>
          </div>
        )}
      </div>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="alomfejtes_rovid"
        sourceRoute="/alomfejtes"
        inputPayload={result ? { title: result.title, text } : { text }}
      />
    </Layout>
  );
}

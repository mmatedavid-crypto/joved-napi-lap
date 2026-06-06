import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { aiAngelHU, type AngelHU } from "@/lib/roxyTranslate.functions";
import { angelMeaning, reduceAngel } from "@/lib/angel.hu";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/angyalszam")({
  head: () => ({
    meta: [
      { title: "Angyalszám jelentése — 111, 222, 777, 1111 | Jövőd.hu" },
      {
        name: "description",
        content:
          "Angyalszám jelentése magyarul. Mit üzen a 111, 222, 333, 777, 1111 szám? Rövid, mély olvasat.",
      },
      { property: "og:title", content: "Angyalszám jelentése | Jövőd.hu" },
      {
        property: "og:description",
        content: "Mit üzen az angyalszámod? 111, 222, 333, 777, 1111 jelentése.",
      },
    ],
    links: [{ rel: "canonical", href: "/angyalszam" }],
  }),
  component: Page,
});

function Page() {
  const call = useServerFn(aiAngelHU);
  const [num, setNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [m, setM] = useState<{ number: string; meaning: AngelHU; root: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = num.replace(/\D/g, "").slice(0, 12);
    if (!clean) {
      setErr("Adj meg egy számot — például 111, 222, 777 vagy 1111.");
      return;
    }
    setErr(null);
    setLoading(true);
    trackEvent("angel_number_started", { number: clean });
    let root = reduceAngel(clean);
    let meaning: AngelHU | null = null;
    try {
      const r = await call({ data: { number: clean } });
      if (r.ok && r.reading) {
        if (r.cached) trackEvent("roxy_cache_hit", { domain: "angel" });
        else trackEvent("roxy_cache_miss", { domain: "angel" });
        meaning = r.reading;
        if (r.reading.rootNumber) root = r.reading.rootNumber;
      } else {
        trackEvent("roxy_fallback_used", { domain: "angel" });
      }
    } catch {
      trackEvent("roxy_fallback_used", { domain: "angel" });
    }
    if (!meaning) {
      const local = angelMeaning(clean, root);
      meaning = {
        title: local.title,
        message: local.message,
        love: local.love,
        decision: local.decision,
        warn: local.warn,
        oneLine: local.oneLine,
        rootNumber: root,
      };
    }
    setM({ number: clean, meaning, root });
    setLoading(false);
    trackEvent("angel_number_completed", { number: clean, root });
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Angyalszám"
        title="Mit üzen a számod?"
        lead="Add meg az ismétlődő számot, amit látsz. Egy csendes olvasat következik."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-6">
        <form onSubmit={submit} className="surface p-6 space-y-3">
          <label className="block text-sm text-ivory/80">A szám</label>
          <input
            value={num}
            onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="Pl. 111, 222, 333, 777, 1111"
            inputMode="numeric"
            className="w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory text-center tabular-nums tracking-widest text-2xl focus:border-gold outline-none"
          />
          <p className="text-xs text-ivory/45 font-editorial">Példa: 111, 222, 333, 777, 1111</p>
          {err && <p className="text-sm text-gold">{err}</p>}
          <button className="btn-gold" disabled={loading}>
            {loading ? "Egy pillanat…" : "Megnézem"}
          </button>
        </form>

        {m && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                A számod
              </div>
              <h2 className="font-display text-4xl md:text-5xl text-ivory mt-1 tabular-nums">
                {m.number}
              </h2>
              <div className="mt-2 text-sm text-ivory/60">
                {m.meaning.title} · gyökér: {m.root}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {m.meaning.message && <Section eyebrow="A szám üzenete">{m.meaning.message}</Section>}
              {m.meaning.love && <Section eyebrow="Szerelemben">{m.meaning.love}</Section>}
              {m.meaning.decision && <Section eyebrow="Döntés előtt">{m.meaning.decision}</Section>}
              {m.meaning.warn && <Section eyebrow="Mire figyelj?">{m.meaning.warn}</Section>}
              {m.meaning.oneLine && (
                <Section eyebrow="Egy mondatban">
                  <em>{m.meaning.oneLine}</em>
                </Section>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

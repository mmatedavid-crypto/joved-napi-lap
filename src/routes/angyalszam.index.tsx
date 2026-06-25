import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { aiAngelHU, type AngelHU } from "@/lib/roxyTranslate.functions";
import { ANGEL_NUMBER_PAGES, angelMeaning, reduceAngel } from "@/lib/angel.hu";
import { trackEvent } from "@/lib/analytics";
import { PaywallDialog } from "@/components/PaywallDialog";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { productCtaLabel } from "@/lib/products";
import { SITE_LEGAL } from "@/lib/legal";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { SmartReadingFollowup } from "@/components/SmartReadingFollowup";

export const Route = createFileRoute("/angyalszam/")({
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
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/angyalszam` }],
  }),
  component: Page,
});

function Page() {
  const call = useServerFn(aiAngelHU);
  const [num, setNum] = useState("");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [m, setM] = useState<{ number: string; meaning: AngelHU; root: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);

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
        if (r.cached) trackEvent("knowledge_cache_hit", { domain: "angel" });
        else trackEvent("knowledge_cache_miss", { domain: "angel" });
        meaning = r.reading;
        if (r.reading.rootNumber) root = r.reading.rootNumber;
      } else {
        trackEvent("local_meaning_used", { domain: "angel" });
      }
    } catch {
      trackEvent("local_meaning_used", { domain: "angel" });
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
    recordGuestReadingMemory({
      readingType: "angel",
      topic: clean,
      question: situation.trim() || undefined,
      situation: situation.trim() || meaning.title,
      sourceRoute: "/angyalszam",
      title: `${clean} · ${meaning.title}`,
      summary:
        [meaning.oneLine, meaning.message].filter(Boolean).join(" ") ||
        `${clean} angyalszám · gyökér: ${root}`,
      oneSentence: meaning.oneLine,
      anchors: [clean, `${root}`, meaning.title],
    });
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
          <label htmlFor="angel-number" className="block text-sm text-ivory/80">
            A szám
          </label>
          <input
            id="angel-number"
            value={num}
            onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="Pl. 111, 222, 333, 777, 1111"
            inputMode="numeric"
            className="w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory text-center tabular-nums tracking-widest text-2xl focus:border-gold outline-none"
          />
          <p className="text-xs text-ivory/45 font-editorial">Példa: 111, 222, 333, 777, 1111</p>
          <label htmlFor="angel-situation" className="block text-sm text-ivory/80">
            Milyen helyzetben láttad? <span className="text-ivory/45">(opcionális)</span>
          </label>
          <input
            id="angel-situation"
            value={situation}
            onChange={(e) => setSituation(e.target.value.slice(0, 160))}
            placeholder="Pl. döntés előtt, üzenetre várva, szakítás után"
            className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
          />
          {err && <p className="text-sm text-gold">{err}</p>}
          <button className="btn-gold" disabled={loading}>
            {loading ? "Egy pillanat…" : "Megnézem"}
          </button>
        </form>

        {loading && !m && (
          <ReadingLoadingState kind="angel" title="Az angyalszám olvasata készül" />
        )}

        <GuestMemoryInsightPanel
          readingType="angel"
          topic={m?.number}
          situation={situation.trim() || m?.meaning.title}
        />

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
              <Section eyebrow="A te helyzetedben">
                {angelSituationReflection(m.number, m.root, m.meaning.title, situation)}
              </Section>
              {m.meaning.love && <Section eyebrow="Szerelemben">{m.meaning.love}</Section>}
              {m.meaning.decision && <Section eyebrow="Döntés előtt">{m.meaning.decision}</Section>}
              {m.meaning.warn && <Section eyebrow="Mire figyelj?">{m.meaning.warn}</Section>}
              {m.meaning.oneLine && (
                <Section eyebrow="Egy mondatban">
                  <em>{m.meaning.oneLine}</em>
                </Section>
              )}
            </div>
            <div className="text-center pt-2">
              <button className="btn-gold" onClick={() => setPaywall(true)}>
                {productCtaLabel("Mélyebb olvasat", "angyalszam_ai")}
              </button>
            </div>
            <SmartReadingFollowup
              intent="angel"
              readingType="angel"
              topic={m.number}
              situation={situation.trim() || m.meaning.title}
              question={situation.trim() || undefined}
              sourceRoute="/angyalszam"
              inputPayload={{
                number: m.number,
                root: m.root,
                question: situation.trim() || undefined,
                situation: situation.trim() || undefined,
                title: m.meaning.title,
              }}
            />
          </div>
        )}

        <section className="surface p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            Népszerű angyalszámok
          </div>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-sm">
            {ANGEL_NUMBER_PAGES.map((p) => (
              <li key={p.szam}>
                <Link
                  to="/angyalszam/$szam"
                  params={{ szam: p.szam }}
                  className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 text-center tabular-nums text-ivory/80 hover:text-gold hover:border-gold/50 transition-colors"
                >
                  {p.szam}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="angyalszam_ai"
        sourceRoute="/angyalszam"
        inputPayload={
          m
            ? {
                number: m.number,
                root: m.root,
                question: situation.trim() || undefined,
                situation: situation.trim() || undefined,
                title: m.meaning.title,
              }
            : undefined
        }
      />
    </Layout>
  );
}

function angelSituationReflection(
  number: string,
  root: number,
  title: string,
  situation: string,
): string {
  const cleanSituation = situation.trim();
  const opening = cleanSituation
    ? `A ${number} most nem önmagában érdekes, hanem abban a helyzetben, ahol észrevetted: „${cleanSituation}”.`
    : `A ${number} most a ${title.toLocaleLowerCase("hu-HU")} minőségén keresztül olvasható.`;
  const lower = cleanSituation.toLocaleLowerCase("hu-HU");
  if (/ex|szakítás|visszatér|nem ír|üzenet|kapcsolat|randi|szerelem/.test(lower)) {
    return `${opening} Kapcsolati térben ez inkább arra hívhatja fel a figyelmed, hogy ne csak a másik jelzését várd, hanem azt is nézd meg, milyen ismétlődő érzést indít el benned. A ${root}-es gyökér itt a tempó és a belső válasz mintáját emeli ki.`;
  }
  if (/dönt|munka|állás|pénz|vált|költöz/.test(lower)) {
    return `${opening} Döntési helyzetben ez önismereti jel, nem utasítás: azt kérdezheti, milyen gondolatot erősítesz újra és újra, mielőtt lépnél. A ${root}-es gyökér segít megmutatni, hol kell tisztább belső irány.`;
  }
  if (/félek|szorong|bizonytalan|nehéz|elakadt/.test(lower)) {
    return `${opening} Nehéz érzésnél a szám nem azt mondja, hogy minden megoldódik, hanem azt, hogy érdemes finoman észrevenned, melyik gondolat tér vissza benned túl gyakran. A ${root}-es gyökér ezt a belső ritmust teszi láthatóbbá.`;
  }
  return `${opening} A ${root}-es gyökér alapján ezt most figyelmi jelként érdemes olvasni: mi az a gondolat vagy érzés, amelyik ugyanúgy ismétlődik benned, ahogy maga a szám is ismétlődött?`;
}

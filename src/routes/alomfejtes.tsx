import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { aiDreamHU, type DreamHU } from "@/lib/roxyTranslate.functions";
import { dreamTextToSlug } from "@/lib/roxyNormalize";
import { dreamMeaning, DREAM_SLUG_OPTIONS } from "@/lib/dream.hu";
import { trackEvent } from "@/lib/analytics";
import { SITE_LEGAL } from "@/lib/legal";
import { ReadingLoadingState } from "@/components/ReadingLoadingState";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { SmartReadingFollowup } from "@/components/SmartReadingFollowup";
import { getReadingContext, saveReadingMemory } from "@/lib/readingMemory.functions";
import { getGuestReadingContext, recordGuestReadingMemory } from "@/lib/guestReadingMemory";
import { useAuth } from "@/hooks/useAuth";

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
      {
        property: "og:description",
        content: "Mit jelent az álmod? Hagyományos álomfejtés belső tükörként.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/alomfejtes` }],
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

const EMOTION_LABEL: Record<string, string> = Object.fromEntries(EMOTIONS.map((e) => [e.v, e.l]));

function Page() {
  const { user } = useAuth();
  const call = useServerFn(aiDreamHU);
  const loadMemory = useServerFn(getReadingContext);
  const saveMemory = useServerFn(saveReadingMemory);
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState<string>("calm");
  const [chosen, setChosen] = useState<string>(""); // manual fallback slug
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DreamHU | null>(null);
  const [noSymbol, setNoSymbol] = useState(false);
  const [memoryNote, setMemoryNote] = useState("");

  async function run(slug: string) {
    setLoading(true);
    setNoSymbol(false);
    let reading: DreamHU | null = null;
    try {
      const r = await call({ data: { slug } });
      if (r.ok && r.reading) {
        if (r.cached) trackEvent("knowledge_cache_hit", { domain: "dream" });
        else trackEvent("knowledge_cache_miss", { domain: "dream" });
        reading = r.reading;
      } else {
        trackEvent("local_meaning_used", { domain: "dream" });
      }
    } catch {
      trackEvent("local_meaning_used", { domain: "dream" });
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
      const guestMemory = getGuestReadingContext({
        readingType: "dream",
        topic: reading.title,
        situation: emotion,
        limit: 5,
      });
      setMemoryNote(guestMemory.themeSummary || guestMemory.insightText || "");
      recordGuestReadingMemory({
        readingType: "dream",
        topic: reading.title,
        question: text.trim() || undefined,
        situation: EMOTION_LABEL[emotion] ?? emotion,
        sourceRoute: "/alomfejtes",
        title: reading.title,
        summary: reading.oneLine || reading.notice || reading.surface || reading.title,
        oneSentence: reading.oneLine,
        anchors: [reading.title, EMOTION_LABEL[emotion] ?? emotion],
      });
      if (user) {
        try {
          const memory = await loadMemory({
            data: { readingType: "dream", topic: reading.title, situation: emotion, limit: 5 },
          });
          setMemoryNote(memory.themeSummary || memory.contextText || "");
          await saveMemory({
            data: {
              readingType: "dream",
              topic: reading.title,
              question: text.trim() || undefined,
              situation: EMOTION_LABEL[emotion] ?? emotion,
              sourceRoute: "/alomfejtes",
              title: reading.title,
              summary: reading.oneLine || reading.notice || reading.surface || reading.title,
              oneSentence: reading.oneLine,
              anchors: [reading.title, EMOTION_LABEL[emotion] ?? emotion],
            },
          });
        } catch {
          /* memory is optional */
        }
      }
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
        lead="Hagyományos álomfejtés belső tükörként. Írd le röviden — egy fő jelet keresünk benne."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-6">
        <form onSubmit={submit} className="surface p-6 space-y-4">
          <div>
            <label htmlFor="dream-text" className="block text-sm text-ivory/80 mb-2">
              Mit álmodtál?
            </label>
            <textarea
              id="dream-text"
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

        {loading && !result && <ReadingLoadingState kind="dream" title="Az álomfejtés készül" />}

        <GuestMemoryInsightPanel
          readingType="dream"
          topic={result?.title || text}
          situation={emotion}
        />

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
              {memoryNote && <Section eyebrow="A visszatérő álommintád">{memoryNote}</Section>}
              <Section eyebrow="A te álmodban">
                {dreamContextReflection(text, emotion, result.title)}
              </Section>
              <Section eyebrow="Belső tükör">
                {dreamSafetyNote(result.title)}
              </Section>
              {result.oneLine && (
                <Section eyebrow="Egy mondatban">
                  <em>{result.oneLine}</em>
                </Section>
              )}
            </div>
            <SmartReadingFollowup
              intent="dream"
              readingType="dream"
              topic={result.title}
              situation={emotion}
              question={text}
              sourceRoute="/alomfejtes"
              inputPayload={{ title: result.title, text, emotion }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}

function dreamContextReflection(text: string, emotion: string, symbolTitle: string): string {
  const trimmed = text.trim();
  const feeling = EMOTION_LABEL[emotion] ?? "az ébredés utáni érzés";
  const base = trimmed
    ? `A leírásodban a ${symbolTitle.toLocaleLowerCase("hu-HU")} nem önmagában fontos, hanem azzal együtt, hogy ${feeling} maradt körülötte.`
    : `A ${symbolTitle.toLocaleLowerCase("hu-HU")} most leginkább azon keresztül olvasható, hogy ${feeling} kapcsolódott hozzá.`;
  if (emotion === "recurring") {
    return `${base} Visszatérő álomnál nem az a fő kérdés, hogy “mit jósol”, hanem hogy milyen élethelyzet után jön elő újra ugyanaz a kép. Figyeld meg, milyen döntés, hiány vagy kimondatlan feszültség előzi meg.`;
  }
  if (emotion === "fear") {
    return `${base} Félelemmel kísért álomnál a kép gyakran felnagyít valamit, amit ébren próbálsz kontroll alatt tartani. Nem kell szó szerint venni, inkább azt érdemes nézni, hol érzed most kevésnek a biztonságot.`;
  }
  if (emotion === "desire") {
    return `${base} Vágyhoz kötött álomnál a jel arra mutathat, mihez szeretnél közelebb kerülni, de még nem biztos, hogy tisztán ki mered mondani.`;
  }
  if (emotion === "uncertain") {
    return `${base} Bizonytalanság esetén az álom inkább kérdést hagy maga után: melyik részét próbálod gyorsan megfejteni, pedig valójában időt kérne?`;
  }
  return `${base} Ezt belső tükörként érdemes olvasni: mi volt az a részlet, amelyik ébredés után is veled maradt, és hol kapcsolódik a mostani napjaidhoz?`;
}

function dreamSafetyNote(symbolTitle: string): string {
  if (symbolTitle.toLocaleLowerCase("hu-HU") === "halál") {
    return "A halállal kapcsolatos álom sem halálesetet jósol. Önismereti képként inkább lezárásról, félelemről vagy változásról beszélhet. Ha az álom gyászhoz, krízishez vagy tartós szorongáshoz kapcsolódik, ne maradj egyedül vele; kérj emberi vagy szakmai támogatást.";
  }
  return "Az álom nem szó szerinti jövőjel. A hagyományos álomfejtés inkább belső képként olvassa: milyen érzés, lezárás vagy vágy kér most figyelmet. Ha egy álom tartósan nyomaszt, kérj emberi vagy szakmai támogatást.";
}

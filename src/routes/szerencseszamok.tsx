import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { huTodayKey } from "@/lib/dateKeys";
import { SITE_LEGAL } from "@/lib/legal";

const SITE_URL = SITE_LEGAL.siteUrl;
const TITLE = "Napi szerencseszámok csillagjegy szerint";
const DESCRIPTION =
  "Mai szerencseszámok mind a 12 csillagjegyhez: 6 személyes szám és egy játékos lottótipp, minden nap frissítve.";

const SIGNS = [
  { slug: "kos", name: "Kos", symbol: "♈" },
  { slug: "bika", name: "Bika", symbol: "♉" },
  { slug: "ikrek", name: "Ikrek", symbol: "♊" },
  { slug: "rak", name: "Rák", symbol: "♋" },
  { slug: "oroszlan", name: "Oroszlán", symbol: "♌" },
  { slug: "szuz", name: "Szűz", symbol: "♍" },
  { slug: "merleg", name: "Mérleg", symbol: "♎" },
  { slug: "skorpio", name: "Skorpió", symbol: "♏" },
  { slug: "nyilas", name: "Nyilas", symbol: "♐" },
  { slug: "bak", name: "Bak", symbol: "♑" },
  { slug: "vizonto", name: "Vízöntő", symbol: "♒" },
  { slug: "halak", name: "Halak", symbol: "♓" },
] as const;

const FAQ = [
  {
    question: "Hogyan készülnek a napi szerencseszámok?",
    answer:
      "A napi dátum és a választott csillagjegy együtt adja az aznapi, megismételhető számsort. Ugyanazon a napon ugyanahhoz a jegyhez ugyanazokat a számokat kapod.",
  },
  {
    question: "Növelik a számok a lottónyerés esélyét?",
    answer:
      "Nem. A számok játékos, önismereti inspirációt adnak, nem jelentenek nyerési garanciát és nem változtatják meg a véletlenen alapuló játékok esélyeit.",
  },
  {
    question: "Mikor frissülnek a szerencseszámok?",
    answer: "Minden naptári napon új számsor készül mind a 12 csillagjegyhez.",
  },
] as const;

function hashText(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function dailyNumbers(date: string, sign: string, maximum: number) {
  const random = mulberry32(hashText(`${date}:${sign}:${maximum}`));
  const values = new Set<number>();
  while (values.size < 6) values.add(Math.floor(random() * maximum) + 1);
  return [...values].sort((a, b) => a - b);
}

function todayKey() {
  return huTodayKey();
}

export const Route = createFileRoute("/szerencseszamok")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Jövőd.hu` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/szerencseszamok` },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/szerencseszamok` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          breadcrumbJsonLd([{ label: "Napi szerencseszámok", href: "/szerencseszamok" }]),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          },
        ]),
      },
    ],
  }),
  component: LuckyNumbersPage,
});

function LuckyNumbersPage() {
  const [selectedSign, setSelectedSign] = useState<(typeof SIGNS)[number]>(SIGNS[0]);
  const [lotteryMax, setLotteryMax] = useState(90);
  const [revealed, setRevealed] = useState(false);
  const date = todayKey();
  const numbers = useMemo(
    () => dailyNumbers(date, selectedSign.slug, lotteryMax),
    [date, lotteryMax, selectedSign.slug],
  );

  function reveal() {
    setRevealed(true);
    trackEvent("lucky_numbers_generated", {
      sign: selectedSign.slug,
      lotteryMaximum: lotteryMax,
    });
  }

  return (
    <Layout>
      <Breadcrumb items={[{ label: "Napi szerencseszámok", href: "/szerencseszamok" }]} />
      <PageHeader
        eyebrow="Napi számmisztika"
        title="Mai szerencseszámaid"
        lead="Válaszd ki a csillagjegyed, és nézd meg a mai hat számodat. Egy játékos napi rituálé — nem ígéret, hanem inspiráció."
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-20 md:px-6">
        <section className="surface p-5 md:p-7" aria-labelledby="sign-picker-title">
          <h2 id="sign-picker-title" className="font-display text-2xl text-ivory">
            Melyik a csillagjegyed?
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {SIGNS.map((sign) => {
              const active = sign.slug === selectedSign.slug;
              return (
                <Button
                  key={sign.slug}
                  type="button"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedSign(sign);
                    setRevealed(false);
                  }}
                  className="h-auto flex-col gap-1 py-3"
                >
                  <span aria-hidden="true" className="text-xl">
                    {sign.symbol}
                  </span>
                  <span>{sign.name}</span>
                </Button>
              );
            })}
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm text-ivory/70">Lottótipp számtartománya</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[35, 45, 90].map((maximum) => (
                <Button
                  key={maximum}
                  type="button"
                  size="sm"
                  variant={lotteryMax === maximum ? "secondary" : "ghost"}
                  aria-pressed={lotteryMax === maximum}
                  onClick={() => {
                    setLotteryMax(maximum);
                    setRevealed(false);
                  }}
                >
                  1–{maximum}
                </Button>
              ))}
            </div>
          </fieldset>

          <div className="mt-7 text-center">
            <Button type="button" size="lg" onClick={reveal}>
              Mutasd a mai számaimat
            </Button>
          </div>
        </section>

        {revealed && (
          <section className="surface p-6 text-center md:p-8" aria-live="polite">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold/70">
              {selectedSign.name} · {date.replaceAll("-", ". ")}.
            </div>
            <h2 className="mt-2 font-display text-3xl text-ivory">A mai hat számod</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {numbers.map((number) => (
                <span
                  key={number}
                  className="flex size-14 items-center justify-center rounded-full border border-gold/40 bg-primary/10 font-display text-2xl text-gold shadow-sm"
                >
                  {number}
                </span>
              ))}
            </div>
            <p className="mt-6 font-editorial text-lg text-ivory/75">
              Válassz közülük egyet napi fókusznak, vagy használd a teljes sort játékos
              lottótippként.
            </p>
          </section>
        )}

        <Section title="Mit jelentenek a szerencseszámok?">
          <p>
            A számokhoz régóta társítunk szimbolikus jelentést. A napi számsor segíthet kijelölni
            egy fókuszt, tudatosítani egy választást, vagy egyszerűen megállni egy rövid pillanatra.
            A számok nem jósolják meg a jövőt, és nem garantálnak szerencsét.
          </p>
          <p>
            Ha mélyebben érdekel a születési dátumod jelentése, próbáld ki a{" "}
            <Link to="/sorsszam-kalkulator" className="text-gold hover:underline">
              sorsszám kalkulátort
            </Link>
            , vagy olvasd el a{" "}
            <Link to="/numerologia" className="text-gold hover:underline">
              számmisztika útmutatót
            </Link>
            .
          </p>
        </Section>

        <Section title="Gyakori kérdések">
          {FAQ.map((item) => (
            <div key={item.question}>
              <h3 className="font-display text-xl text-ivory">{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </Section>

        <p className="text-center text-xs leading-relaxed text-ivory/45">
          A szerencseszámok szórakoztató, önismereti tartalmak. Szerencsejátékban mindig játssz
          felelősen; a részvétel kizárólag 18 éven felülieknek ajánlott.
        </p>
      </div>
    </Layout>
  );
}

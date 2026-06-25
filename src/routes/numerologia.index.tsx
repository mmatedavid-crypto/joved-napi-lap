import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { NUMEROLOGY_TYPES } from "@/data/numerologyTypes.hu";
import { LIFE_PATH_NUMBERS } from "@/data/lifePathMeanings.hu";
import { SITE_LEGAL } from "@/lib/legal";

const SITE_URL = SITE_LEGAL.siteUrl;
const TITLE = "Számmisztika magyarul — sorsszám, lélekszám, kifejezésszám";
const DESCRIPTION =
  "Magyar számmisztika útmutató hagyományos értelmezésekkel: sorsszám, lélekszám, személyiségszám, kifejezésszám és személyes év jelentése.";

export const Route = createFileRoute("/numerologia/")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Jövőd.hu` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/numerologia` },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/numerologia` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ label: "Számmisztika", href: "/numerologia" }]),
        ),
      },
    ],
  }),
  component: NumerologyHub,
});

function NumerologyHub() {
  return (
    <Layout>
      <Breadcrumb items={[{ label: "Számmisztika", href: "/numerologia" }]} />
      <PageHeader
        eyebrow="Számmisztika"
        title="Számmisztika magyarul"
        lead="A számmisztika régi jelképrendszere öt fő számon keresztül ad önismereti nézőpontot: sorsszám, lélekszám, személyiségszám, kifejezésszám és személyes év. Mindegyik más réteget világíthat meg az élethelyzetedből."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section title="A számmisztikai kép fő rétegei">
          <p>
            A sorsszám az életutad fő tengelye — a születési dátumodból számolódik. A lélekszám a belső
            motivációdra, a személyiségszám a külső megjelenésedre, a kifejezésszám pedig a tehetségedre
            és visszatérő témáidra adhat nézőpontot. A személyes év azt mutatja, hol tartasz a 9 éves
            ciklusban.
          </p>
        </Section>

        <section className="surface p-5 md:p-7 space-y-3">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
            Sorsszám
          </div>
          <h2 className="font-display text-xl text-ivory/95">Sorsszám 1–9 + mestersz (11, 22, 33)</h2>
          <p className="text-sm text-ivory/70">
            A születési dátumodból számolt fő szám. Az életutadat és a tanulnivalóidat írja le.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {LIFE_PATH_NUMBERS.map((n) => (
              <Link
                key={n}
                to="/sorsszam/$n"
                params={{ n: String(n) }}
                className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-1.5 text-sm hover:text-gold hover:border-gold/50 transition-colors"
              >
                {n}-es
              </Link>
            ))}
          </div>
          <div className="pt-2">
            <Link to="/sorsszam-kalkulator" className="text-sm text-gold hover:underline">
              → Sorsszám kalkulátor
            </Link>
          </div>
        </section>

        {NUMEROLOGY_TYPES.map((t) => (
          <section key={t.slug} className="surface p-5 md:p-7 space-y-3">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
              {t.shortTitle}
            </div>
            <h2 className="font-display text-xl text-ivory/95">{t.title}</h2>
            <p className="text-sm text-ivory/70">{t.lead}</p>
            <div className="pt-1">
              <Link
                to="/numerologia/$type"
                params={{ type: t.slug }}
                className="text-sm text-gold hover:underline"
              >
                → Részletes magyarázat és minden szám
              </Link>
            </div>
          </section>
        ))}

        <Section title="Hogyan használd?">
          <p>
            A legtöbben a sorsszámmal kezdik — ez a leggyorsabb belépési pont. Onnan haladhatsz a
            lélekszámod és a kifejezésszámod felé, ha jobban szeretnéd érteni, miért éppen úgy hozol
            döntéseket, ahogy. A személyes éved pedig nézőpontot adhat arra, miért kerülhetnek most
            elő bizonyos visszatérő témák.
          </p>
        </Section>
      </div>
    </Layout>
  );
}

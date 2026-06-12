import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { NUMEROLOGY_TYPES } from "@/data/numerologyTypes.hu";
import { LIFE_PATH_NUMBERS } from "@/data/lifePathMeanings.hu";

const SITE_URL = "https://jovod.hu";
const TITLE = "Számmisztika magyarul — sorsszám, lélekszám, kifejezésszám";
const DESCRIPTION =
  "Teljes magyar számmisztika útmutató: sorsszám, lélekszám, személyiségszám, kifejezésszám és személyes év jelentése. Számítási módszerek és értelmezések.";

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
    links: [{ rel: "canonical", href: "/numerologia" }],
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
        lead="A számmisztika öt fő száma rajzolja ki a teljes képet rólad: sorsszám, lélekszám, személyiségszám, kifejezésszám és személyes év. Mindegyik más rétegét világítja meg az életednek."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section title="A teljes számmisztika kép">
          <p>
            A sorsszám az életutad fő tengelye — a születési dátumodból számolódik. A lélekszám a belső
            motivációd, a személyiségszám a külső megjelenésed, a kifejezésszám a tehetséged és a
            sorsfeladatod. A személyes év pedig azt mutatja, hol tartasz a 9 éves ciklusban.
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
            döntéseket, ahogy. A személyes éved pedig megmutatja, miért most jönnek azok a témák, amik
            jönnek.
          </p>
        </Section>
      </div>
    </Layout>
  );
}
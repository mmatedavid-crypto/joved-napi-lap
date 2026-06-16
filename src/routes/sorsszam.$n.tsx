import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { LIFE_PATH_MEANINGS_HU, LIFE_PATH_NUMBERS } from "@/data/lifePathMeanings.hu";
import { SITE_LEGAL } from "@/lib/legal";

const VALID = new Set(LIFE_PATH_NUMBERS.map(String));
const SAFE_NUMEROLOGY_PAGE_ERROR =
  "A számmisztikai tartalom most nem töltődött be. Kérlek próbáld újra egy pillanat múlva.";

export const Route = createFileRoute("/sorsszam/$n")({
  beforeLoad: ({ params }) => {
    if (!VALID.has(params.n)) throw notFound();
  },
  head: ({ params }) => {
    const m = LIFE_PATH_MEANINGS_HU[params.n];
    const title = m ? `${m.title} | Jövőd.hu` : `Sorsszám ${params.n} jelentése | Jövőd.hu`;
    const description =
      m?.lead?.slice(0, 158) ??
      `Sorsszám ${params.n} jelentése magyarul: önismereti életút elemzés.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
      links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/sorsszam/${params.n}` }],
      scripts: m
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify(
                breadcrumbJsonLd([
                  { label: "Számmisztika", href: "/numerologia" },
                  { label: m.title, href: `/sorsszam/${params.n}` },
                ]),
              ),
            },
          ]
        : [],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <PageHeader
        eyebrow="Számmisztika"
        title="Ez a sorsszám nem létezik"
        lead="Az érvényes sorsszámok: 1–9, 11, 22 és 33."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center">
        <Link to="/sorsszam-kalkulator" className="btn-gold">
          Sorsszám kalkulátor
        </Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ reset }) => (
    <Layout>
      <PageHeader eyebrow="Hiba" title="Nem sikerült betölteni" lead={SAFE_NUMEROLOGY_PAGE_ERROR} />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center">
        <button onClick={reset} className="btn-gold">
          Újra
        </button>
      </div>
    </Layout>
  ),
  component: SorsszamPage,
});

function SorsszamPage() {
  const { n } = Route.useParams();
  const m = LIFE_PATH_MEANINGS_HU[n];
  if (!m) return null;

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Számmisztika", href: "/numerologia" },
          { label: m.title, href: `/sorsszam/${n}` },
        ]}
      />
      <PageHeader eyebrow={`Sorsszám ${n}`} title={m.title} lead={m.lead} />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section title="A szám alaprezgése">
          <p>{m.essence}</p>
        </Section>
        <Section title="Erősségek">
          <p>{m.strengths}</p>
        </Section>
        <Section title="Árnyékoldal és kihívások">
          <p>{m.shadow}</p>
        </Section>
        <Section title="Szerelem és kapcsolatok">
          <p>{m.love}</p>
        </Section>
        <Section title="Munka és hivatás">
          <p>{m.career}</p>
        </Section>
        <Section title="Önismereti tanács">
          <p>{m.advice}</p>
        </Section>

        <div className="surface p-5 md:p-7 text-center space-y-3">
          <p className="text-ivory/80">
            Szeretnéd a saját sorsszámodat is kiszámolni és személyes elemzést kapni?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/sorsszam-kalkulator" className="btn-gold">
              Sorsszám kalkulátor
            </Link>
            <Link to="/szammisztika" className="btn-ghost">
              Személyes számmisztika
            </Link>
          </div>
        </div>

        <Section title="További sorsszámok">
          <div className="flex flex-wrap gap-2">
            {LIFE_PATH_NUMBERS.map((k) => (
              <Link
                key={k}
                to="/sorsszam/$n"
                params={{ n: String(k) }}
                className={`px-3 py-1 rounded-full border border-ivory/20 hover:border-gold/60 ${String(k) === n ? "bg-gold/20 text-gold" : "text-ivory/80"}`}
              >
                {k}
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </Layout>
  );
}

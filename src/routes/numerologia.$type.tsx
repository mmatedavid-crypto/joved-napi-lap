import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { getNumerologyType, NUMEROLOGY_TYPES } from "@/data/numerologyTypes.hu";

const SITE_URL = "https://jovod.hu";
const VALID = new Set(NUMEROLOGY_TYPES.map((t) => t.slug));
const SAFE_NUMEROLOGY_PAGE_ERROR =
  "A számmisztikai tartalom most nem töltődött be. Kérlek próbáld újra egy pillanat múlva.";

export const Route = createFileRoute("/numerologia/$type")({
  beforeLoad: ({ params }) => {
    if (!VALID.has(params.type as never)) throw notFound();
  },
  head: ({ params }) => {
    const t = getNumerologyType(params.type);
    if (!t) {
      return {
        meta: [{ title: "Számmisztika | Jövőd.hu" }],
        links: [{ rel: "canonical", href: `${SITE_URL}/numerologia/${params.type}` }],
      };
    }
    const title = `${t.title} | Jövőd.hu`;
    return {
      meta: [
        { title },
        { name: "description", content: t.lead.slice(0, 158) },
        { property: "og:title", content: title },
        { property: "og:description", content: t.lead.slice(0, 158) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `${SITE_URL}/numerologia/${t.slug}` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/numerologia/${t.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: t.title,
            description: t.lead,
            inLanguage: "hu",
            url: `${SITE_URL}/numerologia/${t.slug}`,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { label: "Számmisztika", href: "/numerologia" },
              { label: t.shortTitle, href: `/numerologia/${t.slug}` },
            ]),
          ),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <PageHeader
        eyebrow="Számmisztika"
        title="Ez az altípus nem létezik"
        lead="Lélekszám, személyiségszám, kifejezésszám vagy személyes év közül választhatsz."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 text-center">
        <Link to="/numerologia" className="btn-gold">
          Számmisztika főoldal
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
  component: NumerologyTypePage,
});

function NumerologyTypePage() {
  const { type } = Route.useParams();
  const t = getNumerologyType(type);
  if (!t) return null;

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Számmisztika", href: "/numerologia" },
          { label: t.shortTitle, href: `/numerologia/${t.slug}` },
        ]}
      />
      <PageHeader eyebrow="Számmisztika" title={t.title} lead={t.lead} />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section title="Mit jelent?">
          <p>{t.intro}</p>
        </Section>
        <Section title="Hogyan számold ki?">
          <p>{t.howTo}</p>
        </Section>
        <section className="surface p-5 md:p-7 space-y-4">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
            Számok értelmezése
          </div>
          <ul className="space-y-4">
            {t.numbers.map((entry) => (
              <li key={entry.n} className="border-t border-[oklch(0.78_0.10_80/0.12)] pt-4 first:border-0 first:pt-0">
                <h2 className="font-display text-lg text-ivory/95">{entry.title}</h2>
                <p className="mt-2 text-sm text-ivory/75 leading-relaxed">{entry.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="surface p-5 md:p-7">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            További számmisztika
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 text-sm">
            {NUMEROLOGY_TYPES.filter((o) => o.slug !== t.slug).map((o) => (
              <li key={o.slug}>
                <Link
                  to="/numerologia/$type"
                  params={{ type: o.slug }}
                  className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold hover:border-gold/50 transition-colors"
                >
                  {o.shortTitle} →
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/sorsszam-kalkulator"
                className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold hover:border-gold/50 transition-colors"
              >
                Sorsszám kalkulátor →
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  );
}

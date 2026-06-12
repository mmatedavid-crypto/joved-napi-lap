import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { CARDS } from "@/data/cards";

const SITE_URL = "https://jovod.hu";

export const Route = createFileRoute("/tarot/$slug")({
  loader: ({ params }) => {
    const card = CARDS.find((c) => c.id === params.slug);
    if (!card) throw notFound();
    return { card };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Tarot kártya | Jövőd.hu" }] };
    const { card } = loaderData;
    const title = `${card.name} tarot kártya jelentése`;
    const description = `${card.name} tarot lap részletes magyar jelentése: ${card.keywords.join(", ")}. Szerelem, döntés, figyelmeztetés és napi üzenet.`;
    const url = `${SITE_URL}/tarot/${card.id}`;
    return {
      meta: [
        { title: `${title} | Jövőd.hu` },
        { name: "description", content: description },
        { name: "keywords", content: [...card.keywords, "tarot", card.name].join(", ") },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: `/tarot/${card.id}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { label: "Tarot kártyák", href: "/tarot" },
              { label: card.name, href: `/tarot/${card.id}` },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description,
            url,
            inLanguage: "hu-HU",
            articleSection: "Tarot enciklopédia",
            keywords: card.keywords.join(", "),
            publisher: {
              "@type": "Organization",
              name: "Jövőd.hu",
              url: SITE_URL,
              logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo.svg` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
      ],
    };
  },
  component: TarotCardPage,
});

function TarotCardPage() {
  const { card } = Route.useLoaderData();
  const idx = CARDS.findIndex((c) => c.id === card.id);
  const prev = idx > 0 ? CARDS[idx - 1] : CARDS[CARDS.length - 1];
  const next = idx < CARDS.length - 1 ? CARDS[idx + 1] : CARDS[0];

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Tarot kártyák", href: "/tarot" },
          { label: card.name, href: `/tarot/${card.id}` },
        ]}
      />
      <PageHeader
        eyebrow="Tarot kártya jelentése"
        title={`${card.name} jelentése`}
        lead={card.keywords.map((k) => `· ${k}`).join(" ")}
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section eyebrow="Általános jelentés" title={card.name}>
          <p>{card.general}</p>
        </Section>
        <Section eyebrow="Szerelem és kapcsolatok">
          <p>{card.love}</p>
        </Section>
        <Section eyebrow="Döntés előtt">
          <p>{card.decision}</p>
        </Section>
        <Section eyebrow="Figyelmeztetés">
          <p>{card.warning}</p>
        </Section>
        <Section eyebrow="Napi üzenet">
          <p>{card.daily}</p>
        </Section>
        <div className="surface p-5 md:p-7 text-center">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            Húzz lapot a saját kérdésedhez
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/mai-lap" className="btn-gold">
              Mai lapom
            </Link>
            <Link
              to="/harom-lap"
              className="rounded-md border border-gold/30 px-4 py-2 text-gold hover:border-gold/60"
            >
              Háromlapos terítés
            </Link>
          </div>
        </div>
        <nav className="surface p-5 grid gap-2 sm:grid-cols-2 text-sm">
          <Link
            to="/tarot/$slug"
            params={{ slug: prev.id }}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold"
          >
            ← {prev.name}
          </Link>
          <Link
            to="/tarot/$slug"
            params={{ slug: next.id }}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold sm:text-right"
          >
            {next.name} →
          </Link>
        </nav>
        <div className="surface p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            További kártyák
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {CARDS.filter((c) => c.id !== card.id)
              .slice(0, 12)
              .map((c) => (
                <li key={c.id}>
                  <Link
                    to="/tarot/$slug"
                    params={{ slug: c.id }}
                    className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 text-ivory/75 hover:text-gold"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
          <div className="mt-4 text-center">
            <Link to="/tarot" className="text-gold hover:text-gold/80 text-sm">
              Mind a 78 lap →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
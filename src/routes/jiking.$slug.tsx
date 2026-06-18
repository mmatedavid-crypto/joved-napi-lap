import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { HEXAGRAMS, findHexagramBySlug } from "@/data/ichingHexagrams.hu";
import { SITE_LEGAL } from "@/lib/legal";

const SITE_URL = SITE_LEGAL.siteUrl;

export const Route = createFileRoute("/jiking/$slug")({
  loader: ({ params }) => {
    const hex = findHexagramBySlug(params.slug);
    if (!hex) throw notFound();
    return { hex };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "I Ching | Jövőd.hu" }] };
    const { hex } = loaderData;
    const title = `${hex.num}. ${hex.name} — I Ching hexagram`;
    const description = `${hex.name} (${hex.trigrams}): ${hex.description}`;
    const url = `${SITE_URL}/jiking/${hex.slug}`;
    return {
      meta: [
        { title: `${title} | Jövőd.hu` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { label: "I Ching", href: "/jiking" },
              { label: `${hex.num}. ${hex.name}`, href: `/jiking/${hex.slug}` },
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
            articleSection: "I Ching",
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
      ],
    };
  },
  component: HexagramPage,
});

function HexagramPage() {
  const { hex } = Route.useLoaderData();
  const idx = HEXAGRAMS.findIndex((h) => h.num === hex.num);
  const prev = HEXAGRAMS[(idx - 1 + HEXAGRAMS.length) % HEXAGRAMS.length];
  const next = HEXAGRAMS[(idx + 1) % HEXAGRAMS.length];

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "I Ching", href: "/jiking" },
          { label: `${hex.num}. ${hex.name}`, href: `/jiking/${hex.slug}` },
        ]}
      />
      <PageHeader
        eyebrow={`${hex.num}. hexagram · ${hex.trigrams}`}
        title={hex.name}
        lead={hex.theme}
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section eyebrow="Leírás">
          <p>{hex.description}</p>
        </Section>
        <Section eyebrow="Útmutatás">
          <p>{hex.guidance}</p>
        </Section>
        <Section eyebrow="Figyelmeztetés">
          <p>{hex.warning}</p>
        </Section>
        <nav className="surface p-5 grid gap-2 sm:grid-cols-2 text-sm">
          <Link
            to="/jiking/$slug"
            params={{ slug: prev.slug }}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold"
          >
            ← {prev.num}. {prev.name}
          </Link>
          <Link
            to="/jiking/$slug"
            params={{ slug: next.slug }}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold sm:text-right"
          >
            {next.num}. {next.name} →
          </Link>
        </nav>
        <div className="text-center">
          <Link to="/jiking" className="text-gold hover:text-gold/80 text-sm">
            Mind a 64 hexagram →
          </Link>
        </div>
      </div>
    </Layout>
  );
}

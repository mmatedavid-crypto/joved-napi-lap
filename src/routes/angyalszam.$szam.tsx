import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import {
  ANGEL_NUMBER_PAGES,
  angelMeaning,
  findAngelNumberPage,
  reduceAngel,
} from "@/lib/angel.hu";

const SITE_URL = "https://jovod.hu";

export const Route = createFileRoute("/angyalszam/$szam")({
  loader: ({ params }) => {
    const page = findAngelNumberPage(params.szam);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Angyalszám jelentése | Jövőd.hu" }] };
    const { page } = loaderData;
    const title = `${page.szam} angyalszám jelentése — mit üzen, ha sokszor látod?`;
    const description = `${page.szam} angyalszám jelentése magyarul: üzenete szerelemben, döntés előtt, és mire figyelj. Részletes, ingyenes értelmezés a Jövőd.hu-n.`;
    const url = `${SITE_URL}/angyalszam/${page.szam}`;
    return {
      meta: [
        { title: `${title} | Jövőd.hu` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: `/angyalszam/${page.szam}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { label: "Angyalszám", href: "/angyalszam" },
              { label: page.szam, href: `/angyalszam/${page.szam}` },
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
            articleSection: "Angyalszámok",
            publisher: {
              "@type": "Organization",
              name: "Jövőd.hu",
              url: SITE_URL,
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/__l5e/assets-v1/e7a03b1f-0f3b-4e01-88c0-c1c4bc3bc3ac/jovod-logo.png`,
              },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
      ],
    };
  },
  component: AngelNumberPageComponent,
});

function AngelNumberPageComponent() {
  const { page } = Route.useLoaderData();
  const root = reduceAngel(page.szam);
  const meaning = angelMeaning(page.szam, root);

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Angyalszám", href: "/angyalszam" },
          { label: page.szam, href: `/angyalszam/${page.szam}` },
        ]}
      />
      <PageHeader
        eyebrow={`Angyalszám · gyökérszám: ${root || "—"}`}
        title={`${page.szam} angyalszám jelentése`}
        lead={page.intro}
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section eyebrow="A számminta" title={`Miért pont a ${page.szam}?`}>
          <p>{page.pattern}</p>
        </Section>
        <Section eyebrow="A szám üzenete" title={meaning.title}>
          <p>{meaning.message}</p>
        </Section>
        <Section eyebrow="Szerelemben">
          <p>{meaning.love}</p>
        </Section>
        <Section eyebrow="Döntés előtt">
          <p>{meaning.decision}</p>
        </Section>
        <Section eyebrow="Mire figyelj?">
          <p>{meaning.warn}</p>
        </Section>
        <Section eyebrow="Egy mondatban">
          <p>
            <em>{meaning.oneLine}</em>
          </p>
        </Section>
        <div className="surface p-5 md:p-7 text-center">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            Saját számod van?
          </div>
          <Link to="/angyalszam" className="btn-gold">
            Angyalszám kalkulátor
          </Link>
        </div>
        <div className="surface p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            További angyalszámok
          </div>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-sm">
            {ANGEL_NUMBER_PAGES.filter((p) => p.szam !== page.szam).map((p) => (
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
        </div>
      </div>
    </Layout>
  );
}
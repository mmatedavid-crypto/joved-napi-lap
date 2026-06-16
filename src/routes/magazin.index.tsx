import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getPublishedMagazinPosts, MAGAZIN_CATEGORIES } from "@/data/magazin.hu";
import { SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/magazin/")({
  head: () => ({
    meta: [
      { title: "Magazin — tarot, asztrológia, számmisztika cikkek | Jövőd.hu" },
      {
        name: "description",
        content:
          "Olvasmányos, józan magyar nyelvű cikkek tarotról, asztrológiáról, számmisztikáról és önismereti rituálékról. Frissülő magazin.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Jövőd.hu Magazin — tarot, asztrológia, önismeret" },
      {
        property: "og:description",
        content: "Cikkek tarotról, asztrológiáról, számmisztikáról és rituálékról. Józan, magyar nyelven.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/magazin` }],
  }),
  component: Page,
});

function Page() {
  const posts = getPublishedMagazinPosts().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Jövőd.hu Magazin",
    description:
      "Cikkek tarotról, asztrológiáról, számmisztikáról és önismereti rituálékról.",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: p.publishedAt,
      url: `/magazin/${p.slug}`,
      keywords: p.keywords.join(", "),
    })),
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="Magazin"
        title="Olvasnivaló önismereti gyakorlóknak"
        lead="Tarot, asztrológia, számmisztika és rituálék — józan magyar nyelven, túlzó ígéretek nélkül."
      />
      <div className="mx-auto max-w-5xl px-4 md:px-6 pb-20 space-y-8">
        <Breadcrumb items={[{ label: "Magazin" }]} />

        <div className="flex flex-wrap gap-2 text-sm">
          {MAGAZIN_CATEGORIES.map((c) => (
            <span
              key={c.slug}
              className="rounded-full border border-gold/25 px-3 py-1 text-ivory/75"
            >
              {c.label}
            </span>
          ))}
        </div>

        <ul className="grid gap-6 md:grid-cols-2">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                to="/magazin/$slug"
                params={{ slug: p.slug }}
                className="block surface p-6 h-full transition-colors hover:border-gold/40"
              >
                <div className="text-[11px] uppercase tracking-widest text-gold/70">
                  {p.categoryLabel} · {p.readMinutes} perc
                </div>
                <h2 className="font-display text-xl text-ivory mt-2">{p.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ivory/70">{p.excerpt}</p>
                <div className="mt-4 text-xs text-ivory/45">{p.publishedAt}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
    </Layout>
  );
}

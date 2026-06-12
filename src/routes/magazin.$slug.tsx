import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getPublishedMagazinPosts } from "@/data/magazin.hu";
import { SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/magazin/$slug")({
  loader: ({ params }) => {
    const post = getPublishedMagazinPosts().find((p) => p.slug === params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.post;
    if (!p) return { meta: [{ title: "Cikk nem található | Jövőd.hu" }] };
    return {
      meta: [
        { title: `${p.title} | Jövőd.hu Magazin` },
        { name: "description", content: p.excerpt },
        { name: "keywords", content: p.keywords.join(", ") },
        { name: "robots", content: "index,follow" },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.excerpt },
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: p.publishedAt },
        { property: "article:section", content: p.categoryLabel },
      ],
      links: [{ rel: "canonical", href: `/magazin/${p.slug}` }],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl text-ivory">Ez a cikk nem található</h1>
        <p className="mt-4 text-ivory/70">
          Térj vissza a{" "}
          <Link to="/magazin" className="text-gold underline">
            magazin főoldalra
          </Link>
          .
        </p>
      </div>
    </Layout>
  ),
  errorComponent: () => (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl text-ivory">Hiba történt</h1>
        <p className="mt-4 text-ivory/70">Kérlek próbáld újra később.</p>
      </div>
    </Layout>
  ),
  component: Page,
});

function Page() {
  const { post } = Route.useLoaderData();
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Organization", name: SITE_LEGAL.operator.shortName },
    publisher: {
      "@type": "Organization",
      name: SITE_LEGAL.operator.shortName,
    },
    keywords: post.keywords.join(", "),
    articleSection: post.categoryLabel,
    mainEntityOfPage: { "@type": "WebPage", "@id": `/magazin/${post.slug}` },
  };

  return (
    <Layout>
      <article className="mx-auto max-w-3xl px-4 md:px-6 py-12 md:py-16">
        <Breadcrumb
          items={[{ label: "Magazin", href: "/magazin" }, { label: post.title }]}
        />

        <div className="mt-6 text-[11px] uppercase tracking-widest text-gold/70">
          {post.categoryLabel} · {post.readMinutes} perc olvasás
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-ivory mt-3">{post.title}</h1>
        <div className="mt-3 text-xs text-ivory/50">
          Közzétéve: {post.publishedAt}
        </div>

        <p className="mt-6 text-lg text-ivory/80 leading-relaxed">{post.excerpt}</p>

        <div className="mt-8 space-y-5 text-ivory/80 leading-relaxed font-editorial">
          {post.body.split("\n\n").map((para: string, i: number) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>

        <hr className="my-10 border-gold/15" />

        <div className="text-sm text-ivory/60">
          <Link to="/" className="text-gold underline">
            Főoldal
          </Link>
          <span className="mx-2">·</span>
          Vissza a{" "}
          <Link to="/magazin" className="text-gold underline">
            magazin főoldalra
          </Link>
          .
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
    </Layout>
  );
}
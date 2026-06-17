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
      links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/magazin/${p.slug}` }],
    };
  },
  notFoundComponent: () => (
    <Layout>
      <ArticleFallback
        eyebrow="Magazin"
        title="Ez a cikk nem található"
        text="Lehet, hogy frissítettük a cikk címét vagy még nincs publikálva. A magazin főoldalán megtalálod a többi tarot, számmisztika és asztrológia témájú írást."
      />
    </Layout>
  ),
  errorComponent: () => (
    <Layout>
      <ArticleFallback
        eyebrow="Magazin"
        title="Most nem töltött be a cikk"
        text="Valami megakadt a cikk megnyitásakor, de a magazin többi oldala továbbra is elérhető. Nyisd meg a magazin főoldalt, vagy térj vissza a kezdőoldalra."
      />
    </Layout>
  ),
  component: Page,
});

function ArticleFallback({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="text-[11px] uppercase tracking-widest text-gold/70">{eyebrow}</div>
      <h1 className="mt-3 font-display text-3xl text-ivory">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ivory/70">{text}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/magazin" className="btn-gold">
          Magazin főoldal
        </Link>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-gold/25 px-5 text-sm text-gold transition-colors hover:border-gold/60"
        >
          Vissza a főoldalra
        </Link>
      </div>
    </div>
  );
}

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

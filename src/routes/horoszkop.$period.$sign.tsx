import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PaywallDialog } from "@/components/PaywallDialog";
import { Section } from "@/components/Section";
import {
  HOROSCOPE_PERIODS,
  PERIOD_LABEL,
  SIGN_BY_SLUG,
  horoscopeArticlePath,
  horoscopeSeoDescription,
  horoscopeSeoTitle,
  periodDateLabel,
  type HoroscopePeriodHU,
  type HoroscopeNewsArticle,
  type HoroscopeNewsSection,
} from "@/lib/horoscopeNews";
import { productCtaLabel } from "@/lib/products";
import { SIGN_HU, SIGNS_HU_ORDERED } from "@/lib/roxyNormalize";

const SITE_URL = "https://jovod.hu";

function articleDateTime(period: HoroscopePeriodHU, dateKey: string): string {
  const dayKey = period === "havi" ? `${dateKey}-01` : dateKey;
  return `${dayKey}T06:00:00+00:00`;
}

export const Route = createFileRoute("/horoszkop/$period/$sign")({
  loader: async ({ params }) => {
    if (!HOROSCOPE_PERIODS.includes(params.period as HoroscopePeriodHU)) throw notFound();
    if (!SIGN_BY_SLUG[params.sign]) throw notFound();
    const { getHoroscopeNewsArticle } = await import("@/lib/horoscopeNews.server");
    return getHoroscopeNewsArticle({
      period: params.period as HoroscopePeriodHU,
      signSlug: params.sign,
    });
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Horoszkóp | Jövőd.hu" },
          { name: "description", content: "Friss napi, heti és havi horoszkóp magyarul." },
          { name: "robots", content: "index,follow" },
        ],
        links: [],
      };
    }
    const canonicalPath = `/horoszkop/${loaderData.period}/${loaderData.signSlug}`;
    const title = horoscopeSeoTitle(loaderData.period, loaderData.signName);
    const description = horoscopeSeoDescription(loaderData.period, loaderData.signName);
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;
    const articleDate = articleDateTime(loaderData.period, loaderData.dateKey);
    return {
      meta: [
        { title: `${title} | Jövőd.hu` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonicalUrl },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "robots", content: loaderData.fallbackUsed ? "noindex,follow" : "index,follow" },
      ],
      links: [{ rel: "canonical", href: canonicalPath }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: title,
            description,
            url: canonicalUrl,
            inLanguage: "hu-HU",
            datePublished: articleDate,
            dateModified: articleDate,
            isAccessibleForFree: true,
            articleSection: "Horoszkóp",
            publisher: {
              "@type": "Organization",
              name: "Jövőd.hu",
              url: SITE_URL,
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/brand/logo.svg`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": canonicalUrl,
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Jövőd.hu", item: SITE_URL },
              {
                "@type": "ListItem",
                position: 2,
                name: "Horoszkóp",
                item: `${SITE_URL}/horoszkop`,
              },
              { "@type": "ListItem", position: 3, name: title, item: canonicalUrl },
            ],
          }),
        },
      ],
    };
  },
  component: HoroscopeArticlePage,
});

function HoroscopeArticlePage() {
  const article = Route.useLoaderData() as HoroscopeNewsArticle;
  const [paywall, setPaywall] = useState(false);
  const siblingSigns = SIGNS_HU_ORDERED.map((sign) => ({
    sign,
    name: SIGN_HU[sign],
    path: horoscopeArticlePath(article.period, sign),
  }));

  return (
    <article className="mx-auto max-w-3xl px-4 md:px-6 pt-4 pb-20">
      <div className="text-[10px] tracking-[0.35em] uppercase text-[oklch(0.78_0.10_80/0.8)] text-center">
        {PERIOD_LABEL[article.period]} · {article.signName} · {periodDateLabel(article.period)}
      </div>
      <h1 className="font-display text-4xl md:text-5xl text-ivory leading-[1.1] text-center mt-3">
        {horoscopeSeoTitle(article.period, article.signName)}
      </h1>
      <p className="font-editorial text-ivory/75 text-xl leading-relaxed text-center mt-5">
        {article.lead}
      </p>

      <div className="flex flex-wrap justify-center gap-2 text-xs text-ivory/55 mt-6">
        {article.moonPhase && <span>Hold: {article.moonPhase}</span>}
        {article.luckyColor && <span>Szín: {article.luckyColor}</span>}
        {article.luckyNumber != null && <span>Szám: {article.luckyNumber}</span>}
      </div>

      <div className="mt-10 space-y-5">
        {article.sections.map((section: HoroscopeNewsSection) => (
          <Section key={section.heading} eyebrow={section.heading}>
            <p>{section.text}</p>
          </Section>
        ))}
      </div>

      <section className="mt-10 surface p-5 md:p-7">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
              Személyes olvasat
            </div>
            <h2 className="font-display text-2xl text-ivory mt-1">
              {article.signName} horoszkóp a te helyzetedre
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ivory/62">
              Ha nem csak általános jegyszöveget szeretnél, kérhetsz rövid, személyes olvasatot a
              mostani témádhoz igazítva.
            </p>
          </div>
          <button className="btn-gold" onClick={() => setPaywall(true)}>
            {productCtaLabel("Személyes horoszkóp", "horoszkop_szemelyre")}
          </button>
        </div>
      </section>

      <nav className="mt-10 surface p-5">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
          További jegyek
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {siblingSigns.map((s) => (
            <Link
              key={s.sign}
              to={s.path}
              className={`rounded-md border px-3 py-2 transition-colors ${
                s.sign === article.sign
                  ? "border-gold text-gold"
                  : "border-[oklch(0.78_0.10_80/0.18)] text-ivory/75 hover:text-gold"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      </nav>
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="horoszkop_szemelyre"
        sourceRoute={horoscopeArticlePath(article.period, article.sign)}
        inputPayload={{
          sign: article.signName,
          situation: `${PERIOD_LABEL[article.period]} horoszkóp · ${periodDateLabel(article.period)}`,
        }}
      />
    </article>
  );
}

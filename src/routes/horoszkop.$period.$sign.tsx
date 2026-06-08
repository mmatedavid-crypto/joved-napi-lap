import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Section } from "@/components/Section";
import {
  HOROSCOPE_PERIODS,
  PERIOD_LABEL,
  SIGN_BY_SLUG,
  horoscopeArticlePath,
  periodDateLabel,
  type HoroscopePeriodHU,
  type HoroscopeNewsArticle,
  type HoroscopeNewsSection,
} from "@/lib/horoscopeNews";
import { SIGN_HU, SIGNS_HU_ORDERED } from "@/lib/roxyNormalize";

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
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Horoszkóp"} | Jövőd.hu` },
      { name: "description", content: loaderData?.lead ?? "" },
      { property: "og:title", content: loaderData?.title ?? "" },
      { property: "og:description", content: loaderData?.lead ?? "" },
      { property: "og:type", content: "article" },
      { name: "robots", content: loaderData?.fallbackUsed ? "noindex,follow" : "index,follow" },
    ],
    links: loaderData
      ? [{ rel: "canonical", href: `/horoszkop/${loaderData.period}/${loaderData.signSlug}` }]
      : [],
  }),
  component: HoroscopeArticlePage,
});

function HoroscopeArticlePage() {
  const article = Route.useLoaderData() as HoroscopeNewsArticle;
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
        {article.title}
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
    </article>
  );
}

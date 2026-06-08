import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import {
  allHoroscopeArticlePaths,
  HOROSCOPE_PERIODS,
  PERIOD_LABEL,
  periodDateLabel,
} from "@/lib/horoscopeNews";

export const Route = createFileRoute("/horoszkop")({
  head: () => ({
    meta: [
      { title: "Horoszkóp — napi, heti és havi horoszkóp | Jövőd.hu" },
      {
        name: "description",
        content:
          "Napi, heti és havi horoszkóp magyarul mind a 12 csillagjegynek. Friss, szerkesztett horoszkóp-rovat a Jövőd.hu-n.",
      },
      { property: "og:title", content: "Horoszkóp | Jövőd.hu" },
      {
        property: "og:description",
        content: "Friss napi, heti és havi horoszkóp magyarul mind a 12 csillagjegynek.",
      },
    ],
    links: [{ rel: "canonical", href: "/horoszkop" }],
  }),
  component: HoroszkopIndex,
});

function HoroszkopIndex() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname !== "/horoszkop") {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }

  const paths = allHoroscopeArticlePaths();
  return (
    <Layout>
      <PageHeader
        eyebrow="Horoszkóp"
        title="Napi, heti és havi horoszkóp"
        lead="Friss csillagjegy-rovat magyarul. Válassz időszakot és jegyet."
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 pb-20 space-y-8">
        {HOROSCOPE_PERIODS.map((period) => (
          <section key={period} className="space-y-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                {PERIOD_LABEL[period]} · {periodDateLabel(period)}
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-ivory mt-1">
                {PERIOD_LABEL[period]} csillagjegyek szerint
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {paths
                .filter((p) => p.period === period)
                .map((p) => (
                  <Link
                    key={p.path}
                    to={p.path}
                    className="surface p-4 block hover:border-gold transition-colors"
                  >
                    <span className="font-display text-xl text-ivory">{p.signName}</span>
                    <span className="block text-sm text-ivory/55 mt-1">{PERIOD_LABEL[period]}</span>
                    <span className="block text-sm text-ivory/55 mt-0.5">
                      {periodDateLabel(period)}
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}

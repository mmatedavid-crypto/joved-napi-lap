import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { GuestMemoryInsightPanel } from "@/components/GuestMemoryInsightPanel";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { PaywallDialog } from "@/components/PaywallDialog";
import {
  allHoroscopeArticlePaths,
  HOROSCOPE_PERIODS,
  PERIOD_LABEL,
  periodDateLabel,
} from "@/lib/horoscopeNews";
import { getGuestReadingContext } from "@/lib/guestReadingMemory";
import { SITE_LEGAL } from "@/lib/legal";
import { productCtaLabel } from "@/lib/products";
import { SIGN_HU, SIGNS_HU_ORDERED } from "@/lib/roxyNormalize";

export const Route = createFileRoute("/horoszkop")({
  head: () => {
    const napi = periodDateLabel("napi");
    const havi = periodDateLabel("havi");
    const title = `Horoszkóp ${havi} — napi, heti és havi horoszkóp mind a 12 jegyre`;
    const description = `Mai horoszkóp (${napi}), heti és havi horoszkóp magyarul mind a 12 csillagjegynek. Válaszd ki a jegyed, és olvasd el a friss olvasatot.`;
    return {
      meta: [
        { title: `${title} | Jövőd.hu` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_LEGAL.siteUrl}/horoszkop` },
      ],
      links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/horoszkop` }],
    };
  },
  component: HoroszkopIndex,
});

function HoroszkopIndex() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [name, setName] = useState("");
  const [sign, setSign] = useState("capricorn");
  const [situation, setSituation] = useState("");
  const [paywall, setPaywall] = useState(false);
  const [memoryContext, setMemoryContext] = useState<string | undefined>(undefined);
  if (pathname !== "/horoszkop") {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  }

  const paths = allHoroscopeArticlePaths();
  const signName = SIGN_HU[sign] ?? sign;
  const horoscopeSituation = situation.trim() || "személyes horoszkóp";

  function openPersonalHoroscopePaywall() {
    const memory = getGuestReadingContext({
      readingType: "horoscope",
      topic: signName,
      situation: horoscopeSituation,
      limit: 8,
    });
    setMemoryContext(memory.contextText || memory.themeSummary || undefined);
    setPaywall(true);
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Horoszkóp"
        title="Napi, heti és havi horoszkóp"
        lead="Az asztrológiai hagyomány régi jelképrendszeréből induló, józan magyar olvasat. Válassz időszakot és jegyet."
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 pb-20 space-y-8">
        <section className="surface p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                Személyes horoszkóp
              </div>
              <h2 className="font-display text-2xl text-ivory mt-1">
                Rövid olvasat a mai helyzetedre
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/62">
                Kérhetsz egy rövid, személyre szabott napi horoszkópot: a jegyed hagyományos
                motívumait a mostani kérdésed felől olvassuk.
              </p>
            </div>
            <button className="btn-gold" onClick={openPersonalHoroscopePaywall}>
              {productCtaLabel("Személyes horoszkóp", "horoszkop_szemelyre")}
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="horoscope-paid-name" className="block text-sm text-ivory/80 mb-2">
                Név <span className="text-ivory/45">(opcionális)</span>
              </label>
              <input
                id="horoscope-paid-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="horoscope-paid-sign" className="block text-sm text-ivory/80 mb-2">
                Csillagjegy
              </label>
              <select
                id="horoscope-paid-sign"
                value={sign}
                onChange={(e) => setSign(e.target.value)}
                className={fieldClass}
              >
                {SIGNS_HU_ORDERED.map((item) => (
                  <option key={item} value={item}>
                    {SIGN_HU[item]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="horoscope-paid-situation"
                className="block text-sm text-ivory/80 mb-2"
              >
                Mostani téma <span className="text-ivory/45">(opcionális)</span>
              </label>
              <input
                id="horoscope-paid-situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Pl. szerelem, munka, döntés"
                className={fieldClass}
              />
            </div>
          </div>
          <GuestMemoryInsightPanel
            readingType="horoscope"
            topic={signName}
            situation={horoscopeSituation}
            className="mt-5"
          />
        </section>
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
      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="horoszkop_szemelyre"
        sourceRoute="/horoszkop"
        inputPayload={{
          name,
          sign: signName,
          situation,
          memoryContext,
        }}
      />
    </Layout>
  );
}

const fieldClass =
  "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none";

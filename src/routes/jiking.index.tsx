import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { HEXAGRAMS } from "@/data/ichingHexagrams.hu";
import { PaidCrossSell } from "@/components/PaidCrossSell";
import { SITE_LEGAL } from "@/lib/legal";

const SITE_URL = SITE_LEGAL.siteUrl;
const TITLE = "Ji King jóslás — mit üzen a hexagramod? 64 hexagram magyarul";
const DESCRIPTION =
  "Ji King (I Ching) magyarul: válaszd ki a hexagramodat, és nézd meg, mit üzen. Mind a 64 hexagram jelentése, útmutatása és figyelmeztetése egy helyen.";

export const Route = createFileRoute("/jiking/")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Jövőd.hu` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/jiking` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/jiking` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd([{ label: "I Ching", href: "/jiking" }])),
      },
    ],
  }),
  component: IchingHub,
});

function IchingHub() {
  return (
    <Layout>
      <Breadcrumb items={[{ label: "I Ching", href: "/jiking" }]} />
      <PageHeader
        eyebrow="I Ching / Ji King"
        title="64 hexagram magyarul"
        lead="Az I Ching a Változások könyve: régi kínai jelképrendszer 64 hexagrammal. Válassz egy jelet, és olvasd el józan önismereti nézőpontként, milyen helyzetmintát idéz fel."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section title="Hogyan használd?">
          <p>
            Fogalmazd meg a kérdést, ami foglalkoztat. Nézd át a 64 hexagram nevét és témáját, majd azt válaszd, amelyik segít tisztábban ránézni a helyzetre. A részletes oldalon megtalálod a hexagram leírását, útmutatását és figyelmeztető szempontját.
          </p>
        </Section>
        <section className="surface p-5 md:p-7">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            64 hexagram
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {HEXAGRAMS.map((h) => (
              <li key={h.num}>
                <Link
                  to="/jiking/$slug"
                  params={{ slug: h.slug }}
                  className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold hover:border-gold/50 transition-colors"
                >
                  <span className="block text-ivory/85">
                    {h.num}. {h.name}
                  </span>
                  <span className="block text-xs text-ivory/50 mt-0.5">{h.theme}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <PaidCrossSell />
      </div>
    </Layout>
  );
}

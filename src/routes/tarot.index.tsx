import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { CARDS } from "@/data/cards";
import { SITE_LEGAL } from "@/lib/legal";

const SITE_URL = SITE_LEGAL.siteUrl;
const TITLE = "Tarot kártya jelentések magyarul — mind a 78 lap";
const DESCRIPTION =
  "Tarot kártya enciklopédia magyarul: Nagy Arkánum és kis Arkánum, jelentés szerelemben, döntésben, mindennapokban. Ingyenes, részletes leírás minden laphoz.";

export const Route = createFileRoute("/tarot/")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Jövőd.hu` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/tarot` },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/tarot` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd([{ label: "Tarot kártyák", href: "/tarot" }])),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "hu-HU",
          url: `${SITE_URL}/tarot`,
          isPartOf: { "@type": "WebSite", name: "Jövőd.hu", url: SITE_URL },
        }),
      },
    ],
  }),
  component: TarotHubPage,
});

function TarotHubPage() {
  return (
    <Layout>
      <Breadcrumb items={[{ label: "Tarot kártyák", href: "/tarot" }]} />
      <PageHeader
        eyebrow="Tarot enciklopédia"
        title="Tarot kártya jelentések magyarul"
        lead="Mind a 78 lap részletes magyar olvasattal: általános jelentés, szerelem, döntés, figyelmeztetés és napi üzenet. Válaszd ki a lapot, és olvasd el a teljes leírást."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section title="Kezdd egy ingyenes húzással">
          <p>
            Ha most akarsz választ kapni egy kérdésre, húzz{" "}
            <Link to="/mai-lap" className="text-gold hover:text-gold/80">
              egy lapot mára
            </Link>{" "}
            vagy próbáld a{" "}
            <Link to="/harom-lap" className="text-gold hover:text-gold/80">
              háromlapos múlt-jelen-jövő terítést
            </Link>
            . Az enciklopédia oldalakon a részletes jelentések olvashatók.
          </p>
        </Section>
        <section className="surface p-5 md:p-7">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            Mind a 78 lap
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {CARDS.map((card) => (
              <li key={card.id}>
                <Link
                  to="/tarot/$slug"
                  params={{ slug: card.id }}
                  className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 text-ivory/80 hover:text-gold hover:border-gold/50 transition-colors"
                >
                  {card.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
}

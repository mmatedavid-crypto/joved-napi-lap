import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { CHINESE_ANIMALS } from "@/data/chineseZodiac.hu";

const SITE_URL = "https://jovod.hu";
const TITLE = "Kínai horoszkóp — 12 állatöv jelentése magyarul";
const DESCRIPTION =
  "Kínai zodiákus magyarul: patkány, bivaly, tigris, nyúl, sárkány, kígyó, ló, kecske, majom, kakas, kutya, disznó. Jellem, szerelem, karrier, kompatibilitás és születési évek.";

export const Route = createFileRoute("/kinai-horoszkop")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Jövőd.hu` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/kinai-horoszkop` },
    ],
    links: [{ rel: "canonical", href: "/kinai-horoszkop" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ label: "Kínai horoszkóp", href: "/kinai-horoszkop" }]),
        ),
      },
    ],
  }),
  component: ChineseHubPage,
});

function ChineseHubPage() {
  return (
    <Layout>
      <Breadcrumb items={[{ label: "Kínai horoszkóp", href: "/kinai-horoszkop" }]} />
      <PageHeader
        eyebrow="Kínai zodiákus"
        title="Kínai horoszkóp — 12 állatöv magyarul"
        lead="A kínai állatöv minden jegye egy energiát képvisel. Az alábbi listából megnyithatod a saját jegyedet, és elolvashatod a jellemzőit, szerelmi mintáit, karrieres alkatát és a kompatibilis jegyeket."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section title="Hogyan találom meg a jegyemet?">
          <p>
            A kínai zodiákus a holdnaptár szerinti születési évhez köti az állatövi jegyet. Ha január vagy február elején születtél, érdemes ellenőrizni a pontos kínai újév dátumát abban az évben, mert nem a január 1-jei évváltáshoz, hanem a kínai újévhez (általában január 21. és február 21. között) igazodik.
          </p>
        </Section>
        <section className="surface p-5 md:p-7">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            12 állatöv
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {CHINESE_ANIMALS.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/kinai-horoszkop/$animal"
                  params={{ animal: a.slug }}
                  className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold hover:border-gold/50 transition-colors"
                >
                  <span className="block text-ivory/85">{a.name}</span>
                  <span className="block text-xs text-ivory/50 mt-0.5">{a.element}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
}
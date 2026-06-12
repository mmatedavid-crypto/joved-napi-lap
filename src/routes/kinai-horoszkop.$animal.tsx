import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { CHINESE_ANIMALS, findAnimalBySlug } from "@/data/chineseZodiac.hu";

const SITE_URL = "https://jovod.hu";

export const Route = createFileRoute("/kinai-horoszkop/$animal")({
  loader: ({ params }) => {
    const animal = findAnimalBySlug(params.animal);
    if (!animal) throw notFound();
    return { animal };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Kínai horoszkóp | Jövőd.hu" }] };
    const { animal } = loaderData;
    const title = `${animal.name} kínai horoszkóp — jellem, szerelem, karrier`;
    const description = `${animal.name} (${animal.element}, ${animal.yinYang}) kínai állatöv részletes magyar jellemzése. Évek: ${animal.years.join(", ")}. Szerelem, munka, kompatibilitás, szerencsés szín és szám.`;
    const url = `${SITE_URL}/kinai-horoszkop/${animal.slug}`;
    return {
      meta: [
        { title: `${title} | Jövőd.hu` },
        { name: "description", content: description },
        { name: "keywords", content: [animal.name, "kínai horoszkóp", ...animal.keywords].join(", ") },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: `/kinai-horoszkop/${animal.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { label: "Kínai horoszkóp", href: "/kinai-horoszkop" },
              { label: animal.name, href: `/kinai-horoszkop/${animal.slug}` },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description,
            url,
            inLanguage: "hu-HU",
            articleSection: "Kínai horoszkóp",
            publisher: {
              "@type": "Organization",
              name: "Jövőd.hu",
              url: SITE_URL,
              logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/logo.svg` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        },
      ],
    };
  },
  component: ChineseAnimalPage,
});

function ChineseAnimalPage() {
  const { animal } = Route.useLoaderData();
  const idx = CHINESE_ANIMALS.findIndex((a) => a.slug === animal.slug);
  const prev = CHINESE_ANIMALS[(idx - 1 + CHINESE_ANIMALS.length) % CHINESE_ANIMALS.length];
  const next = CHINESE_ANIMALS[(idx + 1) % CHINESE_ANIMALS.length];

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Kínai horoszkóp", href: "/kinai-horoszkop" },
          { label: animal.name, href: `/kinai-horoszkop/${animal.slug}` },
        ]}
      />
      <PageHeader
        eyebrow={`${animal.element} · ${animal.yinYang === "jang" ? "Jang" : "Jin"}`}
        title={`${animal.name} — kínai horoszkóp`}
        lead={animal.keywords.map((k: string) => `· ${k}`).join(" ")}
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <Section eyebrow="Születési évek">
          <p>{animal.years.join(" · ")}</p>
        </Section>
        <Section eyebrow="Jellem és személyiség" title={`${animal.name} alaptermészete`}>
          <p>{animal.personality}</p>
        </Section>
        <Section eyebrow="Szerelem és kapcsolatok">
          <p>{animal.love}</p>
        </Section>
        <Section eyebrow="Karrier és hivatás">
          <p>{animal.career}</p>
        </Section>
        <Section eyebrow="Pénz és anyagi élet">
          <p>{animal.money}</p>
        </Section>
        <Section eyebrow="Egészség és energia">
          <p>{animal.health}</p>
        </Section>
        <Section eyebrow="Kompatibilitás">
          <p>
            <strong className="text-gold/85">Harmonikus jegyek:</strong>{" "}
            {animal.compatible.join(", ")}
          </p>
          <p>
            <strong className="text-gold/85">Kihívásos jegyek:</strong>{" "}
            {animal.challenging.join(", ")}
          </p>
        </Section>
        <Section eyebrow="Szerencse">
          <p>
            <strong className="text-gold/85">Szín:</strong> {animal.luckyColor}
          </p>
          <p>
            <strong className="text-gold/85">Szám:</strong> {animal.luckyNumber}
          </p>
        </Section>
        <div className="surface p-5 md:p-7 text-center">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            Tedd személyessé
          </div>
          <Link to="/szuletesi-keplet" className="btn-gold">
            Születési képletem
          </Link>
        </div>
        <nav className="surface p-5 grid gap-2 sm:grid-cols-2 text-sm">
          <Link
            to="/kinai-horoszkop/$animal"
            params={{ animal: prev.slug }}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold"
          >
            ← {prev.name}
          </Link>
          <Link
            to="/kinai-horoszkop/$animal"
            params={{ animal: next.slug }}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold sm:text-right"
          >
            {next.name} →
          </Link>
        </nav>
        <div className="surface p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            További állatövi jegyek
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {CHINESE_ANIMALS.filter((a) => a.slug !== animal.slug).map((a) => (
              <li key={a.slug}>
                <Link
                  to="/kinai-horoszkop/$animal"
                  params={{ animal: a.slug }}
                  className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 text-ivory/75 hover:text-gold"
                >
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
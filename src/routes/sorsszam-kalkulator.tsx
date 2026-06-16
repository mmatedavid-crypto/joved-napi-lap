import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/sorsszam-kalkulator")({
  head: () => ({
    meta: [
      { title: "Sorsszám kalkulátor — számmisztika születési dátumból | Jövőd.hu" },
      {
        name: "description",
        content:
          "Sorsszám kalkulátor magyarul: életút szám, személyes év és névelemzés számmisztikai önismereti olvasathoz.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/sorsszam-kalkulator` }],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Számmisztika"
      title="Sorsszám kalkulátor"
      lead="A sorsszám a születési dátumból számolt életút szám. Nem címke, hanem egy minta, amely segíthet pontosabban látni a visszatérő működésedet."
      sections={[
        {
          title: "Mit mutat a sorsszám?",
          text: "A sorsszám azt jelzi, milyen alapminőség ismétlődhet az életedben: hogyan döntesz, mire törekszel, hol fejlődsz, és milyen árnyékoldalt érdemes észrevenned.",
        },
        {
          title: "Miért hasznos a teljes név?",
          text: "A születési dátum az életút számát adja, a teljes születési név pedig kifejeződés, belső vágy és külső kép szerint mélyítheti az olvasatot.",
        },
      ]}
      ctaTo="/szammisztika"
      ctaLabel="Kiszámolom a sorsszámom"
      faq={[
        {
          question: "Elég csak a születési dátum?",
          answer:
            "Igen, az alap sorsszámhoz elég. Teljesebb elemzéshez a teljes születési név is sokat adhat.",
        },
      ]}
    />
  ),
});

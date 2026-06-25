import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/angyalszam-jelentese")({
  head: () => ({
    meta: [
      { title: "Angyalszám jelentése — 111, 222, 333, 777, 1111 | Jövőd.hu" },
      {
        name: "description",
        content:
          "Angyalszám jelentése magyarul: 111, 222, 333, 777 és 1111 önismereti értelmezése, rövid és személyes olvasattal.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/angyalszam-jelentese` }],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Angyalszám"
      title="Angyalszám jelentése"
      lead="Ha egy szám újra és újra felbukkan, a számmisztikai hagyomány finom figyelmi jelként olvassa: mire érdemes most ránézned?"
      sections={[
        {
          title: "Mit jelenthet az angyalszám?",
          text: "Az angyalszám olyan ismétlődő vagy feltűnő számminta, amelyhez sok hagyomány szimbolikus jelentést társít. A Jövőd.hu ezt rövid belső tükörként, józan önismereti nyelven olvassa.",
        },
        {
          title: "Gyakran keresett számok",
          text: "A 111 gyakran új kezdethez és figyelemhez kapcsolódik, a 222 együttműködést és türelmet jelezhet, a 333 kifejezésre, a 777 belső mélyülésre, az 1111 pedig erős éberségre utalhat.",
        },
      ]}
      ctaTo="/angyalszam"
      ctaLabel="Megnézem az angyalszámom"
      faq={[
        {
          question: "Biztos üzenet az angyalszám?",
          answer:
            "Nem. A Jövőd.hu önismereti jelként kezeli: segíthet megfogalmazni, mire figyelsz most érzékenyebben.",
        },
      ]}
    />
  ),
});

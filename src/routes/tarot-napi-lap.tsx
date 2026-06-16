import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage } from "@/components/SeoLandingPage";
import { SITE_LEGAL } from "@/lib/legal";

export const Route = createFileRoute("/tarot-napi-lap")({
  head: () => ({
    meta: [
      { title: "Tarot napi lap — húzz egy lapot ma | Jövőd.hu" },
      {
        name: "description",
        content:
          "Tarot napi lap húzás magyarul: egy rövid, elegáns önismereti üzenet a mai napodra, jóslati túlzás nélkül.",
      },
    ],
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/tarot-napi-lap` }],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Tarot"
      title="Tarot napi lap"
      lead="Egyetlen lap néha elég ahhoz, hogy ne gyorsabban, hanem tisztábban indulj el a napban."
      sections={[
        {
          title: "Mire jó a napi lap?",
          text: "A napi tarot lap nem eldönti helyetted a napot. Inkább megmutat egy hangulatot, egy figyelmi pontot vagy egy belső témát, amit érdemes ma észrevenned.",
        },
        {
          title: "Hogyan olvasd?",
          text: "Ne szó szerint keresd benne a jövőt. Nézd meg, melyik mondatnál állsz meg, mi vált ki ellenállást, és mi az, amit már eddig is sejtettél.",
        },
      ]}
      ctaTo="/mai-lap"
      ctaLabel="Húzok egy napi lapot"
      faq={[
        {
          question: "A tarot biztos jövőt mond?",
          answer:
            "Nem. A Jövőd.hu tarot olvasatai irányt és önismereti tükröt adnak, nem biztos jövőbeli állítást.",
        },
      ]}
    />
  ),
});

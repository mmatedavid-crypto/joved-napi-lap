import { createFileRoute } from "@tanstack/react-router";
import { SeoLandingPage } from "@/components/SeoLandingPage";

export const Route = createFileRoute("/alomfejtes-jelentes")({
  head: () => ({
    meta: [
      { title: "Álomfejtés jelentése — mit jelent az álmom? | Jövőd.hu" },
      {
        name: "description",
        content:
          "Álomfejtés magyarul: visszatérő álmok, álomszimbólumok és belső jelentések józan, önismereti megközelítésben.",
      },
    ],
    links: [{ rel: "canonical", href: "/alomfejtes-jelentes" }],
  }),
  component: () => (
    <SeoLandingPage
      eyebrow="Álomfejtés"
      title="Mit jelent az álmom?"
      lead="Az álom ritkán szó szerinti üzenet. Inkább képekben mutatja meg, mi dolgozik benned csendben."
      sections={[
        {
          title: "Hogyan érdemes álmot fejteni?",
          text: "Nem az a legfontosabb, hogy egy szimbólumnak egyetlen kész jelentést adjunk. Inkább az számít, milyen érzéssel ébredtél, mi ismétlődik, és hol kapcsolódik az álom a mostani életedhez.",
        },
        {
          title: "Gyakori álomszimbólumok",
          text: "A víz érzelmi mozgást, a ház belső teret, az út döntési irányt, a zuhanás kontrollvesztést, a halálképek pedig nem jóslatként, hanem lezárás vagy átalakulás önismereti képeként olvashatók.",
        },
      ]}
      ctaTo="/alomfejtes"
      ctaLabel="Leírom az álmom"
      faq={[
        {
          question: "Az álomfejtés diagnózis?",
          answer:
            "Nem. Az oldal nem diagnosztizál és nem ad mentális egészségügyi tanácsot; az értelmezés önismereti irány.",
        },
        {
          question: "Mit jelent, ha halállal álmodom?",
          answer:
            "Nem kezeljük előrejelzésként. Egy ilyen álom inkább lezárásról, félelemről vagy belső változásról szólhat. Ha gyászhoz, krízishez vagy tartós szorongáshoz kapcsolódik, érdemes emberi vagy szakmai támogatást kérni.",
        },
      ]}
    />
  ),
});

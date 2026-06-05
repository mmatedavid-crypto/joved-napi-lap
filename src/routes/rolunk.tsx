import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";

export const Route = createFileRoute("/rolunk")({
  head: () => ({
    meta: [
      { title: "Rólunk | Jövőd.hu" },
      { name: "description", content: "A Jövőd.hu egy csendes magyar napi rituálé. Tarot, sorsszám, összeillés — emberi hangon." },
    ],
    links: [{ rel: "canonical", href: "/rolunk" }],
  }),
  component: () => (
    <Layout>
      <PageHeader eyebrow="Rólunk" title="Egy csendes ritual" lead="A Jövőd.hu nem jóslat. Egy tükör, amit napi öt percre felemelsz." />
      <div className="mx-auto max-w-2xl px-4 md:px-6 pb-20 space-y-4">
        <Section eyebrow="Mit kínálunk">Napi lapot, három lapos tarot húzást, döntés előtti és randi előtti olvasatot, sorsszámot és párkapcsolati összeillést. Magyarul, mértékkel.</Section>
        <Section eyebrow="Hogyan írunk">Rövid, intim, kicsit irodalmi nyelven. Nem ígérünk biztosat, mert nem tudunk. Inkább irányt mutatunk.</Section>
        <Section eyebrow="Jogi tudnivalók">A Jövőd.hu szórakoztató és önismereti célú tartalom. Nem orvosi, jogi, pénzügyi vagy pszichológiai tanácsadás.</Section>
      </div>
    </Layout>
  ),
});
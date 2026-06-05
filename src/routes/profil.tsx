import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil | Jövőd.hu" },
      { name: "description", content: "Mentett húzásaid és sorsszámod." },
    ],
    links: [{ rel: "canonical", href: "/profil" }],
  }),
  component: () => (
    <Layout>
      <PageHeader eyebrow="Profil" title="A te oldalad" lead="Itt fognak megjelenni a mentett húzásaid és sorsszámod." />
      <div className="mx-auto max-w-md px-4 pb-20">
        <Section eyebrow="Hamarosan">A profil és a mentett előzmények a bejelentkezés bevezetésével együtt érkeznek.</Section>
      </div>
    </Layout>
  ),
});
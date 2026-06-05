import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";

export const Route = createFileRoute("/bejelentkezes")({
  head: () => ({
    meta: [
      { title: "Bejelentkezés | Jövőd.hu" },
      { name: "description", content: "Jelentkezz be, hogy elmenthesd a húzásaidat és a sorsszámodat." },
    ],
    links: [{ rel: "canonical", href: "/bejelentkezes" }],
  }),
  component: () => (
    <Layout>
      <PageHeader eyebrow="Bejelentkezés" title="Mentsd el a húzásaidat" lead="Belépéssel a napi lapod, három lapos olvasataid és sorsszámod minden eszközödön elérhető." />
      <div className="mx-auto max-w-md px-4 pb-20">
        <Section eyebrow="Hamarosan">
          A bejelentkezés (Google és email magic link) a következő frissítésben érkezik. Addig is minden funkció működik — a böngésződ helyben megőrzi a mai lapodat.
        </Section>
      </div>
    </Layout>
  ),
});
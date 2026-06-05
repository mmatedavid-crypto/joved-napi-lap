import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { RitualTable } from "@/components/RitualTable";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jövőd.hu — Húzz egy lapot, mielőtt döntesz" },
      { name: "description", content: "Napi tarot lap, számmisztika, párkapcsolati összeillés és döntés előtti útmutatás. Egy csendes magyar ritual minden napra." },
      { property: "og:title", content: "Jövőd.hu — Húzz egy lapot, mielőtt döntesz" },
      { property: "og:description", content: "Napi lap, számmisztika, összeillés és döntés előtti útmutatás." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-4 md:px-6 pt-8 md:pt-12 pb-4 text-center">
        <div className="text-[10px] tracking-[0.35em] uppercase text-[oklch(0.78_0.10_80/0.8)] mb-3">Napi rituálé</div>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-ivory">
          Húzz egy lapot,{" "}
          <span className="text-gold-gradient">mielőtt döntesz.</span>
        </h1>
        <p className="font-editorial text-lg md:text-xl text-ivory/70 mt-4 leading-relaxed max-w-xl mx-auto">
          Napi lap, sorsszám, összeillés és döntés előtti tisztánlátás — egy csendes magyar olvasóasztal.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-3 md:px-6 pb-16">
        <RitualTable />
      </section>

      <section className="mx-auto max-w-2xl px-4 md:px-6 pb-20 text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">A mi hangunk</div>
        <p className="font-editorial text-xl md:text-2xl text-ivory/80 leading-relaxed">
          „A lap most nem siettet. Inkább azt mutatja, hogy van valami ebben a helyzetben, amit már érzel, csak még nem mondtál ki magadnak teljesen."
        </p>
        <div className="mt-6 text-sm text-ivory/55 font-editorial">
          <Link to="/rolunk" className="hover:text-gold">Tudj meg többet rólunk</Link>
        </div>
      </section>
    </Layout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { HeroPortal } from "@/components/HeroPortal";
import { FeatureCard } from "@/components/FeatureCard";

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
      <section className="mx-auto max-w-6xl px-4 md:px-6 pt-10 md:pt-20 pb-12 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-[10px] tracking-[0.35em] uppercase text-[oklch(0.78_0.10_80/0.8)] mb-4">Napi rituálé</div>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-ivory">
            Húzz egy lapot,<br />
            <span className="text-gold-gradient">mielőtt döntesz.</span>
          </h1>
          <p className="font-editorial text-xl md:text-2xl text-ivory/75 mt-6 leading-relaxed max-w-lg">
            Napi lap, számmisztika, összeillés és döntés előtti útmutatás.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/mai-lap" className="btn-gold">Mai lapom <span aria-hidden>→</span></Link>
            <Link to="/osszeillunk" className="btn-ghost-gold">Megnézem, összeillünk-e</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ivory/60">
            <li className="flex items-center gap-2"><Dot /> Napi rituálé</li>
            <li className="flex items-center gap-2"><Dot /> Személyre szabott</li>
            <li className="flex items-center gap-2"><Dot /> Magyar nyelven</li>
            <li className="flex items-center gap-2"><Dot /> Adatmentes élmény</li>
          </ul>
        </div>
        <div className="order-first lg:order-last">
          <HeroPortal className="max-w-md mx-auto" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard to="/mai-lap" icon="star" title="Mai lap" desc="Húzz egy lapot, és kapj tiszta, érthető üzenetet a napodra." />
          <FeatureCard to="/harom-lap" icon="three" title="3 lapos húzás" desc="Múlt, jelen, jövő — három lap, egy összefüggő történet." />
          <FeatureCard to="/randi-elott" icon="heart" title="Randi előtt" desc='Egy kis tisztánlátás, mielőtt kiírod, hogy „nyolckor".' />
          <FeatureCard to="/dontes-elott" icon="diamond" title="Döntés előtt" desc="Segítünk rálátni a lehetőségeidre, hogy magabiztosan dönthess." />
          <FeatureCard to="/szammisztika" icon="num" title="Sorsszám" desc="Fedezd fel a személyes sorsszámod üzenetét és életfeladataidat." />
          <FeatureCard to="/osszeillunk" icon="rings" title="Összeillünk?" desc="Nézd meg, milyen minőségeket hoztok ki egymásból." />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 md:px-6 pb-24 text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">A mi hangunk</div>
        <p className="font-editorial text-2xl md:text-3xl text-ivory/85 leading-relaxed">
          „A lap most nem siettet. Inkább azt mutatja, hogy van valami ebben a helyzetben,
          amit már érzel, csak még nem mondtál ki magadnak teljesen."
        </p>
      </section>
    </Layout>
  );
}

function Dot() {
  return <span className="inline-block size-1.5 rounded-full bg-[oklch(0.78_0.10_80)]" />;
}

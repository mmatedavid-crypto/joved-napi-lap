import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Layout } from "@/components/Layout";
import { PersonalDailyBriefing } from "@/components/PersonalDailyBriefing";
import { PRODUCTS, formatHuf } from "@/lib/products";

const RitualTable = lazy(() =>
  import("@/components/RitualTable").then((module) => ({ default: module.RitualTable })),
);

const ENTRY_PRICE = Math.min(...PRODUCTS.map((product) => product.priceHuf));
const SITE_URL = "https://jovod.hu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jövőd.hu — Húzz egy lapot, mielőtt döntesz" },
      {
        name: "description",
        content:
          "Napi tarot lap, számmisztika, párkapcsolati összeillés és döntés előtti útmutatás. Egy csendes magyar rituálé minden napra.",
      },
      { property: "og:title", content: "Jövőd.hu — Húzz egy lapot, mielőtt döntesz" },
      {
        property: "og:description",
        content: "Napi lap, számmisztika, összeillés és döntés előtti útmutatás.",
      },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Index,
});

function Index() {
  return (
    <Layout>
      <section className="mx-auto max-w-5xl px-3 md:px-6 pt-1 pb-0 text-center">
        <div className="text-[10px] tracking-[0.35em] uppercase text-[oklch(0.78_0.10_80/0.8)]">
          Napi rituálé
        </div>
        <h1 className="font-display text-[22px] leading-[1.05] md:text-4xl lg:text-5xl text-ivory">
          Húzz egy lapot, <span className="text-gold-gradient">mielőtt döntesz.</span>
        </h1>
      </section>

      <PersonalDailyBriefing />

      <section className="mx-auto max-w-none px-0 md:px-3 pb-12">
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl px-4 md:px-6 py-10">
              <div className="surface p-5 text-center text-sm text-ivory/55">
                A rituálék betöltése…
              </div>
            </div>
          }
        >
          <RitualTable />
        </Suspense>
      </section>

      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-14">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="surface p-4">
            <div className="text-[10px] tracking-[0.28em] uppercase text-[oklch(0.78_0.10_80/0.72)]">
              Először próbáld ki
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ivory/68">
              A rövid olvasatok ingyen is elindíthatók. Ha betalál a hang, kérhetsz mélyebb,
              személyesebb változatot.
            </p>
          </div>
          <div className="surface p-4">
            <div className="text-[10px] tracking-[0.28em] uppercase text-[oklch(0.78_0.10_80/0.72)]">
              Fizetős olvasatok
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ivory/68">
              A személyes olvasatok {formatHuf(ENTRY_PRICE)}-tól indulnak. Az ár mindig látszik
              fizetés előtt, rejtett díj nélkül.
            </p>
          </div>
          <div className="surface p-4">
            <div className="text-[10px] tracking-[0.28em] uppercase text-[oklch(0.78_0.10_80/0.72)]">
              Biztonságos hozzáférés
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ivory/68">
              A kártyaadatot Stripe kezeli. Az elkészült olvasat megnyitható a rendelési linken,
              bejelentkezve pedig a profilban is.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-16">
        <div className="text-center mb-6">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
            További jelek
          </div>
          <p className="font-editorial text-ivory/70 mt-2 max-w-xl mx-auto">
            Ha nem csak lapot húznál, nézd meg, milyen más jelek szólnak ma hozzád.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { to: "/mai-iranytu", label: "Mai iránytű" },
            { to: "/angyalszam-jelentese", label: "Angyalszám" },
            { to: "/horoszkop", label: "Horoszkóp" },
            { to: "/alomfejtes-jelentes", label: "Álomfejtés" },
            { to: "/kristaly", label: "Kristály" },
            { to: "/sorsszam-kalkulator", label: "Sorsszám" },
            { to: "/tarot-napi-lap", label: "Napi tarot" },
            { to: "/dontes-elott", label: "I-Ching" },
          ].map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="surface p-4 text-center hover:border-gold transition-colors block"
            >
              <span className="font-display text-ivory text-lg">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 md:px-6 pb-20 text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
          A mi hangunk
        </div>
        <p className="font-editorial text-xl md:text-2xl text-ivory/80 leading-relaxed">
          „A lap most nem siettet. Inkább azt mutatja, hogy van valami ebben a helyzetben, amit már
          érzel, csak még nem mondtál ki magadnak teljesen."
        </p>
        <div className="mt-6 text-sm text-ivory/55 font-editorial">
          <Link to="/rolunk" className="hover:text-gold">
            Tudj meg többet rólunk
          </Link>
        </div>
      </section>
    </Layout>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Layout } from "@/components/Layout";
import { MoonPhaseStrip } from "@/components/MoonPhaseStrip";
import { PersonalDailyBriefing } from "@/components/PersonalDailyBriefing";
import { YesNoWidget } from "@/components/YesNoWidget";
import { SITE_LEGAL } from "@/lib/legal";
import { PRODUCTS, formatHuf } from "@/lib/products";

const RitualTable = lazy(() =>
  import("@/components/RitualTable").then((module) => ({ default: module.RitualTable })),
);

const ENTRY_PRICE = Math.min(...PRODUCTS.map((product) => product.priceHuf));
const SITE_URL = SITE_LEGAL.siteUrl;

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

      <MoonPhaseStrip />

      <PersonalDailyBriefing />

      <YesNoWidget />

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

      <section className="mx-auto max-w-5xl px-4 md:px-6 pb-14">
        <div className="rounded-md border border-gold/15 bg-[oklch(0.78_0.10_80/0.055)] p-5 md:p-7">
          <div className="grid gap-6 md:grid-cols-[1fr_1.25fr] md:items-start">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
                Miért személyesebb?
              </div>
              <h2 className="mt-2 font-display text-3xl text-ivory">
                A kérdésedből, a jelekből és a visszatérő mintáidból indul.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ivory/62">
                Az ingyenes olvasatok adnak egy első belső tükröt. A fizetős változat akkor jó, ha
                azt szeretnéd, hogy a tarot, a számmisztika vagy az asztrológia jelképei már a
                konkrét helyzetedhez és korábbi kérdéseidhez kapcsolódjanak.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: "Konkrét helyzet",
                  text: "Ha megírod, randi, döntés, ex vagy álom a téma, az olvasat erre reagál.",
                },
                {
                  title: "Hagyományos jelképek",
                  text: "A tarot, a számmisztika és az asztrológia régi szimbólumait józan, mai nyelven olvassuk.",
                },
                {
                  title: "Visszatérő ív",
                  text: "Ha engeded a memóriát, az oldal észreveszi, milyen kérdéshez térsz vissza. Opcionális, törölhető, és csak finomabb folytatást ad.",
                },
                {
                  title: "Minőségi korlát",
                  text: "Nem ígér biztos jövőt, nem ad orvosi, jogi vagy pénzügyi tanácsot.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/15 p-4"
                >
                  <h3 className="font-display text-xl text-ivory">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/62">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 border-t border-gold/10 pt-5">
            <Link to="/mai-lap" className="btn-gold">
              Kipróbálom ingyen
            </Link>
            <Link
              to="/arak"
              className="inline-flex items-center justify-center rounded-md border border-[oklch(0.78_0.10_80/0.28)] px-4 py-3 text-sm text-ivory/75 hover:text-gold"
            >
              Személyes olvasatok {formatHuf(ENTRY_PRICE)}-tól
            </Link>
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
            { to: "/jiking", label: "I Ching" },
            { to: "/szuletesi-keplet", label: "Születési képlet" },
            { to: "/szerencseszamok", label: "Szerencseszámok" },
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

      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-6">
        <div className="mb-6 text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold/70">
            Fedezd fel az oldalt
          </div>
          <h2 className="mt-2 font-display text-3xl text-ivory">Minden útmutató egy helyen</h2>
          <p className="mx-auto mt-2 max-w-2xl font-editorial text-lg text-ivory/70">
            Böngéssz a kártyák, számok, csillagjegyek és hosszabb olvasmányok között, vagy válassz
            személyes elemzést.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: "/tarot", label: "Tarot kártyák", text: "Mind a 78 lap részletes jelentése." },
            { to: "/numerologia", label: "Számmisztika", text: "Sorsszám, lélekszám és személyes év." },
            { to: "/kinai-horoszkop", label: "Kínai horoszkóp", text: "A 12 állatövi jegy útmutatója." },
            { to: "/jiking", label: "I Ching", text: "A változások könyvének 64 hexagramja." },
            { to: "/magazin", label: "Magazin", text: "Tarot, asztrológia és önismeret magyarul." },
            { to: "/arak", label: "Személyes olvasatok", text: "Árak, tartalom és elkészülési idők." },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="surface block p-5 transition-colors hover:border-gold/50"
            >
              <h3 className="font-display text-xl text-ivory">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/65">{item.text}</p>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gold">
          <Link to="/alomfejtes" className="hover:underline">Álomfejtés</Link>
          <Link to="/angyalszam" className="hover:underline">Angyalszám</Link>
          <Link to="/szemelyes-30-napos-horoszkop" className="hover:underline">30 napos asztrológiai térkép</Link>
          <Link to="/eves-horoszkop" className="hover:underline">Éves horoszkóp</Link>
          <Link to="/tranzitok" className="hover:underline">Tranzitelemzés</Link>
          <Link to="/vedikus-asztrologia" className="hover:underline">Védikus elemzés</Link>
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

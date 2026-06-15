import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { PRODUCTS, formatHuf, type ProductCategory } from "@/lib/products";

const PRICING_FAQ = [
  {
    question: "Kell fiókot létrehoznom a vásárláshoz?",
    answer:
      "Nem kötelező. Vendégként a biztonságos rendelési linken és emailben éred el az olvasatot; bejelentkezve később a profilodban is visszanézheted.",
  },
  {
    question: "Mi a különbség az azonnali és a részletes olvasatok között?",
    answer:
      "Az azonnali olvasatok rövidebb, személyes válaszok. A részletes olvasatok több részből álló írásos elemzések, a terméknél feltüntetett elkészülési idővel.",
  },
  {
    question: "Mi történik, ha technikai hiba miatt nem nyílik meg az olvasat?",
    answer:
      "A rendelési link és a vásárlási email alapján utánanézünk, pótoljuk a hozzáférést, vagy hibás megjelenés esetén javítjuk és újraküldjük az olvasatot.",
  },
  {
    question: "Mi van, ha az olvasat nem érződik elég pontosnak?",
    answer:
      "Az elkészült olvasatnál közvetlen minőségi visszajelzést kérhetsz. Ha részben talált vagy nem volt elég pontos, konkrét pontosítási kérdésekkel segítünk jelezni, melyik rész nem talált, mi maradt ki a helyzetedből, és milyen irányban vársz segítséget.",
  },
  {
    question: "Elállhatok a digitális olvasattól?",
    answer:
      "Fizetés előtt külön kéred a digitális tartalom teljesítésének megkezdését. Ha az olvasat elkészült és megnyílt, az elállási jog korlátozott lehet; technikai hiba vagy elmaradt hozzáférés esetén viszont utánanézünk és pótoljuk a teljesítést.",
  },
  {
    question: "Ezek jóslatok?",
    answer:
      "Nem. A Jövőd.hu szimbolikus, önismereti digitális tartalmat ad. Nem orvosi, jogi, pénzügyi vagy krízistanácsadás, és nem ígér biztos jövőt.",
  },
] as const;

const CHOICE_GUIDE = [
  {
    title: "Csak kipróbálnám",
    text: "Kezdj a Napi lappal vagy a Mai iránytűvel. Rövid, olcsó, és gyorsan kiderül, megszólít-e a Jövőd.hu hangja.",
    productSlug: "napi_lap_ai",
    cta: "Napi lap",
  },
  {
    title: "Kapcsolat vagy ex jár a fejemben",
    text: "Ha randi, visszatérő történet vagy bizonytalan kötődés a téma, a kapcsolati olvasat ad több teret, nem csak százalékot.",
    productSlug: "parkapcsolat_elemzes",
    cta: "Kapcsolati olvasat",
  },
  {
    title: "Döntés előtt állok",
    text: "Ha nem az a kérdés, mit jósol a lap, hanem mit nem látsz tisztán, a Döntés előtt komplex elemzés a legjobb választás.",
    productSlug: "dontes_komplex",
    cta: "Döntési elemzés",
  },
  {
    title: "30 napos térképet kérek",
    text: "Ha szeretnéd látni, mire figyelj a következő 30 napban, a személyes 30 napos térkép a saját születési képletedre épül.",
    productSlug: "personal_30_day",
    cta: "30 napos térkép",
  },
] as const;

export const Route = createFileRoute("/arak")({
  head: () => ({
    meta: [
      { title: "Árak és olvasatok | Jövőd.hu" },
      {
        name: "description",
        content:
          "Jövőd.hu árak: azonnali személyes olvasatok 590 Ft-tól, részletes asztrológiai elemzések átlátható elkészülési idővel.",
      },
    ],
    links: [{ rel: "canonical", href: "/arak" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: PRICING_FAQ.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }),
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const instant = PRODUCTS.filter((product) => product.category === "instant");
  const delayed = PRODUCTS.filter((product) => product.category === "delayed");
  const instantPriceRange = productRange(instant);
  const delayedPriceRange = productRange(delayed);

  return (
    <Layout>
      <PageHeader
        eyebrow="Árak"
        title="Olvasatok átlátható áron"
        lead="A horoszkóp, az angyalszám, az álomfejtés és a kristályajánló ingyenesen is kipróbálható. A személyes olvasatok 590 Ft-tól indulnak."
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6 pb-20">
        <section className="grid gap-3 md:grid-cols-4">
          <TrustPoint
            title="590 Ft-tól"
            text="A belépő olvasatok olcsók, hogy kockázat nélkül kipróbálhasd a hangot."
          />
          <TrustPoint
            title="Stripe fizetés"
            text="A kártyaadatot nem tároljuk; a fizetést Stripe dolgozza fel."
          />
          <TrustPoint
            title="Menthető olvasat"
            text="Az elkészült szöveg megnyitható, kimásolható és letölthető."
          />
          <TrustPoint
            title="Pontosítási út"
            text="Ha nem elég pontos, rendelés alapján visszanézzük, és konkrét kérdésekkel segítünk jelezni, mi nem talált."
          />
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
              Melyiket válasszam?
            </div>
            <h2 className="mt-2 font-display text-3xl text-ivory">A kérdésedhez válassz</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/62">
              Nem mindenkinek ugyanaz az olvasat kell. Itt a leggyorsabb út, ha még nem tudod, hol
              kezdd.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {CHOICE_GUIDE.map((item) => {
              const product = PRODUCTS.find((candidate) => candidate.slug === item.productSlug);
              return (
                <article
                  key={item.title}
                  className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-4"
                >
                  <h3 className="font-display text-xl leading-tight text-ivory">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/64">{item.text}</p>
                  {product && (
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gold/10 pt-3">
                      <span className="text-sm text-gold tabular-nums">
                        {formatHuf(product.priceHuf)}
                      </span>
                      {product.sourceRoute && (
                        <Link
                          to={product.sourceRoute}
                          className="inline-flex items-center justify-center rounded-md border border-gold/25 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/60"
                        >
                          {item.cta}
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <PricingGroup
          title="Azonnali olvasatok"
          lead="Rövid, személyes válaszok néhány percen belül. Jó első próba, napi kérdéshez vagy egy konkrét belső fókuszhoz."
          products={instant}
          category="instant"
        />

        <section className="mt-10 rounded-md border border-gold/15 bg-black/10 p-5 md:p-7">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
            Mit kapsz kézhez?
          </div>
          <h2 className="mt-2 font-display text-3xl text-ivory">Azonnali vagy részletes?</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ReadingTypeCard
              title="Azonnali olvasat"
              price={instantPriceRange}
              delivery="Pár percen belül"
              bestFor="Ha egy konkrét érzésre, napi kérdésre vagy gyors belső irányra kérsz választ."
              result="Rövid, személyes szöveg, amely a megadott témára reagál, de nem bontja ki hosszú riportként."
            />
            <ReadingTypeCard
              title="Részletes asztrológiai riport"
              price={delayedPriceRange}
              delivery="A terméknél jelzett időn belül"
              bestFor="Ha a saját születési képletedből kérsz 30 napos, éves, tranzit- vagy teljes védikus elemzést."
              result="Több oldalas, személyre szabott riport születési dátum, idő és hely alapján."
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ivory/58">
            Mindkét típus elérhető a biztonságos rendelési linken; bejelentkezve a profilban is
            visszanézhető. Vendégként az emailt és a rendelési linket érdemes megtartanod.
            Elkészült olvasatnál minőségi visszajelzést is tudsz küldeni, ha valamit pontosítanál.
          </p>
        </section>

        <PricingGroup
          title="Asztrológiai riportok"
          lead="Személyes születési képletre épülő, többoldalas elemzések. A 30 napos térkép a tranzitokat a saját képletedre vetíti."
          products={delayed}
          category="delayed"
        />

        <section className="mt-10 rounded-md border border-gold/15 bg-[oklch(0.78_0.10_80/0.055)] p-5 md:p-7">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">Hogyan válassz?</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <p className="font-editorial text-lg leading-relaxed text-ivory/78">
              Ha csak azt szeretnéd érezni, hogy a Jövőd.hu hangja működik-e neked, próbáld ki a
              napi lap ingyenes húzását vagy az ingyenes horoszkópot. A személyes olvasatok 590
              Ft-tól indulnak.
            </p>
            <p className="font-editorial text-lg leading-relaxed text-ivory/78">
               Az asztrológiai riportok a saját születési adataidból készülnek; a várható
               elkészülési időt minden terméknél külön feltüntetjük.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
              Gyakori kérdések
            </div>
            <h2 className="mt-2 font-display text-3xl text-ivory">Vásárlás előtt jó tudni</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {PRICING_FAQ.map((item) => (
              <article
                key={item.question}
                className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-4"
              >
                <h3 className="font-display text-xl text-ivory">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivory/64">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function productRange(products: typeof PRODUCTS): string {
  const prices = products.map((product) => product.priceHuf);
  if (prices.length === 0) return "";
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  return minimum === maximum ? formatHuf(minimum) : `${formatHuf(minimum)}–${formatHuf(maximum)}`;
}

function TrustPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-4">
      <div className="font-display text-xl text-ivory">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/62">{text}</p>
    </div>
  );
}

function ReadingTypeCard({
  title,
  price,
  delivery,
  bestFor,
  result,
}: {
  title: string;
  price: string;
  delivery: string;
  bestFor: string;
  result: string;
}) {
  return (
    <article className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-[oklch(0.13_0.03_292/0.58)] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-2xl leading-tight text-ivory">{title}</h3>
        <span className="shrink-0 text-sm tabular-nums text-gold">{price}</span>
      </div>
      <dl className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Elkészülés</dt>
          <dd className="mt-1 text-ivory/68">{delivery}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Akkor válaszd</dt>
          <dd className="mt-1 text-ivory/68">{bestFor}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Kézhez kapod</dt>
          <dd className="mt-1 text-ivory/68">{result}</dd>
        </div>
      </dl>
    </article>
  );
}

function PricingGroup({
  title,
  lead,
  products,
  category,
}: {
  title: string;
  lead: string;
  products: typeof PRODUCTS;
  category: ProductCategory;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
          {category === "instant" ? "Fizetés után néhány percen belül" : "A jelzett elkészülési idővel"}
        </div>
        <h2 className="mt-2 font-display text-3xl text-ivory">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/62">{lead}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.slug}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-[oklch(0.13_0.03_292/0.58)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-xl leading-tight text-ivory">{product.name}</h3>
              <div className="shrink-0 text-right text-gold tabular-nums">
                {formatHuf(product.priceHuf)}
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ivory/62">{product.short}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ivory/70">
              {product.includes.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/75" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-gold/10 pt-3 text-xs leading-relaxed text-ivory/50">
              {product.qualityPromise}
            </p>
            {product.sourceRoute && (
              <Link
                to={product.sourceRoute}
                className="mt-4 inline-flex items-center justify-center rounded-md border border-gold/25 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/60"
              >
                Megnézem
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

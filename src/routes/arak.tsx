import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { SITE_LEGAL } from "@/lib/legal";
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
    question: "Mi történik, ha nem nyílik meg az olvasat?",
    answer:
      "A rendelési link és a vásárlási email alapján utánanézünk, segítünk a hozzáférésben, vagy hibás megjelenés esetén javítjuk és újraküldjük az olvasatot.",
  },
  {
    question: "Mi van, ha az olvasat nem érződik elég pontosnak?",
    answer:
      "Az elkészült olvasatnál közvetlen minőségi visszajelzést kérhetsz. Ha részben talált vagy nem volt elég pontos, rövid pontosítási vázlat segít megírni, melyik rész nem talált, mi maradt ki a helyzetedből, és milyen irányban vársz segítséget.",
  },
  {
    question: "Elállhatok a digitális olvasattól?",
    answer:
      "Fizetés előtt külön kéred a digitális tartalom teljesítésének megkezdését. Ha az olvasat elkészült és megnyílt, az elállási jog korlátozott lehet; ha viszont a hozzáférés elmarad vagy megakad, utánanézünk és segítünk.",
  },
  {
    question: "Ezek jóslatok?",
    answer:
      "A tarot, a számmisztika és az asztrológia régi jelképrendszerekből indul. Mi ezeket nem biztos jövőként, hanem önismereti olvasatként kezeljük: segíthetnek tisztábban ránézni egy helyzetre, de nem helyettesítenek orvosi, jogi, pénzügyi vagy krízishelyzeti segítséget.",
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

const NOT_FOR_GUIDE = [
  {
    title: "Ha biztos eseményválaszt vársz",
    text: "Nem mondjuk ki kész tényként, hogy valaki visszajön-e, mit dönt-e a másik ember, vagy pontosan mi fog történni.",
  },
  {
    title: "Ha döntést kell helyetted meghozni",
    text: "Az olvasat irányt, mintát és belső fókuszt adhat, de nem választ helyetted munkában, kapcsolatban vagy pénzügyi helyzetben.",
  },
  {
    title: "Ha krízisben vagy szakmai segítség kell",
    text: "Orvosi, jogi, pénzügyi, pszichológiai vagy sürgős krízishelyzetben emberi és szakmai támogatást keress elsőként.",
  },
  {
    title: "Ha hosszú riportot vársz pár perc alatt",
    text: "Az azonnali olvasatok rövidebbek. Születési képletre épülő, többoldalas riportnál a feltüntetett elkészülési idővel számolj.",
  },
] as const;

const PRE_PURCHASE_CHECKS = [
  {
    title: "Fizetés előtt látod",
    text: "A választott olvasat nevét, árát, elkészülési módját és azt, hogy vendégként vagy profillal hogyan éred el.",
  },
  {
    title: "Digitális teljesítés",
    text: "A fizetési folyamatban külön jelzed, hogy a digitális tartalom elkészítése elindulhat.",
  },
  {
    title: "Segítség, ha elakadsz",
    text: "A vásárlási email és a rendelési link alapján utánanézünk a hozzáférésnek vagy a hibás megjelenésnek.",
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
    links: [{ rel: "canonical", href: `${SITE_LEGAL.siteUrl}/arak` }],
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
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Jövőd.hu fizetős olvasatok",
          itemListElement: PRODUCTS.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: product.name,
              description: product.short,
              category:
                product.category === "instant"
                  ? "Azonnali önismereti olvasat"
                  : "Részletes önismereti olvasat",
              brand: {
                "@type": "Brand",
                name: "Jövőd.hu",
              },
              offers: {
                "@type": "Offer",
                price: product.priceHuf,
                priceCurrency: "HUF",
                availability: "https://schema.org/InStock",
                url: `${SITE_LEGAL.siteUrl}${product.sourceRoute ?? "/arak"}`,
                seller: {
                  "@type": "Organization",
                  name: SITE_LEGAL.operator.name,
                },
              },
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
  const entry = PRODUCTS.filter(
    (product) => product.category === "instant" && product.priceHuf < 900,
  );
  const focused = PRODUCTS.filter(
    (product) => product.category === "instant" && product.priceHuf >= 900,
  );
  const instantPriceRange = productRange(instant);
  const delayedPriceRange = productRange(delayed);
  const entryPriceRange = productRange(entry);
  const focusedPriceRange = productRange(focused);

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
            text="Ha nem elég pontos, rendelés alapján visszanézzük, és rövid vázlat segít megírni, mi nem talált."
          />
        </section>

        <section className="mt-10 rounded-md border border-gold/15 bg-[oklch(0.78_0.10_80/0.045)] p-5 md:p-7">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
            Mennyi elég most?
          </div>
          <h2 className="mt-2 font-display text-3xl text-ivory">
            Nem mindig a legnagyobb olvasat a jó első lépés
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/62">
            Ha csak egy mai érzést vagy rövid jelet szeretnél tisztábban látni, elég lehet egy
            belépő olvasat. Ha viszont ugyanaz a kapcsolat, döntés vagy élethelyzet tér vissza, a
            mélyebb azonnali elemzés ad több kapaszkodót.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <BudgetFitCard
              title="Belépő olvasat"
              price={entryPriceRange}
              text="Egy napi lap, angyalszám, kristály vagy álomszimbólum személyesebb értelmezéséhez."
              cta="Olcsó próbaolvasat"
              href="/mai-lap"
            />
            <BudgetFitCard
              title="Mélyebb azonnali elemzés"
              price={focusedPriceRange}
              text="Három laphoz, döntéshez, kapcsolathoz vagy számmisztikához, amikor már nem elég egy rövid jel."
              cta="Helyzethez választok"
              href="#azonnali-olvasatok"
            />
            <BudgetFitCard
              title="Asztrológiai riport"
              price={delayedPriceRange}
              text="Akkor érdemes, ha születési adatokból kérsz 30 napos, éves, tranzit- vagy védikus képet."
              cta="30 napos térkép"
              href="/szemelyes-30-napos-horoszkop"
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
              Melyiket válasszam?
            </div>
            <h2 className="mt-2 font-display text-3xl text-ivory">A kérdésedhez válassz</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/62">
              Nem mindenkinek ugyanaz az olvasat kell. Itt a leggyorsabb út, ha még nem tudod, hol
              kezdd. Ha ugyanaz a téma tér vissza, általában nem újabb gyors húzás kell, hanem olyan
              olvasat, amely továbbviszi az előző kérdésed ívét.
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

        <section className="mt-10">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
            Elvárások tisztázása
          </div>
          <h2 className="mt-2 font-display text-3xl text-ivory">Mikor ne ezt válaszd?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/62">
            A Jövőd.hu olvasatai régi jelképrendszerekből induló önismereti szövegek. Akkor működnek
            jól, ha egy helyzetre szeretnél ránézni, nem akkor, ha kész tényt vagy kockázatos
            döntést vársz tőlük.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {NOT_FOR_GUIDE.map((item) => (
              <article
                key={item.title}
                className="rounded-md border border-[oklch(0.78_0.10_80/0.12)] bg-[oklch(0.13_0.03_292/0.48)] p-4"
              >
                <h3 className="font-display text-xl leading-tight text-ivory">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivory/62">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

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
              delivery="Normál esetben 24 órán belül, expresszel 6 órán belül"
              bestFor="Ha a saját születési képletedből kérsz 30 napos, éves, tranzit- vagy teljes védikus elemzést."
              result="Több oldalas, személyre szabott riport születési dátum, idő és hely alapján."
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ivory/58">
            Mindkét típus elérhető a biztonságos rendelési linken; bejelentkezve a profilban is
            visszanézhető. Vendégként az emailt és a rendelési linket érdemes megtartanod. Elkészült
            olvasatnál minőségi visszajelzést is tudsz küldeni, ha valamit pontosítanál.
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
              Az asztrológiai riportok a saját születési adataidból készülnek; normál esetben 24
              órán belül érkeznek, expressz gyorsítással 6 órán belül.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-5 md:p-7">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
            Fizetés előtt átnézhető
          </div>
          <h2 className="mt-2 font-display text-3xl text-ivory">
            A döntés nem rejtett feltételeken múlik
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {PRE_PURCHASE_CHECKS.map((item) => (
              <article
                key={item.title}
                className="rounded-md border border-[oklch(0.78_0.10_80/0.12)] bg-[oklch(0.13_0.03_292/0.48)] p-4"
              >
                <h3 className="font-display text-xl leading-tight text-ivory">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivory/62">{item.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link
              to="/aszf"
              className="rounded-md border border-gold/25 px-3 py-2 text-gold transition-colors hover:border-gold/60"
            >
              ÁSZF
            </Link>
            <Link
              to="/elallasi-tajekoztato"
              className="rounded-md border border-gold/25 px-3 py-2 text-gold transition-colors hover:border-gold/60"
            >
              Elállási tájékoztató
            </Link>
            <Link
              to="/adatkezelesi-tajekoztato"
              className="rounded-md border border-gold/25 px-3 py-2 text-gold transition-colors hover:border-gold/60"
            >
              Adatkezelés
            </Link>
            <a
              href={`mailto:${SITE_LEGAL.supportEmail}`}
              className="rounded-md border border-gold/25 px-3 py-2 text-gold transition-colors hover:border-gold/60"
            >
              Kérdés vásárlás előtt
            </a>
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

function BudgetFitCard({
  title,
  price,
  text,
  cta,
  href,
}: {
  title: string;
  price: string;
  text: string;
  cta: string;
  href: string;
}) {
  return (
    <article className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl leading-tight text-ivory">{title}</h3>
        <span className="shrink-0 text-sm tabular-nums text-gold">{price}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/62">{text}</p>
      <a
        href={href}
        className="mt-4 inline-flex items-center justify-center rounded-md border border-gold/25 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/60"
      >
        {cta}
      </a>
    </article>
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
    <section
      id={category === "instant" ? "azonnali-olvasatok" : "asztrologiai-riportok"}
      className="mt-10"
    >
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
          {category === "instant"
            ? "Fizetés után néhány percen belül"
            : "A jelzett elkészülési idővel"}
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
            <div className="mt-3 inline-flex rounded-full border border-gold/18 px-2 py-1 text-[11px] text-gold/72">
              {productDeliveryBadge(product)}
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
            <div className="mt-3 rounded-md border border-gold/10 bg-black/10 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold/65">
                Akkor jó, ha
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ivory/56">
                {productFitHint(product)}
              </p>
            </div>
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

function productFitHint(product: (typeof PRODUCTS)[number]): string {
  switch (product.slug) {
    case "napi_lap_ai":
    case "extra_huzas":
      return "egy rövid mai jel megállított, és szeretnéd a saját helyzetedre visszafordítani.";
    case "mai_iranytu_ai":
      return "nem nagy riport kell, hanem egy személyes napi fókusz szerelem, munka vagy belső ritmus felől.";
    case "angyalszam_ai":
      return "egy szám újra felbukkant, és nem általános jelentést, hanem helyzethez kötött olvasatot kérsz.";
    case "kristaly_ai":
      return "szimbolikus támpontot keresel egy érzéshez vagy időszakhoz, testi hatásígéret nélkül.";
    case "alomfejtes_rovid":
      return "egy álom képe vagy hangulata veled maradt, és önismereti jelként néznél rá.";
    case "horoszkop_szemelyre":
      return "az általános jegyszöveg helyett a mostani témádra kérsz rövid napi fókuszt.";
    case "harom_lap_mely":
      return "egy kérdés mögött már történetet érzel, és nem három külön lapmagyarázatot szeretnél.";
    case "kelta_kereszt":
      return "összetett helyzetet nézel, ahol több réteg, félelem és lehetőség keveredik.";
    case "dontes_komplex":
      return "nem kész választ vársz, hanem tisztábban szeretnéd látni, mi húz és mi tart vissza.";
    case "parkapcsolat_elemzes":
      return "randi, ex, visszatérő kötődés vagy bizonytalan dinamika kér figyelmet.";
    case "szammisztika_eletut":
      return "a sorsszámodnál mélyebbre mennél: név, személyes év és visszatérő működés együtt érdekel.";
    case "personal_30_day":
      return "a következő hetek ívét néznéd a saját születési képletedhez kapcsolva.";
    case "personal_yearly":
      return "nem napi választ keresel, hanem egy hosszabb időszak fő témáit szeretnéd látni.";
    case "transits_personal":
      return "arra vagy kíváncsi, miért most erősödik fel egy téma az életedben.";
    case "vedic_full":
      return "sziderikus szemléletben, mélyebb születési képleti rétegekkel néznél rá magadra.";
    default:
      return product.category === "instant"
        ? "egy konkrét kérdésre vagy érzésre kérsz rövid, személyes olvasatot."
        : "születési adatokból épülő, hosszabb írásos elemzést szeretnél.";
  }
}

function productDeliveryBadge(product: (typeof PRODUCTS)[number]): string {
  if (product.category === "instant") return "Pár percen belül elkészül";
  const hours = product.standardHours ?? 24;
  return `${hours} órán belül készül el`;
}

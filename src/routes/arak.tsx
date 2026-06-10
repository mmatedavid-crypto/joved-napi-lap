import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { EXPRESS_PRICE_HUF, PRODUCTS, formatHuf, type ProductCategory } from "@/lib/products";

const PRICING_FAQ = [
  {
    question: "Kell fiókot létrehoznom a vásárláshoz?",
    answer:
      "Nem kötelező. Vendégként a biztonságos rendelési linken és emailben éred el az olvasatot; bejelentkezve később a profilodban is visszanézheted.",
  },
  {
    question: "Mi a különbség az azonnali és a részletes olvasatok között?",
    answer:
      "Az azonnali olvasatok rövidebb, személyes válaszok néhány percen belül. A részletes olvasatok több szakaszos írásos elemzések, általában 24 órán belül.",
  },
  {
    question: "Mi történik, ha technikai hiba miatt nem nyílik meg az olvasat?",
    answer:
      "A rendelési link és a vásárlási email alapján utánanézünk, pótoljuk a hozzáférést, vagy hibás megjelenés esetén javítjuk és újraküldjük az olvasatot.",
  },
  {
    question: "Ezek jóslatok?",
    answer:
      "Nem. A Jövőd.hu szimbolikus, önismereti digitális tartalmat ad. Nem orvosi, jogi, pénzügyi vagy krízistanácsadás, és nem ígér biztos jövőt.",
  },
] as const;

export const Route = createFileRoute("/arak")({
  head: () => ({
    meta: [
      { title: "Árak és olvasatok | Jövőd.hu" },
      {
        name: "description",
        content:
          "Jövőd.hu árak: azonnali személyes olvasatok 590 Ft-tól, részletes írásos elemzések 24 órán belül.",
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

  return (
    <Layout>
      <PageHeader
        eyebrow="Árak"
        title="Olvasatok átlátható áron"
        lead="Kezdhetsz egy rövid, azonnali olvasattal, vagy kérhetsz részletesebb írásos elemzést, ha a helyzet több figyelmet érdemel."
      />

      <div className="mx-auto max-w-6xl px-4 md:px-6 pb-20">
        <section className="grid gap-3 md:grid-cols-3">
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
        </section>

        <PricingGroup
          title="Azonnali olvasatok"
          lead="Rövid, személyes válaszok néhány percen belül. Jó első próba, napi kérdéshez vagy egy konkrét belső fókuszhoz."
          products={instant}
          category="instant"
        />

        <PricingGroup
          title="Részletes írásos elemzések"
          lead="Mélyebb, több szakaszos olvasatok 24 órán belül. Akkor érdemes, ha a kérdés nem fér bele egy rövid válaszba."
          products={delayed}
          category="delayed"
        />

        <section className="mt-10 rounded-md border border-gold/15 bg-[oklch(0.78_0.10_80/0.055)] p-5 md:p-7">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">Hogyan válassz?</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <p className="font-editorial text-lg leading-relaxed text-ivory/78">
              Ha csak azt szeretnéd érezni, hogy a Jövőd.hu hangja működik-e neked, válassz egy
              azonnali olvasatot. Ha ugyanaz a kérdés napok óta visszatér, a részletesebb elemzés ad
              több teret.
            </p>
            <p className="font-editorial text-lg leading-relaxed text-ivory/78">
              A részletes olvasatokhoz express gyorsítás is kérhető {formatHuf(EXPRESS_PRICE_HUF)}
              -ért. Ha nem sürgős, a normál határidő kedvezőbb.
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

function TrustPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-4">
      <div className="font-display text-xl text-ivory">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/62">{text}</p>
    </div>
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
          {category === "instant" ? "Fizetés után azonnal" : "24 órán belül"}
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

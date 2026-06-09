// Termék katalógus — egyetlen forrás a Stripe price_id-khoz, kategóriához és kézbesítési határidőkhöz.

export type ProductCategory = "instant" | "delayed";

export interface ProductDef {
  slug: string;
  priceId: string; // Stripe lookup_key
  name: string;
  short: string;
  includes: string[];
  qualityPromise: string;
  priceHuf: number;
  category: ProductCategory;
  // Csak késleltetett termékekhez: standard szállítási idő órákban
  standardHours?: number;
  expressHours?: number;
  // Forrás-route (paywall): hol jelenik meg a termék
  sourceRoute?: string;
}

export const EXPRESS_PRICE_ID = "express_6h_price";
export const EXPRESS_PRICE_HUF = 990;
export const EXPRESS_HOURS = 6;

export const PRODUCTS: ProductDef[] = [
  {
    slug: "napi_lap_ai",
    priceId: "napi_lap_ai_price",
    name: "Napi lap — személyes olvasat",
    short: "Személyre szabott elemzés a mai lapodhoz.",
    includes: [
      "a kihúzott lap személyes értelmezése",
      "rövid helyzetkép a mai napra",
      "egy figyelni érdemes belső irány",
    ],
    qualityPromise: "Azonnali, rövid, de személyes olvasat. Nem általános horoszkópszöveg.",
    priceHuf: 590,
    category: "instant",
    sourceRoute: "/mai-lap",
  },
  {
    slug: "mai_iranytu_ai",
    priceId: "mai_iranytu_ai_price",
    name: "Mai iránytű — személyes üzenet",
    short: "Mit üzen a mai napod neked személyesen.",
    includes: [
      "napi önismereti irány",
      "szerelem/munka/hangulat finom bontása",
      "egy konkrét kérdés, amire érdemes figyelned",
    ],
    qualityPromise: "Azonnali napi iránytű, személyesebb hanggal, nem magazinos jóslatként.",
    priceHuf: 690,
    category: "instant",
    sourceRoute: "/mai-iranytu",
  },
  {
    slug: "angyalszam_ai",
    priceId: "angyalszam_ai_price",
    name: "Angyalszám — mélyebb olvasat",
    short: "Az angyalszámod személyre szabott jelentése.",
    includes: [
      "a szám szimbolikus jelentése",
      "mit jelezhet a mostani élethelyzetedben",
      "egy rövid önismereti fókusz",
    ],
    qualityPromise: "Szimbolikus értelmezés, józanul megfogalmazva, túlzó ígéretek nélkül.",
    priceHuf: 590,
    category: "instant",
    sourceRoute: "/angyalszam",
  },
  {
    slug: "kristaly_ai",
    priceId: "kristaly_ai_price",
    name: "Kristály ajánlás — személyesen",
    short: "A mostani helyzetedhez illő kristály.",
    includes: [
      "egy kristály szimbolikus ajánlása",
      "milyen minőséget képviselhet számodra",
      "rövid, gyógyítási ígéret nélküli értelmezés",
    ],
    qualityPromise: "Önismereti kristály-ajánlás, nem egészségügyi vagy gyógyító állítás.",
    priceHuf: 590,
    category: "instant",
    sourceRoute: "/kristaly",
  },
  {
    slug: "alomfejtes_rovid",
    priceId: "alomfejtes_rovid_price",
    name: "Álomfejtés — rövid olvasat",
    short: "Az álmod szimbólumainak rövid értelmezése.",
    includes: [
      "az álom fő szimbólumának értelmezése",
      "az általad megadott álomhangulat figyelembevétele",
      "visszatérő álomnál finom mintajelzés",
    ],
    qualityPromise: "Önismereti álomfejtés, diagnózis és ijesztgetés nélkül.",
    priceHuf: 790,
    category: "instant",
    sourceRoute: "/alomfejtes",
  },
  {
    slug: "horoszkop_szemelyre",
    priceId: "horoszkop_szemelyre_price",
    name: "Horoszkóp — személyre szabott",
    short: "Mai horoszkópod a te helyzetedre szabva.",
    includes: [
      "jegyed mai archetípusos mintája",
      "rövid szerelem/munka/figyelem bontás",
      "a megadott helyzetedhez igazított üzenet",
    ],
    qualityPromise: "Rövid, személyes napi horoszkóp; nem bulvárjóslat.",
    priceHuf: 790,
    category: "instant",
    sourceRoute: "/horoszkop",
  },
  {
    slug: "extra_huzas",
    priceId: "extra_huzas_price",
    name: "Extra napi húzás",
    short: "Még egy húzás ma — a napi limit feloldása.",
    includes: [
      "egy új személyes lapolvasat",
      "rövid helyzethez kötött értelmezés",
      "külön figyelmeztetés, ha a kérdés ismétlődik",
    ],
    qualityPromise: "Az extra húzás nem dönt helyetted, hanem új nézőpontot ad.",
    priceHuf: 590,
    category: "instant",
  },
  {
    slug: "harom_lap_mely",
    priceId: "harom_lap_mely_price",
    name: "Három lap — mély elemzés",
    short: "Részletes, összefüggő háromlapos elemzés 24 órán belül.",
    includes: [
      "múlt, jelen és jövő külön értelmezése",
      "a három lap közös történetének szintézise",
      "a kérdésedre reflektáló mélyebb összegzés",
    ],
    qualityPromise: "Részletesebb, prémium olvasat; nem három különálló lapmagyarázat.",
    priceHuf: 1990,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
    sourceRoute: "/harom-lap",
  },
  {
    slug: "kelta_kereszt",
    priceId: "kelta_kereszt_price",
    name: "Kelta kereszt — nagy spread",
    short: "10 lapos, nagy tarot-riport mélyebb kérdésekhez.",
    includes: [
      "10 lapos klasszikus kelta kereszt szerkezet",
      "akadály, háttér, tudatos és rejtett réteg",
      "összefüggő nagy kép a kérdésed körül",
    ],
    qualityPromise: "A legmélyebb tarot-riport: lassabb, részletesebb, összefüggő elemzés.",
    priceHuf: 2990,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
  },
  {
    slug: "dontes_komplex",
    priceId: "dontes_komplex_price",
    name: "Döntés előtt — komplex elemzés",
    short: "Komplex olvasat, ha egy döntést szeretnél tisztábban látni.",
    includes: [
      "a megadott döntési helyzet értelmezése",
      "mi húz vissza és mi nyithat utat",
      "érzelmi szempontok döntésparancs nélkül",
    ],
    qualityPromise: "Nem mondja meg, mit tegyél; segít tisztábban látni, mi mozgat.",
    priceHuf: 2490,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
    sourceRoute: "/dontes-elott",
  },
  {
    slug: "parkapcsolat_elemzes",
    priceId: "parkapcsolat_elemzes_price",
    name: "Párkapcsolat — mély elemzés",
    short: "Mélyebb kapcsolati elemzés randi, ex vagy összeillés kérdéshez.",
    includes: [
      "kapcsolati dinamika és tempó",
      "vonzalom, kommunikáció és hosszú táv bontása",
      "ex/visszatérő történetnél óvatos visszatérési minta",
    ],
    qualityPromise:
      "Nem ígéri, hogy valaki visszajön vagy szeret; a mintát és a realitást olvassa.",
    priceHuf: 2490,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
    sourceRoute: "/randi-elott",
  },
  {
    slug: "szammisztika_eletut",
    priceId: "szammisztika_eletut_price",
    name: "Számmisztika — életút elemzés",
    short: "Személyes numerológiai életút-elemzés névvel és születési dátummal.",
    includes: [
      "sorsszám és születésnap száma",
      "teljes név esetén belső vágy, külső kép és kifejeződés",
      "szerelem, munka, árnyékoldal és személyes év",
    ],
    qualityPromise: "Személyesebb életút-olvasat születési dátum és név alapján.",
    priceHuf: 2490,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
    sourceRoute: "/szammisztika",
  },
];

export const PRODUCTS_BY_SLUG: Record<string, ProductDef> = Object.fromEntries(
  PRODUCTS.map((p) => [p.slug, p]),
);

export const PRODUCTS_BY_PRICE_ID: Record<string, ProductDef> = Object.fromEntries(
  PRODUCTS.map((p) => [p.priceId, p]),
);

export function formatHuf(amount: number): string {
  return new Intl.NumberFormat("hu-HU").format(amount) + " Ft";
}

export function productPriceLabel(slug: string): string {
  const product = PRODUCTS_BY_SLUG[slug];
  return product ? formatHuf(product.priceHuf) : "";
}

export function productCtaLabel(label: string, slug: string): string {
  const price = productPriceLabel(slug);
  return price ? `${label} · ${price}` : label;
}

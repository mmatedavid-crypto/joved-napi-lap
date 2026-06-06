// Termék katalógus — egyetlen forrás a Stripe price_id-khoz, kategóriához és kézbesítési határidőkhöz.

export type ProductCategory = "instant" | "delayed";

export interface ProductDef {
  slug: string;
  priceId: string; // Stripe lookup_key
  name: string;
  short: string;
  priceHuf: number;
  category: ProductCategory;
  // Csak késleltetett termékekhez: standard szállítási idő órákban
  standardHours?: number;
  expressHours?: number;
  // Forrás-route (paywall): hol jelenik meg a termék
  sourceRoute?: string;
}

export const EXPRESS_PRICE_ID = "express_6h_v2";
export const EXPRESS_PRICE_HUF = 990;
export const EXPRESS_HOURS = 6;

export const PRODUCTS: ProductDef[] = [
  {
    slug: "napi_lap_ai",
    priceId: "napi_lap_ai_v2",
    name: "Napi lap — AI értelmezés",
    short: "Személyre szabott elemzés a mai lapodhoz.",
    priceHuf: 490,
    category: "instant",
    sourceRoute: "/mai-lap",
  },
  {
    slug: "mai_iranytu_ai",
    priceId: "mai_iranytu_ai_v2",
    name: "Mai iránytű — AI üzenet",
    short: "Mit üzen a mai napod neked személyesen.",
    priceHuf: 590,
    category: "instant",
    sourceRoute: "/mai-iranytu",
  },
  {
    slug: "angyalszam_ai",
    priceId: "angyalszam_ai_v2",
    name: "Angyalszám — AI elemzés",
    short: "Az angyalszámod személyre szabott jelentése.",
    priceHuf: 490,
    category: "instant",
    sourceRoute: "/angyalszam",
  },
  {
    slug: "kristaly_ai",
    priceId: "kristaly_ai_v2",
    name: "Kristály ajánlás — AI",
    short: "A mostani helyzetedhez illő kristály.",
    priceHuf: 490,
    category: "instant",
    sourceRoute: "/kristaly",
  },
  {
    slug: "alomfejtes_rovid",
    priceId: "alomfejtes_rovid_v2",
    name: "Álomfejtés — rövid AI",
    short: "Az álmod szimbólumainak rövid értelmezése.",
    priceHuf: 790,
    category: "instant",
    sourceRoute: "/alomfejtes",
  },
  {
    slug: "horoszkop_szemelyre",
    priceId: "horoszkop_szemelyre_v2",
    name: "Horoszkóp — személyre szabott",
    short: "Mai horoszkópod a te helyzetedre szabva.",
    priceHuf: 990,
    category: "instant",
    sourceRoute: "/horoszkop",
  },
  {
    slug: "extra_huzas",
    priceId: "extra_huzas_v2",
    name: "Extra napi húzás",
    short: "Még egy húzás ma — a napi limit feloldása.",
    priceHuf: 490,
    category: "instant",
  },
  {
    slug: "harom_lap_mely",
    priceId: "harom_lap_mely_v2",
    name: "Három lap — mély elemzés",
    short: "Három lapos húzás részletes elemzése. 12–24 órán belül emailben.",
    priceHuf: 1990,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
    sourceRoute: "/harom-lap",
  },
  {
    slug: "kelta_kereszt",
    priceId: "kelta_kereszt_v2",
    name: "Kelta kereszt — nagy spread",
    short: "10 lapos klasszikus kelta kereszt. 12–24 órán belül emailben.",
    priceHuf: 2990,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
  },
  {
    slug: "dontes_komplex",
    priceId: "dontes_komplex_v2",
    name: "Döntés előtt — komplex elemzés",
    short: "Komplex döntéselőkészítő olvasat. 12–24 órán belül emailben.",
    priceHuf: 2490,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
    sourceRoute: "/dontes-elott",
  },
  {
    slug: "parkapcsolat_elemzes",
    priceId: "parkapcsolat_elemzes_v2",
    name: "Párkapcsolat — mély elemzés",
    short: "Randi előtt vagy összeillés részletes olvasata. 12–24 órán belül emailben.",
    priceHuf: 2490,
    category: "delayed",
    standardHours: 24,
    expressHours: EXPRESS_HOURS,
    sourceRoute: "/randi-elott",
  },
  {
    slug: "szammisztika_eletut",
    priceId: "szammisztika_eletut_v2",
    name: "Számmisztika — életút elemzés",
    short: "Teljes numerológiai életút elemzés. 12–24 órán belül emailben.",
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
// Termék katalógus — egyetlen forrás a Stripe price_id-khoz, kategóriához és kézbesítési határidőkhöz.

export type ProductCategory = "instant" | "delayed";

export interface ProductDef {
  slug: string;
  priceId: string; // Stripe lookup_key
  name: string;
  short: string;
  includes: string[];
  depthPromise: string[];
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
    depthPromise: [
      "a tarot hagyományos lapjelképét a kérdésedhez és a mai helyzetedhez köti",
      "nem csak kulcsszavakat ad, hanem rövid belső irányt",
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
    depthPromise: [
      "a napi rituálé hagyományos jeleit a megadott személyes adataiddal hangolja össze",
      "külön kezeli a kapcsolat, munka és belső ritmus rétegeit",
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
    depthPromise: [
      "a számmisztikai hagyomány számjelét a megadott helyzeted felől értelmezi",
      "óvatos, önismereti nyelven mutatja meg a visszatérő mintát",
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
      "rövid, józan és szimbolikus értelmezés",
    ],
    depthPromise: [
      "a kristályszimbolika régi jelentésrétegeit hónaphoz, jegyhez vagy témához kapcsolja",
      "szimbolikus önismereti jelentést ad, testi hatásígéret nélkül",
    ],
    qualityPromise: "Önismereti kristály-ajánlás, nem egészségügyi állítás.",
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
    depthPromise: [
      "az álomfejtés szimbólumhagyományát az ébredés utáni érzéssel együtt olvassa",
      "nem diagnosztizál, hanem önismereti jelként keresi a visszatérő témát",
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
    depthPromise: [
      "az asztrológiai hagyomány napi jegyhangulatát személyes fókuszként adja",
      "ha megadsz témát, arra külön reflektál a szerelem/munka/figyelem bontásban",
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
      "külön jelzés, ha a kérdés ismétlődik",
    ],
    depthPromise: [
      "az új tarot-húzást a korábbi napi kérdésedhez képest is keretezi",
      "segít észrevenni, ha ugyanazt a választ keresed másik laptól",
    ],
    qualityPromise: "Az extra húzás nem dönt helyetted, hanem új nézőpontot ad.",
    priceHuf: 590,
    category: "instant",
    sourceRoute: "/mai-lap",
  },
  {
    slug: "harom_lap_mely",
    priceId: "harom_lap_mely_price",
    name: "Három lap — mély elemzés",
    short: "Részletes, összefüggő háromlapos elemzés.",
    includes: [
      "múlt, jelen és jövő külön értelmezése",
      "a három lap közös történetének szintézise",
      "a kérdésedre reflektáló mélyebb összegzés",
    ],
    depthPromise: [
      "a háromlapos tarot-hagyományt egy történetté fűzi, nem külön lapmagyarázatként adja",
      "a kérdésedben megjelenő feszültségre és következő belső lépésre figyel",
    ],
    qualityPromise: "Részletesebb, prémium olvasat; nem három különálló lapmagyarázat.",
    priceHuf: 990,
    category: "instant",
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
    depthPromise: [
      "a klasszikus kelta kereszt hagyományos pozícióiból rajzol ki mélyebb mintát",
      "komplex helyzeteknél nem gyors választ, hanem átláthatóbb képet ad",
    ],
    qualityPromise: "A legmélyebb azonnali tarot-olvasat: részletesebb, összefüggő elemzés.",
    priceHuf: 990,
    category: "instant",
    sourceRoute: "/harom-lap",
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
    depthPromise: [
      "a tarot jelképrendszerét a konkrét döntésedre vonatkoztatja, nem általános tanácsot ad",
      "külön kezeli, mi félelemből és mi tisztább belső irányból mozgat",
    ],
    qualityPromise: "Nem mondja meg, mit tegyél; segít tisztábban látni, mi mozgat.",
    priceHuf: 990,
    category: "instant",
    sourceRoute: "/dontes-elott",
  },
  {
    slug: "parkapcsolat_elemzes",
    priceId: "parkapcsolat_elemzes_price",
    name: "Szerelmi tarot — kapcsolati olvasat",
    short: "Kapcsolati olvasat randi, ex vagy összeillés kérdéshez.",
    includes: [
      "kapcsolati dinamika és tempó",
      "vonzalom, kommunikáció és hosszú táv bontása",
      "ex/visszatérő történetnél óvatos visszatérési minta",
    ],
    depthPromise: [
      "a szerelmi tarot hagyományos kapcsolati motívumait a kapcsolat típusához illeszti",
      "nem ígér visszatérést, hanem tempót, realitást és ismétlődő mintát olvas",
    ],
    qualityPromise:
      "Nem ígéri, hogy valaki visszajön vagy szeret; a mintát és a realitást olvassa.",
    priceHuf: 990,
    category: "instant",
    sourceRoute: "/osszeillunk",
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
    depthPromise: [
      "a számmisztikai hagyomány szerint együtt nézi a születési dátumot és a teljes nevet",
      "a számokat személyes életút, munka, szerelem és árnyékoldal szerint bontja",
    ],
    qualityPromise: "Személyesebb életút-olvasat születési dátum és név alapján.",
    priceHuf: 990,
    category: "instant",
    sourceRoute: "/szammisztika",
  },
  {
    slug: "personal_30_day",
    priceId: "personal_30_day_price",
    name: "A következő 30 napod térképe",
    short: "Személyes 30 napos időszaki térkép születési adataidból.",
    includes: [
      "születési képleted rövid összegzése",
      "30 napos időablak: szerelem, munka, döntések",
      "időszaki figyelmi pontok és lehetőségi ablakok",
    ],
    depthPromise: [
      "az asztrológiai tranzithagyományt a saját képletedre vetíti, nem általános horoszkóp",
      "életterületre fókuszál: szerelem, munka, pénz-döntés vagy általános",
    ],
    qualityPromise: "Több oldalas, személyre szabott időszaki térkép a következő 30 napra.",
    priceHuf: 1490,
    category: "delayed",
    standardHours: 24,
    sourceRoute: "/szemelyes-30-napos-horoszkop",
  },
  {
    slug: "vedic_full",
    priceId: "vedic_full_price",
    name: "Védikus asztrológia — részletes elemzés",
    short: "Több oldalas védikus képlet-elemzés születési adatokból.",
    includes: [
      "sziderikus Nap, Hold és aszcendens, ha a forrásadat engedi",
      "rashi, nakshatra és bolygóhelyzetek",
      "kulcsmotívumok a választott életterületed körül",
    ],
    depthPromise: [
      "védikus szemléletű, sziderikus képletértelmezés",
      "visszatérő minták kibontása túlzó sorsállítás nélkül",
    ],
    qualityPromise: "Komplex, grafikus, többoldalas védikus riport. Nem napi horoszkóp.",
    priceHuf: 1990,
    category: "delayed",
    standardHours: 24,
    sourceRoute: "/vedikus-asztrologia",
  },
  {
    slug: "personal_yearly",
    priceId: "personal_yearly_price",
    name: "Személyes éves horoszkóp",
    short: "Részletes éves időszaki térkép a saját születési képletedből, hónapról hónapra.",
    includes: [
      "12 hónap kulcstémái a saját képletedre szabva",
      "kiemelt időablakok: szerelem, munka, döntések",
      "éves fő motívum és a 9 éves életciklusod helyzete",
    ],
    depthPromise: [
      "az éves asztrológiai ciklusokat a saját születési képletedhez illeszti",
      "havi bontás, nem általános éves jegyhoroszkóp",
    ],
    qualityPromise: "Több oldalas, személyre szabott éves riport — nem újságos jegyhoroszkóp.",
    priceHuf: 4990,
    category: "delayed",
    standardHours: 24,
    sourceRoute: "/eves-horoszkop",
  },
  {
    slug: "transits_personal",
    priceId: "transits_personal_price",
    name: "Tranzitok — személyes elemzés",
    short: "A jelenleg ható bolygótranzitok jelentése a saját képletedre.",
    includes: [
      "a most aktív tranzitok személyes értelmezése",
      "feszültségi és lehetőségi pontok 90 napra",
      "időszaki figyelmi pontok és hangsúlyváltások",
    ],
    depthPromise: [
      "a hagyományos bolygótranzitokat a saját bolygóid és házaid felől olvassa",
      "nem általános napi horoszkóp, hanem a te képletedre szóló időzítés",
    ],
    qualityPromise: "Komoly asztrológiai tranzit-elemzés magyarul, józan hanggal.",
    priceHuf: 3990,
    category: "delayed",
    standardHours: 24,
    sourceRoute: "/tranzitok",
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

export function productDeliveryShortLabel(slug: string): string {
  const product = PRODUCTS_BY_SLUG[slug];
  if (!product) return "";
  if (product.category === "instant") return "pár perc";
  return `${product.standardHours ?? 24} órán belül`;
}

export function productCtaLabel(label: string, slug: string): string {
  const price = productPriceLabel(slug);
  const delivery = productDeliveryShortLabel(slug);
  return price && delivery
    ? `${label} · ${price} · ${delivery}`
    : price
      ? `${label} · ${price}`
      : label;
}

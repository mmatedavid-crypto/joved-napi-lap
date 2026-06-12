export type ChineseAnimal = {
  slug: string;
  name: string;
  element: string;
  yinYang: "jin" | "jang";
  years: number[];
  keywords: string[];
  personality: string;
  love: string;
  career: string;
  money: string;
  health: string;
  compatible: string[];
  challenging: string[];
  luckyColor: string;
  luckyNumber: string;
};

export const CHINESE_ANIMALS: ChineseAnimal[] = [
  {
    slug: "patkany",
    name: "Patkány",
    element: "Víz",
    yinYang: "jang",
    years: [1924, 1936, 1948, 1960, 1972, 1984, 1996, 2008, 2020, 2032],
    keywords: ["okos", "találékony", "alkalmazkodó"],
    personality:
      "A patkány a kínai állatöv első jegye: gyors észjárású, leleményes és kifinomultan érti az embereket. Csendben figyel, mielőtt lépne, és általában már akkor látja a megoldást, amikor mások még a problémát értelmezik.",
    love: "A patkány érzelmileg óvatos: nem mutatja meg a sebezhetőségét annak, aki nem érdemli ki. Akit viszont beenged, azt mély hűséggel és gondoskodó figyelemmel veszi körül. Romantikus, de gyakorlatias is — szereti a kiszámítható, biztonságos kötődést.",
    career: "Stratégia, pénzügy, kutatás, írás, kommunikáció — minden olyan terület, ahol a kombinációs készség és az emberismeret számít. Önállóan és kis csapatban a legjobb, nagy hierarchiában kifullad.",
    money: "Természetes érzéke van a pénzhez: jól gyűjt, óvatosan költ. Akkor hibázik, ha a félelem vezérli — ilyenkor túl szűken markol, és lemarad lehetőségekről.",
    health: "Az idegrendszere a gyenge pontja. A folyamatos elemzés és aggódás kimeríti — pihenés, csendes séta, alvás-rituálé sokat segít.",
    compatible: ["Sárkány", "Majom", "Bivaly"],
    challenging: ["Ló", "Kecske"],
    luckyColor: "Kék, arany",
    luckyNumber: "2, 3",
  },
  {
    slug: "bivaly",
    name: "Bivaly",
    element: "Föld",
    yinYang: "jin",
    years: [1925, 1937, 1949, 1961, 1973, 1985, 1997, 2009, 2021, 2033],
    keywords: ["kitartó", "megbízható", "csendes erő"],
    personality:
      "A bivaly a türelem mestere: lassú, megfontolt, de amit elkezd, azt végig is viszi. Nem szeret feltűnősködni — a teljesítménye beszél helyette. Konzervatív értékrendű és mélyen lojális.",
    love: "Hosszú távra szövetkezik. Nem flörtölős típus, de aki nála köt ki, az biztonságra és valódi otthonra számíthat. Néha túl visszafogott: ki kell mondania, amit érez, különben félreértik.",
    career: "Mezőgazdaság, építőipar, mérnöki munka, könyvelés, jog — mindenhol, ahol a kitartás és a részletekre figyelés számít. Csapatban a hűséges, megbízható oszlop.",
    money: "Lépésről lépésre gyarapszik. Nem kockáztat feleslegesen, hosszú távon viszont a legtöbbet teszi félre az állatöv tagjai közül.",
    health: "Nyak, hát, ízületek érzékenyek lehetnek — a folyamatos terhelés és a meg-nem-mondott feszültség testbe ül. Mozgás és masszázs kötelező.",
    compatible: ["Patkány", "Kígyó", "Kakas"],
    challenging: ["Kecske", "Ló"],
    luckyColor: "Sárga, fehér, zöld",
    luckyNumber: "1, 9",
  },
  {
    slug: "tigris",
    name: "Tigris",
    element: "Fa",
    yinYang: "jang",
    years: [1926, 1938, 1950, 1962, 1974, 1986, 1998, 2010, 2022, 2034],
    keywords: ["bátor", "szenvedélyes", "lázadó"],
    personality:
      "A tigris a megújulás energiája. Karizmatikus, eltökélt, és nem fél szembemenni a tömeggel. Vezetésre született, de csak akkor működik jól, ha hisz az ügyben — kényszerre rosszul reagál.",
    love: "Heves és intenzív. Akit szeret, azért képes hegyet megmozgatni, de a féltékenység és birtoklási vágy könnyen csapdába viszi. Egyenrangú partnerre van szüksége, aki nem akarja megszelídíteni.",
    career: "Vállalkozás, politika, művészet, sport, mentorálás — mindenhol, ahol kell egy erős, eredeti hang. Beosztottnak nehéz, mert nem szereti az ostoba szabályokat.",
    money: "Nagyvonalúan költ és nagyvonalúan keres — hullámvasút. Akkor stabil, ha van mellette egy földhözragadtabb partner vagy könyvelő.",
    health: "Stressz, alváshiány, kiégés a fő ellenség. Periódusosan szüksége van magányos időre, hogy újratöltődjön.",
    compatible: ["Ló", "Kutya", "Disznó"],
    challenging: ["Majom", "Kígyó"],
    luckyColor: "Kék, szürke, narancs",
    luckyNumber: "1, 3, 4",
  },
  {
    slug: "nyul",
    name: "Nyúl",
    element: "Fa",
    yinYang: "jin",
    years: [1927, 1939, 1951, 1963, 1975, 1987, 1999, 2011, 2023, 2035],
    keywords: ["finom", "diplomatikus", "esztéta"],
    personality:
      "A nyúl a kifinomultság és a béke jegye. Érzékeny mások hangulatára, jó megfigyelő, művészi lélek. Konfliktusokat kerül — néha a saját kárára is.",
    love: "Romantikus, gyengéd, hosszú udvarlást vár és ad. Akkor virágzik, ha a kapcsolat harmonikus és esztétikus. A nyers, hangos energia gyorsan kimeríti.",
    career: "Művészet, design, gyógyítás, oktatás, diplomácia — minden, ahol az érzékenység és az ízlés érték. Csendes szakértőként a legerősebb.",
    money: "Óvatosan gazdálkodik, szépségbe és kényelembe szívesen fektet. A pénz biztonságot jelent neki, nem státuszt.",
    health: "Emésztés, hormonháztartás, idegrendszer érzékeny. Túl sok input (zaj, fény, érzelem) gyorsan kimeríti.",
    compatible: ["Kecske", "Disznó", "Kutya"],
    challenging: ["Kakas", "Sárkány"],
    luckyColor: "Rózsaszín, lila, halvány zöld",
    luckyNumber: "3, 4, 9",
  },
  {
    slug: "sarkany",
    name: "Sárkány",
    element: "Föld",
    yinYang: "jang",
    years: [1928, 1940, 1952, 1964, 1976, 1988, 2000, 2012, 2024, 2036],
    keywords: ["karizmatikus", "ambiciózus", "varázslatos"],
    personality:
      "A sárkány a kínai állatöv legmágikusabb jegye: nagy energiájú, vízionárius, magával ragadó. Ahol megjelenik, ott történik valami. Nem szeret középszerű lenni — vagy a csúcson, vagy sehol.",
    love: "Erős vonzerejű, sokak fejét elcsavarja, de a tartós kapcsolathoz valódi partner kell, aki nem a státuszáért, hanem érte van vele.",
    career: "Vezetés, vállalkozás, művészet, technológia — bárhol, ahol látnoki energia és nagy tét van. Unalmas munka megöli.",
    money: "Vonzza a bőséget, de éppoly gyorsan szórja, mint amilyen gyorsan keresi. Tudatos pénzügyi tervezés stabilizálja.",
    health: "Magas energiaszintje csalóka — ha nem alszik és nem pihen, hirtelen omlik össze. A tűz után csendre van szüksége.",
    compatible: ["Patkány", "Majom", "Kakas"],
    challenging: ["Kutya", "Nyúl"],
    luckyColor: "Arany, ezüst, szürkés-fehér",
    luckyNumber: "1, 6, 7",
  },
  {
    slug: "kigyo",
    name: "Kígyó",
    element: "Tűz",
    yinYang: "jin",
    years: [1929, 1941, 1953, 1965, 1977, 1989, 2001, 2013, 2025, 2037],
    keywords: ["bölcs", "intuitív", "rejtélyes"],
    personality:
      "A kígyó a mély megérzés és a csendes elemzés jegye. Kívülről nyugodt, belül folyamatosan dolgozik. Tudja, mikor kell szólni és mikor hallgatni — ezért hatékonyabb sok hangos embernél.",
    love: "Lassan nyílik meg, de mélyen kötődik. Érzékeny és birtokló — bizalom kell, hogy a hűvös pikkelyek alatt megmutassa a melegét.",
    career: "Pszichológia, kutatás, művészet, pénzügy, diplomácia — minden, ahol a háttérből látni jól. Önállóan a legjobb.",
    money: "Jó pénzügyi érzéke van, gyakran nem mutogatja a vagyonát. Hosszú távon gondolkodik, befektetésre érzékenyen ráhangolódik.",
    health: "Pajzsmirigy, hormonháztartás, idegrendszer érzékeny. A folyamatos belső monológ kimeríti — meditáció létszükséglet.",
    compatible: ["Bivaly", "Kakas", "Majom"],
    challenging: ["Tigris", "Disznó"],
    luckyColor: "Fekete, piros, sárga",
    luckyNumber: "2, 8, 9",
  },
  {
    slug: "lo",
    name: "Ló",
    element: "Tűz",
    yinYang: "jang",
    years: [1930, 1942, 1954, 1966, 1978, 1990, 2002, 2014, 2026, 2038],
    keywords: ["szabad", "lendületes", "őszinte"],
    personality:
      "A ló a szabadság energiája: vidám, mozgékony, lelkes. Gyorsan tanul, gyorsan unatkozik. Egyenes ember — jó és rossz értelemben is, mert nem mindig veszi észre, mikor sebez a szavaival.",
    love: "Szenvedélyes és könnyed egyszerre. Kell, hogy a partner ne ketrecbe zárja, hanem mellé álljon. Akkor tartós a kapcsolata, ha mindketten élhetnek a saját életükkel is.",
    career: "Értékesítés, utazás, sport, média, oktatás — mozgás, emberek, változatosság kell. Íróasztal mögé zárva elsorvad.",
    money: "Könnyen jön és könnyen megy. Akkor stabil, ha automatikusan félretesz, mert tudatos spórolásra nem hajlamos.",
    health: "Lába, dereka érzékeny. Az állandó mozgás öröm, de a túlhajszolás gyors kimerülést hoz.",
    compatible: ["Tigris", "Kecske", "Kutya"],
    challenging: ["Patkány", "Bivaly"],
    luckyColor: "Sárga, zöld, lila",
    luckyNumber: "2, 3, 7",
  },
  {
    slug: "kecske",
    name: "Kecske",
    element: "Föld",
    yinYang: "jin",
    years: [1931, 1943, 1955, 1967, 1979, 1991, 2003, 2015, 2027, 2039],
    keywords: ["érzékeny", "kreatív", "együttérző"],
    personality:
      "A kecske finom lelkű, művészi érzékű, mélyen empatikus jegy. Nem szereti a konfliktust, és néha túl sokat ad fel a békéért. Belső világa gazdag — ott szüli a legjobb ötleteit.",
    love: "Romantikus, érzékeny, mély érzelmű. Stabil, gyengéd partner kell hozzá, aki nem viszi át a saját stresszét. Egy biztonságos kapcsolat kivirágoztatja.",
    career: "Művészet, terápia, kézművesség, oktatás, gyermekekkel való munka — mindenhol, ahol a kreativitás és a szív számít. Kemény versenyhelyzet kimeríti.",
    money: "Nem materialista, de szereti a szépséget. Megfontoltan költ a környezetére. Hosszú távon stabil, ha van egy gyakorlatias rendszere.",
    health: "Emésztés és idegrendszer érzékeny. Hangulatingadozásokra hajlamos — fontos a napi rituálé és a természetközelség.",
    compatible: ["Nyúl", "Ló", "Disznó"],
    challenging: ["Bivaly", "Kutya"],
    luckyColor: "Zöld, piros, lila",
    luckyNumber: "3, 9, 4",
  },
  {
    slug: "majom",
    name: "Majom",
    element: "Fém",
    yinYang: "jang",
    years: [1932, 1944, 1956, 1968, 1980, 1992, 2004, 2016, 2028, 2040],
    keywords: ["okos", "játékos", "leleményes"],
    personality:
      "A majom a kreatív problémamegoldás jegye. Gyors észjárású, humoros, kíváncsi. Mindenből játékot csinál, de ha akar, halálos pontosan dolgozik.",
    love: "Szellemes és vonzó, könnyen szerez hódolót. A tartós kapcsolathoz olyan partner kell, aki lépést tart vele intellektuálisan, és nem akarja hamar besorolni.",
    career: "Technológia, marketing, művészet, vállalkozás, kutatás — minden, ahol az ötlet és a gyors váltás érték.",
    money: "Vonzza, ki is játssza. Néha rizikós, de általában rátalál a megoldásra. Akkor stabil, ha hagyja, hogy más kezeljen mellette egy részt.",
    health: "Idegrendszer és emésztés érzékeny. A folyamatos pörgés árt — szüksége van lekapcsolódó hobbira és csendes alvásra.",
    compatible: ["Patkány", "Sárkány", "Kígyó"],
    challenging: ["Tigris", "Disznó"],
    luckyColor: "Fehér, kék, arany",
    luckyNumber: "1, 7, 8",
  },
  {
    slug: "kakas",
    name: "Kakas",
    element: "Fém",
    yinYang: "jin",
    years: [1933, 1945, 1957, 1969, 1981, 1993, 2005, 2017, 2029, 2041],
    keywords: ["büszke", "őszinte", "precíz"],
    personality:
      "A kakas a rend, a fegyelem és a megjelenés mestere. Kemény munkás, részletekre figyelő, egyenes beszédű. Néha kritikus, mert magas mércét állít — magának is.",
    love: "Egyenes, lojális, hűséges. Akit szeret, annak tudtára adja. Néha túl őszinte — a finomságot tanulnia kell, hogy a partnert ne sebezze.",
    career: "Pénzügy, ügyvédi, orvosi, katonai, design — mindenhol, ahol a pontosság és a rendszer számít.",
    money: "Megfontoltan keres és költ. Szereti a látható minőséget, de nem szórja el a vagyonát.",
    health: "Idegrendszer és emésztés — a perfekcionizmus testbe ül. Engednie kell, hogy a tökéletlen is jó.",
    compatible: ["Bivaly", "Kígyó", "Sárkány"],
    challenging: ["Nyúl", "Kutya"],
    luckyColor: "Arany, barna, sárga",
    luckyNumber: "5, 7, 8",
  },
  {
    slug: "kutya",
    name: "Kutya",
    element: "Föld",
    yinYang: "jang",
    years: [1934, 1946, 1958, 1970, 1982, 1994, 2006, 2018, 2030, 2042],
    keywords: ["hűséges", "igazságos", "védelmező"],
    personality:
      "A kutya az állatöv erkölcsi iránytűje: lojális, igazságszerető, mélyen empatikus. Akit a szívébe zár, azért bármit megtesz. Nem hisz könnyen, de ha igen, akkor mélyen.",
    love: "Hűséges, gondoskodó partner. Bizalom nélkül nem működik — egy hazugság elég, és kifagy. Hosszú távra szövetkezik.",
    career: "Jog, oktatás, egészségügy, civil munka, biztonság — mindenhol, ahol értékek mentén lehet dolgozni.",
    money: "Nem ez a fő motívuma. Megbízhatóan keres, megbízhatóan gondoskodik a családjáról. Luxust nem hajszol.",
    health: "Idegrendszer és emésztés — túl sokat veszi szívére mások bajait. Tanulnia kell elengedni, ami nem az övé.",
    compatible: ["Tigris", "Nyúl", "Ló"],
    challenging: ["Sárkány", "Kecske"],
    luckyColor: "Zöld, piros, lila",
    luckyNumber: "3, 4, 9",
  },
  {
    slug: "disznok",
    name: "Disznó",
    element: "Víz",
    yinYang: "jin",
    years: [1935, 1947, 1959, 1971, 1983, 1995, 2007, 2019, 2031, 2043],
    keywords: ["nagylelkű", "őszinte", "élvező"],
    personality:
      "A disznó az élet szeretetének jegye: meleg szívű, nagylelkű, tisztességes. Nem szereti a manipulációt, és általában az ő őszintesége is olyan, mint egy nyitott könyv.",
    love: "Érzelmes, családszerető, mélyen gondoskodó. Akit szeret, azért áldozatra is kész. Néha túl bizalmas — fontos, hogy ne hagyja magát kihasználni.",
    career: "Vendéglátás, gondozás, művészet, vendéglátás, jótékonyság — mindenhol, ahol az emberi melegség érték.",
    money: "Szereti az élet jó dolgait, néha túl is költekezik. Akkor stabil, ha automatizált megtakarítása van.",
    health: "Anyagcsere, máj, emésztés érzékeny. Mértéktartás az evés-ivás körül kulcsfontosságú.",
    compatible: ["Nyúl", "Kecske", "Tigris"],
    challenging: ["Kígyó", "Majom"],
    luckyColor: "Sárga, szürke, barna",
    luckyNumber: "2, 5, 8",
  },
];

export function findAnimalByYear(year: number): ChineseAnimal | undefined {
  return CHINESE_ANIMALS.find((a) => a.years.includes(year));
}

export function findAnimalBySlug(slug: string): ChineseAnimal | undefined {
  return CHINESE_ANIMALS.find((a) => a.slug === slug);
}

// Kínai újév (Gergely-naptár szerinti) dátumai: [hónap, nap].
// A kínai állatövi év nem január 1-jén, hanem a kínai újévkor vált.
export const CHINESE_NEW_YEAR: Record<number, [number, number]> = {
  1920: [2, 20], 1921: [2, 8], 1922: [1, 28], 1923: [2, 16], 1924: [2, 5],
  1925: [1, 24], 1926: [2, 13], 1927: [2, 2], 1928: [1, 23], 1929: [2, 10],
  1930: [1, 30], 1931: [2, 17], 1932: [2, 6], 1933: [1, 26], 1934: [2, 14],
  1935: [2, 4], 1936: [1, 24], 1937: [2, 11], 1938: [1, 31], 1939: [2, 19],
  1940: [2, 8], 1941: [1, 27], 1942: [2, 15], 1943: [2, 5], 1944: [1, 25],
  1945: [2, 13], 1946: [2, 2], 1947: [1, 22], 1948: [2, 10], 1949: [1, 29],
  1950: [2, 17], 1951: [2, 6], 1952: [1, 27], 1953: [2, 14], 1954: [2, 3],
  1955: [1, 24], 1956: [2, 12], 1957: [1, 31], 1958: [2, 18], 1959: [2, 8],
  1960: [1, 28], 1961: [2, 15], 1962: [2, 5], 1963: [1, 25], 1964: [2, 13],
  1965: [2, 2], 1966: [1, 21], 1967: [2, 9], 1968: [1, 30], 1969: [2, 17],
  1970: [2, 6], 1971: [1, 27], 1972: [2, 15], 1973: [2, 3], 1974: [1, 23],
  1975: [2, 11], 1976: [1, 31], 1977: [2, 18], 1978: [2, 7], 1979: [1, 28],
  1980: [2, 16], 1981: [2, 5], 1982: [1, 25], 1983: [2, 13], 1984: [2, 2],
  1985: [2, 20], 1986: [2, 9], 1987: [1, 29], 1988: [2, 17], 1989: [2, 6],
  1990: [1, 27], 1991: [2, 15], 1992: [2, 4], 1993: [1, 23], 1994: [2, 10],
  1995: [1, 31], 1996: [2, 19], 1997: [2, 7], 1998: [1, 28], 1999: [2, 16],
  2000: [2, 5], 2001: [1, 24], 2002: [2, 12], 2003: [2, 1], 2004: [1, 22],
  2005: [2, 9], 2006: [1, 29], 2007: [2, 18], 2008: [2, 7], 2009: [1, 26],
  2010: [2, 14], 2011: [2, 3], 2012: [1, 23], 2013: [2, 10], 2014: [1, 31],
  2015: [2, 19], 2016: [2, 8], 2017: [1, 28], 2018: [2, 16], 2019: [2, 5],
  2020: [1, 25], 2021: [2, 12], 2022: [2, 1], 2023: [1, 22], 2024: [2, 10],
  2025: [1, 29], 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13],
  2030: [2, 3], 2031: [1, 23], 2032: [2, 11], 2033: [1, 31],
};

export type ChineseCalcResult = {
  animal: ChineseAnimal;
  zodiacYear: number;
  adjustedForNewYear: boolean;
};

/**
 * Megadott születési dátumhoz tartozó kínai állatövi jegy.
 * Ha a dátum az adott évi kínai újév ELŐTT van, az előző év jegye érvényes.
 */
export function findAnimalByDate(year: number, month: number, day: number): ChineseCalcResult | null {
  if (!Number.isInteger(year) || year < 1920 || year > 2033) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const cny = CHINESE_NEW_YEAR[year];
  let zodiacYear = year;
  let adjusted = false;
  if (cny) {
    const [m, d] = cny;
    if (month < m || (month === m && day < d)) {
      zodiacYear = year - 1;
      adjusted = true;
    }
  }
  const idx = (((zodiacYear - 1924) % 12) + 12) % 12;
  const animal = CHINESE_ANIMALS[idx];
  if (!animal) return null;
  return { animal, zodiacYear, adjustedForNewYear: adjusted };
}
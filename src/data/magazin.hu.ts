// Magazin/blog seed cikkek — SEO content marketing.
// Statikus, evergreen tartalmak. Új cikkek hozzáadása itt egyszerű.

export interface MagazinPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "tarot" | "asztrologia" | "numerologia" | "onismeret" | "ritualek";
  categoryLabel: string;
  publishedAt: string; // ISO
  readMinutes: number;
  keywords: string[];
  body: string; // markdown-szerű, egyszerű HTML render
}

export const MAGAZIN_POSTS: MagazinPost[] = [
  {
    slug: "tarot-kezdoknek",
    title: "Tarot kezdőknek: hogyan érdemes először kártyát húzni?",
    excerpt:
      "Mit jelent valójában a tarot, miért nem jóslás, és hogyan állj hozzá az első húzásodhoz józanul.",
    category: "tarot",
    categoryLabel: "Tarot",
    publishedAt: "2026-01-15",
    readMinutes: 6,
    keywords: ["tarot", "kezdő", "kártya húzás", "önismeret"],
    body: `A tarot nem jóslás, hanem önismereti tükör. A 78 lap egy szimbólumrendszer, amelyben a Nagy Arkánum (22 lap) életszakaszokat és belső átalakulásokat ír le, a Kis Arkánum (56 lap) pedig a hétköznapok finomabb mintáit.\n\nMielőtt kártyát húzol, fogalmazz meg egy nyitott kérdést. Ne azt kérdezd, "visszajön-e", hanem azt: "mi mozgat ebben a helyzetben?" A nyitott kérdés mélyebb választ enged.\n\nElső húzásnál egyetlen lap is elég. Olvasd el a lap szimbolikus jelentését, és kérdezd meg magadtól: mit ismerek fel ebből a saját helyzetemben? A tarot ereje nem a lapban van, hanem abban, hogy önmagadra figyelsz.`,
  },
  {
    slug: "sorsszam-kiszamitasa",
    title: "Sorsszám kiszámítása: lépésről lépésre, példákkal",
    excerpt:
      "Hogyan számold ki a saját sorsszámodat a születési dátumodból, és mit jelentenek a mesterszámok.",
    category: "numerologia",
    categoryLabel: "Számmisztika",
    publishedAt: "2026-01-22",
    readMinutes: 5,
    keywords: ["sorsszám", "numerológia", "mesterszám", "életút szám"],
    body: `A sorsszám a numerológia központi száma: a születési dátumod összes számjegyét adod össze, amíg egyetlen számjegyű eredményt nem kapsz (1–9), kivéve a mesterszámokat (11, 22, 33).\n\nPélda: 1989.07.14 → 1+9+8+9+0+7+1+4 = 39 → 3+9 = 12 → 1+2 = 3. Sorsszám: 3.\n\nA mesterszámokat (11, 22, 33) nem bontjuk tovább, mert önálló rezgést hordoznak. Ha az összegzés közben mesterszámra futsz, megállhatsz ott — de a "végeredmény" mesterszámként is és tovább bontva is értelmezhető.\n\nA sorsszám az életutadat írja le: milyen tanulási pályára érkeztél. Nem személyiségteszt, hanem irány.`,
  },
  {
    slug: "holdnaptar-rituale",
    title: "Holdnaptár: mit kezdjünk az újholddal és a teliholddal?",
    excerpt:
      "A holdfázisok ritmusa és egyszerű, józan rituálék, amelyek beépíthetők a hétköznapokba.",
    category: "ritualek",
    categoryLabel: "Rituálék",
    publishedAt: "2026-02-03",
    readMinutes: 7,
    keywords: ["holdnaptár", "újhold", "telihold", "rituálé"],
    body: `Az újhold a kezdetek ideje: érdemes ekkor szándékot írni, új projektet indítani, csendben fogalmazni. A telihold a beérés, a leválás és az elengedés holdja — ekkor látjuk meg, mi készült el bennünk, és mit hagyhatunk el.\n\nEgyszerű újhold-rituálé: írj le három mondatot arról, mit szeretnél hívni az életedbe a következő ciklusra. Tedd el, és a következő újholdkor nézd újra.\n\nTelihold-rituálé: írj le három dolgot, ami már nem szolgál téged. Égesd el a papírt (biztonságosan!), vagy egyszerűen tépd össze. Nem mágia — figyelem-gyakorlat.\n\nA holdnaptár nem hit kérdése, hanem ritmus. Egy lassabb belső óra, amihez igazodhatsz.`,
  },
  {
    slug: "asztrologia-vs-horoszkop",
    title: "Asztrológia vs. újságos horoszkóp: mi a különbség?",
    excerpt:
      "Miért nem ugyanaz a napi jegyhoroszkóp és a személyes születési képlet — és melyik mit ér.",
    category: "asztrologia",
    categoryLabel: "Asztrológia",
    publishedAt: "2026-02-12",
    readMinutes: 6,
    keywords: ["asztrológia", "horoszkóp", "születési képlet", "natal chart"],
    body: `Az újságos horoszkóp egyetlen adatból dolgozik: a Nap-jegyedből. Ezért 1/12-ed pontossággal "általánosít" — mindenkire egyszerre próbál érvényes lenni, aki adott hónapban született.\n\nA személyes asztrológia ezzel szemben a teljes születési képletedből indul ki: pontos dátum, óra, perc, hely. A Nap, a Hold, az Aszcendens és a többi bolygó helyzete együtt rajzol ki egy egyedi mintát.\n\nA Nap-jegy a tudatos énedet, a Hold az érzelmi belső ritmusodat, az Aszcendens pedig azt, ahogyan a világba lépsz. Csak a hármat együtt nézve kezd személyessé válni a kép.\n\nNapi újságos horoszkóp szórakozásnak jó. Ha tényleg magadat akarod látni, személyes képletet kérj.`,
  },
  {
    slug: "angyalszamok-ertelmezese",
    title: "Angyalszámok: 111, 222, 333 — mit jelentenek valójában?",
    excerpt:
      "Az ismétlődő számok szimbolikus értelmezése józan, önismereti hangon.",
    category: "numerologia",
    categoryLabel: "Számmisztika",
    publishedAt: "2026-02-20",
    readMinutes: 4,
    keywords: ["angyalszám", "111", "222", "333", "ismétlődő számok"],
    body: `Az angyalszámok ismétlődő számsorok (111, 222, 1212), amelyek a hétköznapokban tűnnek fel: órán, rendszámon, blokkon. Nem üzenet a "túlvilágról", hanem a figyelmed jelzése — észreveszed, mert valami éppen kérdés benned.\n\n111: új kezdet, szándék-tisztítás. Mire figyelsz, az erősödik.\n222: egyensúly, párkapcsolati téma. Türelem és bizalom.\n333: kreativitás, kifejezés, közösség. Most ne maradj csendben.\n444: stabilitás, alap. Most a részletekre figyelj.\n555: változás, mozgás. Ne ragaszkodj a régi formához.\n\nAz angyalszám nem dönt helyetted. Csak azt mondja: most figyelj.`,
  },
  {
    slug: "merkur-retrograd",
    title: "Merkúr retrográd: mit szabad és mit nem érdemes?",
    excerpt:
      "A leghíresebb retrográd időszak — józan magyarázat, gyakorlati tanácsok.",
    category: "asztrologia",
    categoryLabel: "Asztrológia",
    publishedAt: "2026-03-01",
    readMinutes: 5,
    keywords: ["merkúr retrográd", "retrográd", "kommunikáció"],
    body: `A Merkúr évente háromszor-négyszer "retrográdba fordul" — látszólag visszafelé halad az égbolton. Asztrológiai szempontból ez a kommunikáció, az utazás és a technika lassuló időszaka.\n\nMit nem érdemes ilyenkor? Új szerződést aláírni, új autót / telefont venni, fontos emailt kapkodva kiküldeni. Nem azért, mert "elátkoz", hanem mert a tapasztalat szerint több az újraírás, a félreértés.\n\nMit jó megtenni? Átnézni régi projekteket, befejezni, ami félben maradt, kapcsolatot felvenni régi emberekkel. A "re-" igekötős szavak ideje: re-vízió, re-organizáció, re-konnektálás.\n\nNem misztikum, hanem időzítés. Ha tudod, kezelhető.`,
  },
  {
    slug: "alomfejtes-alapok",
    title: "Álomfejtés alapok: miért álmodunk és mit kezdjünk vele?",
    excerpt:
      "Az álmok mint önismereti tükör — szimbolika és gyakorlati napló-módszer.",
    category: "onismeret",
    categoryLabel: "Önismeret",
    publishedAt: "2026-03-10",
    readMinutes: 6,
    keywords: ["álomfejtés", "álom jelentése", "álomnapló"],
    body: `Az álmokat nem szabad szótár szerint olvasni. Egy víz-álom mást jelent egy úszónak és mást egy víztől félő embernek. A szimbólum mindig személyes.\n\nA legegyszerűbb módszer az álomnapló. Ébredés után 1-2 percen belül írd le, amire emlékszel — címszavakban is jó. Egy hét után visszanézve gyakran látszik a visszatérő minta: ugyanaz a helyszín, ugyanaz az érzés, ugyanaz az "nem érek oda időben" feszültség.\n\nA visszatérő álom ott jelez, ahol a tudatos figyelmed még nem nézett oda. Nem jóslás, hanem belső üzenet — neked, saját nyelveden.\n\nIjesztő álom? Nem baljóslat. Általában feldolgozandó feszültség, amit a tudat napközben félretolt.`,
  },
  {
    slug: "kristalyok-onismereti-eszkozkent",
    title: "Kristályok mint önismereti eszközök — józanul",
    excerpt:
      "Mit tudnak és mit nem a kristályok, és hogyan használhatók szimbolikus segítőként.",
    category: "ritualek",
    categoryLabel: "Rituálék",
    publishedAt: "2026-03-18",
    readMinutes: 5,
    keywords: ["kristály", "ametiszt", "rózsakvarc", "kristályok jelentése"],
    body: `A kristályok nem gyógyítanak betegséget. Bármilyen testi-lelki probléma esetén orvost / pszichológust keress. A kristály szimbolikus eszköz: emlékeztető tárgy egy minőségre, amit erősíteni szeretnél magadban.\n\nRózsakvarc: önelfogadás, megengedés.\nAmetiszt: tisztánlátás, lecsendesítés.\nCitrin: lendület, nyitottság.\nFekete turmalin: határtartás, földelés.\nHegyikristály: tisztítás, fókusz.\n\nA módszer egyszerű: válassz egy kristályt, ami a mostani fókuszodhoz illik, és tedd látható helyre. Minden alkalommal, amikor ránézel, eszedbe jut, mire figyelsz éppen. Ennyi a "varázs": a figyelem fenntartása.`,
  },
  {
    slug: "kinai-horoszkop-bevezetes",
    title: "Kínai horoszkóp: az állatövi év és a saját jegyed",
    excerpt:
      "A 12 állatövi jegy, az 5 elem és hogy mit jelent a kínai újév az asztrológiában.",
    category: "asztrologia",
    categoryLabel: "Asztrológia",
    publishedAt: "2026-03-25",
    readMinutes: 6,
    keywords: ["kínai horoszkóp", "kínai újév", "állatövi jegyek", "öt elem"],
    body: `A kínai horoszkóp 12 állatövi jegyet ismer (Patkány, Bivaly, Tigris, Nyúl, Sárkány, Kígyó, Ló, Kecske, Majom, Kakas, Kutya, Disznó), amelyek 12 éves ciklusban váltják egymást. Ehhez társul az 5 elem (fa, tűz, föld, fém, víz), így 60 éves nagy ciklust ad.\n\nA jegyed nem a Gergely-naptári születésnapodhoz, hanem a kínai újévhez igazodik (januári-februári holdújév). Ha január végén / február elején születtél, érdemes utánanézni, melyik évhez tartozol.\n\nA kínai horoszkóp más logikára épül, mint a nyugati: nem hónaphoz, hanem évhez köti az alaptípust. Egy "Kígyó-évben született ember" tipikusan finom, megfigyelő, óvatos.\n\nHasználd kiegészítő rétegként a nyugati asztrológiához, ne helyette.`,
  },
  {
    slug: "i-ching-bevezetes",
    title: "I Ching: a változások könyve röviden",
    excerpt:
      "Mi a Ji King, hogyan működik a 64 hexagram, és hogyan tehetsz fel kérdést a könyvnek.",
    category: "asztrologia",
    categoryLabel: "I Ching",
    publishedAt: "2026-04-02",
    readMinutes: 7,
    keywords: ["i ching", "ji king", "hexagram", "változások könyve"],
    body: `Az I Ching (Ji King) ősi kínai bölcsesség-könyv, kb. 3000 éves. 64 hexagramból áll — minden hexagram 6 vonalból (yin/yang) épül fel, és egy adott élethelyzetet, mozgásmintát ír le.\n\nA klasszikus módszer 3 érme dobása, hatszor. A dobás eredménye adja a vonalakat alulról felfelé. Az így kirajzolódó hexagram egy szimbolikus "időképet" mutat: hol állsz most, mi mozdulóban van.\n\nA kérdés feltevésének módja számít. Ne eldöntendő kérdést kérdezz ("megkapom-e?"), hanem helyzetkérdést ("mi mozdul most ebben?"). Az I Ching nem jósol — leír.\n\nA jó válasz akkor érkezik, amikor le tudod ülni mellé a saját kérdésedet, és a hexagram szövegét lassan, magaddal együtt olvasod.`,
  },
];

export const MAGAZIN_CATEGORIES = [
  { slug: "tarot", label: "Tarot" },
  { slug: "asztrologia", label: "Asztrológia" },
  { slug: "numerologia", label: "Számmisztika" },
  { slug: "onismeret", label: "Önismeret" },
  { slug: "ritualek", label: "Rituálék" },
] as const;
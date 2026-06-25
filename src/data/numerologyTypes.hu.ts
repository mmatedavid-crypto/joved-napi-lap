// Számmisztika résztípusok: lélekszám, személyiségszám, kifejezésszám, személyes év.
// Statikus SEO-tartalom — a kalkulátor a /szammisztika oldalon él.

export type NumberEntry = {
  n: number;
  title: string;
  body: string;
};

export type NumerologyType = {
  slug: "lelek-szam" | "szemelyiseg-szam" | "kifejezes-szam" | "eves-szam";
  title: string;
  shortTitle: string;
  lead: string;
  intro: string;
  howTo: string;
  numbers: NumberEntry[];
};

export const LELEK_SZAM: NumerologyType = {
  slug: "lelek-szam",
  title: "Lélekszám jelentése — mit kíván a szíved",
  shortTitle: "Lélekszám",
  lead: "A lélekszám (más néven szívvágy-szám) a numerológiai hagyomány szerint a belső vágyirányokra és csendesebb motivációkra adhat nézőpontot.",
  intro:
    "A lélekszámot a numerológia a belső igények egyik jelképes mutatójaként kezeli. Nem azt írja le, milyennek látnak mások, és nem ad kész választ arra sem, mitől leszel boldog; inkább azt segítheti észrevenni, milyen vágyak, hiányérzetek vagy motivációk térnek vissza benned.",
  howTo:
    "A teljes születési neved magánhangzóit (A, E, I, O, U, Á, É, Í, Ó, Ö, Ő, Ú, Ü, Ű) számértékre váltod (A=1, E=5, I=9, O=6, U=3, Y=7 — a magyar ékezetes hangzók ugyanazt az értéket kapják, mint az alapbetű), összeadod, majd egy számjegyre vagy mesterszámra (11, 22, 33) redukálod. Ez a lélekszámod.",
  numbers: [
    { n: 1, title: "1-es lélekszám", body: "Az 1-es lélekszám az önálló irány és a saját kezdeményezés iránti belső igényt jelképezi. Akkor adhat erőt, ha van tér a saját ötleteid kipróbálására. Árnyéka ott jelenhet meg, ahol a függés vagy a túl szűk keret hosszabb távon szűkíti a mozgásteredet." },
    { n: 2, title: "2-es lélekszám", body: "A 2-es lélekszám a kapcsolódás, béke és kölcsönösség iránti érzékenységet jelképezi. Fontos lehet számodra a bizalom és a finom hangolódás. Feszültebb vagy magányosabb időszakban érdemes külön figyelni arra, hogy legyen megtartó ritmusod és saját határod." },
    { n: 3, title: "3-as lélekszám", body: "A 3-as lélekszám az önkifejezés, játékosság és öröm iránti belső igényt jelképezi. Akkor lehet élőbb ez a minta, ha alkothatsz, beszélhetsz vagy formát adhatsz annak, ami benned van. Ha sokáig visszatartod magad, érdemes kis, biztonságos kifejezési tereket keresni." },
    { n: 4, title: "4-es lélekszám", body: "A 4-es lélekszám a biztonság, tisztaság és kiszámítható ritmus iránti igényt jelképezi. A rend és a megbízhatóság nyugalmat adhat. Kaotikus helyzetekben segíthet, ha nem mindent egyszerre akarsz rendezni, hanem egy konkrét kapaszkodót választasz." },
    { n: 5, title: "5-ös lélekszám", body: "Szabadság, kaland és változatosság hív. A lelked úgy nyer levegőt, ha új helyeket, embereket, élményeket fedezhet fel. A merev rutin lassan elveszi az életkedvedet." },
    { n: 6, title: "6-os lélekszám", body: "A 6-os lélekszám a szeretet, gondoskodás és otthonosság iránti érzékenységet jelképezi. Fontos lehet számodra, hogy a kapcsolatokban legyen kölcsönösség, melegség és felelősség. Árnyéka akkor jelenhet meg, ha a szeretetet túl könnyen önfeladással azonosítod." },
    { n: 7, title: "7-es lélekszám", body: "Bölcsesség és mélység után vágyik a lelked. Csendre, befelé fordulásra, kutatásra van szükséged. A felszínes társalgások és a folyamatos zaj fárasztanak." },
    { n: 8, title: "8-as lélekszám", body: "A 8-as lélekszám az erő, felelősség és kézzelfogható hatás iránti belső igényt jelképezi. Nem pénzügyi vagy státuszígéret, inkább azt mutathatja, hogy fontos számodra a kompetens jelenlét és a rendezett döntés. Árnyéka akkor jelenhet meg, ha az értékességet túl könnyen teljesítményhez vagy kontrollhoz kötöd." },
    { n: 9, title: "9-es lélekszám", body: "Tágabb értelmet keresel: szolgálatot, együttérzést, valamit, ami túlmutat rajtad. Akkor érzed teljesnek magad, ha az életed értelemmel tölt fel másokat is." },
    { n: 11, title: "11-es lélekszám", body: "Mestersz lélekszám: intuíció, ihlet, spirituális látás. Belső igazságokat akarsz közvetíteni — ám ehhez bátorság kell, mert a 11-es szenzitivitása sebezhetővé is tesz." },
    { n: 22, title: "22-es lélekszám", body: "Mestersz: nagy víziók megvalósítása a földön. Lelked olyat akar építeni, ami sokakat szolgál — ehhez fegyelmet és türelmet kell tanulnod." },
    { n: 33, title: "33-as lélekszám", body: "Mestersz: szeretetből szolgálni. A lelked tanítóként vagy mélyen támogató jelenlétként akar jelen lenni — de először magadnak kell megadnod azt a szeretetet, amit másoknak adsz." },
  ],
};

export const SZEMELYISEG_SZAM: NumerologyType = {
  slug: "szemelyiseg-szam",
  title: "Személyiségszám jelentése — milyennek látnak kívülről",
  shortTitle: "Személyiségszám",
  lead: "A személyiségszám azt mutatja, milyennek észlelnek mások az első benyomásra — a külső maszkod, mielőtt valaki közelebb kerül hozzád.",
  intro:
    "Ez a numerológiai szám nem azt írja le, ki vagy belül, hanem azt, ami kifelé sugárzik belőled. Nagyon hasznos önismereti eszköz: ha a személyiségszám és a lélekszám távol esik, érthetővé válik, miért gondolnak rólad mások mást, mint amit te magadról tudsz.",
  howTo:
    "A születési neved mássalhangzóit váltod számértékre (a magánhangzókat kihagyod), összeadod, és egyetlen számjegyre vagy mesterszámra redukálod.",
  numbers: [
    { n: 1, title: "1-es személyiség", body: "Magabiztosnak, kezdeményezőnek látszol. Az emberek úgy érzékelnek, mint aki tudja, mit akar — vezetői benyomást keltesz." },
    { n: 2, title: "2-es személyiség", body: "Kedvesnek, diplomatikusnak, együttműködőnek látszol. A légkört, ami körülötted van, mások nyugtatónak érzik." },
    { n: 3, title: "3-as személyiség", body: "Vidámnak, szellemesnek, könnyednek látnak. Az emberek szívesen vannak veled, mert életet viszel a térbe." },
    { n: 4, title: "4-es személyiség", body: "Megbízhatónak, földönjárónak, alaposnak látszol. Téged komolyan vesznek — ha valamit kimondasz, mások számítanak rá." },
    { n: 5, title: "5-ös személyiség", body: "Szabadnak, vonzónak, kalandvágyónak látnak. Vibrálsz — könnyen kerülsz a figyelem középpontjába." },
    { n: 6, title: "6-os személyiség", body: "Melegnek, gondoskodónak, jelenlévőnek látszol. Az emberek hozzád fordulnak a gondjaikkal, mert biztonságot sugárzol." },
    { n: 7, title: "7-es személyiség", body: "Rejtélyesnek, mélynek, kicsit visszafogottnak látnak. Nem fecsegsz — ha megszólalsz, súlya van." },
    { n: 8, title: "8-as személyiség", body: "A 8-as személyiségszám erős, határozott külső benyomást jelezhet. Mások könnyebben társíthatnak hozzád szervezettséget, felelősséget és gyakorlati súlyt, de ez nem státusz- vagy sikerígéret." },
    { n: 9, title: "9-es személyiség", body: "Bölcsnek, együttérzőnek, finomnak látnak. Egyfajta nemesség lengi körül a megjelenésedet." },
    { n: 11, title: "11-es személyiség", body: "Intuitívnak, érzékenynek, ihletettnek látszol. Mások gyakran kérik a véleményedet, anélkül hogy tudnák, miért." },
    { n: 22, title: "22-es személyiség", body: "Nagyívű látomásokat sugárzol — az emberek úgy érzik, valami fontosat építesz." },
    { n: 33, title: "33-as személyiség", body: "Anyai/atyai, megtartó erőt érzékelnek benned. Akik melletted vannak, gyakran megkönnyebbülnek, mert nyugodtabb térbe érkeznek." },
  ],
};

export const KIFEJEZES_SZAM: NumerologyType = {
  slug: "kifejezes-szam",
  title: "Kifejezésszám jelentése — milyen mintát fejez ki a neved",
  shortTitle: "Kifejezésszám",
  lead: "A kifejezésszám (Expression Number) a név hagyományos számmintáját olvassa: milyen kifejezési mód, tehetségirány és visszatérő belső ritmus kapcsolódhat hozzád a numerológiai hagyomány szerint.",
  intro:
    "Ez a szám a teljes születési nevedből számolódik (minden betű — magán- és mássalhangzó —, a magyar ékezetes formák ugyanazt az értéket kapják, mint az alapbetű) — abból a névből, amit a szüleidtől kaptál, és amelyet a numerológiai hagyomány jelképes mintaként olvas. A kifejezésszám nem kész életprogram, hanem önismereti nézőpont: azt figyeli, milyen módon tudsz természetesebben hatni, alkotni vagy kapcsolódni.",
  howTo:
    "A teljes születési neved minden betűjét számértékre váltod (A=1, B=2 … I=9, J=1, K=2 …), összeadod, és egy számjegyre vagy mesterszámra (11, 22, 33) redukálod.",
  numbers: [
    { n: 1, title: "1-es kifejezésszám", body: "Az 1-es kifejezésszám az önálló kezdeményezés, irányadás és alkotó bátorság mintáját jelképezi. Józan formában saját irányt keres, árnyékában viszont könnyen túl magányossá vagy túl akaraterőssé válhat." },
    { n: 2, title: "2-es kifejezésszám", body: "A 2-es kifejezésszám a közvetítés, együttműködés és kapcsolati érzékenység jelképe. Akkor működik tisztábban, ha a béketeremtés mellett a saját határok is láthatóak maradnak." },
    { n: 3, title: "3-as kifejezésszám", body: "A 3-as kifejezésszám a szó, kép, hang és örömteli önkifejezés hagyományos mintája. Támogató oldala az alkotókedv, árnyéka a szétszóródás vagy a felszín mögé rejtett szomorúság lehet." },
    { n: 4, title: "4-es kifejezésszám", body: "A 4-es kifejezésszám a rend, szerkezet és kitartó építkezés jelképe. Akkor ad jó irányt, ha a stabilitás nem merevséggé, hanem megbízható ritmussá alakul." },
    { n: 5, title: "5-ös kifejezésszám", body: "Az 5-ös kifejezésszám a szabadság, változatosság és tapasztalati tanulás mintáját hordozza. Egyensúlyban frissességet hoz, árnyékában viszont nehéz lehet hosszabb ideig egy választás mellett maradni." },
    { n: 6, title: "6-os kifejezésszám", body: "A 6-os kifejezésszám a gondoskodás, otthonteremtés és mások támogatására hangolódó figyelem jelképe. Akkor marad egészséges, ha a felelősség nem áldozatszereppé, hanem kölcsönös jelenlétté válik." },
    { n: 7, title: "7-es kifejezésszám", body: "A 7-es kifejezésszám a kutatás, elmélyülés és belső csend mintáját jelképezi. Támogató oldala a megértés keresése, árnyéka az elszigetelődés vagy a túlzott bizalmatlanság lehet." },
    { n: 8, title: "8-as kifejezésszám", body: "A 8-as kifejezésszám az erő, döntés, felelősség és kézzelfogható eredmények jelképe. Józan formában rendezni és vállalni tanít, nem uralkodni vagy mindent teljesítményként mérni." },
    { n: 9, title: "9-es kifejezésszám", body: "A 9-es kifejezésszám az együttérzés, tágabb nézőpont és lezárásra való képesség mintája. Akkor válik éretté, ha a segítés mellett az elengedés és a saját határ is helyet kap." },
    { n: 11, title: "11-es kifejezésszám (mesterszám)", body: "A 11-es mesterszám az ihlet, érzékenység és közvetítői figyelem jelképe. Erős belső feszültséget is mutathat, ezért különösen fontos benne a földeltség és a hétköznapi forma." },
    { n: 22, title: "22-es kifejezésszám (mesterszám)", body: "A 22-es mesterszám az építő minőség és a nagyobb víziók gyakorlati rendezésének jelképe. Akkor támogató, ha az ihlet, a felelősség és a fokozatos megvalósítás együtt marad." },
    { n: 33, title: "33-as kifejezésszám (mesterszám)", body: "A 33-as mesterszám a tanító, megtartó és szeretetből szolgáló minőség jelképe. Árnyéka az önfeladás lehet, ezért a saját szívhez való türelmes visszatérés is része a mintának." },
  ],
};

export const EVES_SZAM: NumerologyType = {
  slug: "eves-szam",
  title: "Személyes év jelentése — hol tartasz a 9 éves ciklusban",
  shortTitle: "Személyes év",
  lead: "A személyes éved azt mutatja, milyen energia kíséri ezt az évedet — minden numerológiai év más feladatot és más lehetőséget hoz a 9 éves ciklusban.",
  intro:
    "A személyes év egy 9 éves spirálban mozog. Minden évnek jellegzetes témája van: új kezdetek, együttműködés, alkotás, építkezés, változás, felelősség, befelé fordulás, beérés, lezárás. Ha tudod, melyik évedben vagy, megérted, miért történik veled most pont az, ami történik — és nem akadsz össze a ciklus természetes lendületével.",
  howTo:
    "A születésnapod hónapját és napját add össze az aktuális év számjegyeivel, és redukáld egy számjegyre (a 11-et és 22-t meghagyhatod). Pl. 1990. 06. 14., 2026-ban: 6 + 1 + 4 + 2 + 0 + 2 + 6 = 21 → 3-as személyes év.",
  numbers: [
    { n: 1, title: "1-es személyes év — Új kezdet", body: "Magvetés éve. Új projektek, új irány, új önállóság. Amit most elindítasz, a következő 9 évet meghatározza. Bátorság és kezdeményezés éve." },
    { n: 2, title: "2-es személyes év — Türelem és kapcsolat", body: "Lassú érlelődés, partnerségek építése. Ne erőltess gyors eredményt — most a kapcsolatok és az együttműködések szolgálnak. Diplomácia éve." },
    { n: 3, title: "3-as személyes év — Alkotás és öröm", body: "Önkifejezés, közönség, kreativitás. Társasági élet felélénkül, alkotó projektek lendületet vesznek. Ne aprózd szét magad — fókuszálj a legfontosabb alkotásra." },
    { n: 4, title: "4-es személyes év — Építkezés", body: "Munka, alap, rend. Most olyan struktúrákat rakhatsz le, amelyek hosszabb távon tartanak. A tested, időd és erőforrásaid ritmusára is érdemes józanul figyelni." },
    { n: 5, title: "5-ös személyes év — Változás", body: "Mozgás, új tapasztalat, irányváltás lehetősége. Több minden mozdulhat egyszerre, ezért a rugalmasság fontosabb, mint a régi forma mindenáron való megtartása." },
    { n: 6, title: "6-os személyes év — Felelősség és otthon", body: "Kapcsolatok, otthon, családi vagy érzelmi felelősség kerülhet előtérbe. Az adás és kapás egyensúlya most különösen beszédes." },
    { n: 7, title: "7-es személyes év — Befelé fordulás", body: "Csend, tanulás, spiritualitás. Külső eredmények lassulnak, de a belső munka most a legértékesebb. Pihenj, olvass, kutass — ne erőltess döntéseket." },
    { n: 8, title: "8-as személyes év — Beérés", body: "Eredmény, felelősség és kézzelfogható rend éve lehet. Nem pénzügyi ígéret, inkább annak vizsgálata, hogyan bánsz az erőddel, döntéseiddel és vállalásaiddal." },
    { n: 9, title: "9-es személyes év — Lezárás", body: "Egy 9 éves ciklus záró szakasza. Ami már nem szolgál, természetesebben leválhat: szokások, szerepek, régi kötődések. A következő 1-es év új ritmust nyithat." },
  ],
};

export const NUMEROLOGY_TYPES: NumerologyType[] = [
  LELEK_SZAM,
  SZEMELYISEG_SZAM,
  KIFEJEZES_SZAM,
  EVES_SZAM,
];

export function getNumerologyType(slug: string): NumerologyType | undefined {
  return NUMEROLOGY_TYPES.find((t) => t.slug === slug);
}

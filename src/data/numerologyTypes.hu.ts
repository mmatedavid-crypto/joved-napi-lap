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
  lead: "A lélekszám (más néven szívvágy-szám) azt mutatja, mire vágyik legmélyebben a lelked — a magánjellegű motiváció, ami a döntéseid mögött áll.",
  intro:
    "A lélekszám a numerológia egyik legbelsőbb mutatója. Nem azt írja le, milyennek látnak mások, hanem azt, mi az, ami valójában boldoggá tesz. Sokan akkor ismerik fel a lélekszámukat, amikor egy kívülről sikeres életben is hiányérzet jelentkezik — a lélekszám visszamutat oda, ahonnan a valódi öröm fakad.",
  howTo:
    "A teljes születési neved magánhangzóit (A, E, I, O, U, Á, É, Í, Ó, Ö, Ő, Ú, Ü, Ű) számértékre váltod (A=1, E=5, I=9, O=6, U=3, Y=7 — a magyar ékezetes hangzók ugyanazt az értéket kapják, mint az alapbetű), összeadod, majd egy számjegyre vagy mestersz mára (11, 22, 33) redukálod. Ez a lélekszámod.",
  numbers: [
    { n: 1, title: "1-es lélekszám", body: "Szabadság és önállóság után vágyik a lelked. Akkor élsz teljes szívvel, ha a saját ötleteidet valósíthatod meg, és nem mások árnyékában haladsz. A függés bármilyen formája lassan kiüríti." },
    { n: 2, title: "2-es lélekszám", body: "Mély kapcsolódásra és békére vágysz. A lelked harmóniában érzi magát, ha közel állhat valakihez, akiben bízhat. A magány vagy a feszült légkör nagyon megviseli a belső világodat." },
    { n: 3, title: "3-as lélekszám", body: "Önkifejezésre és örömre vágyik a lelked. Akkor virágzol, ha alkothatsz, beszélhetsz, megmutathatod magad. Ha túl sokat fojtasz vissza, csendes szomorúság telepszik rád." },
    { n: 4, title: "4-es lélekszám", body: "Biztonságra és tisztaságra vágyik a szíved. A rend, a megbízhatóság és a látható eredmény ad neked nyugalmat. A kaotikus helyzetek vagy a légből kapott ígéretek mélyen kibillentenek." },
    { n: 5, title: "5-ös lélekszám", body: "Szabadság, kaland és változatosság hív. A lelked úgy nyer levegőt, ha új helyeket, embereket, élményeket fedezhet fel. A merev rutin lassan elveszi az életkedvedet." },
    { n: 6, title: "6-os lélekszám", body: "Szeretni és szeretve lenni — ez a lelked alapvágya. Otthon, család, gondoskodás teszi teljessé az életed. Akkor szenvedsz a legjobban, ha úgy érzed, a szeretetedet nem viszonozzák." },
    { n: 7, title: "7-es lélekszám", body: "Bölcsesség és mélység után vágyik a lelked. Csendre, befelé fordulásra, kutatásra van szükséged. A felszínes társalgások és a folyamatos zaj fárasztanak." },
    { n: 8, title: "8-as lélekszám", body: "Erő, hatás és anyagi szabadság hívnak. A lelked tisztelet és teljesítmény után vágyik — nem a hivalkodás, hanem a valódi súly miatt. A tehetetlenség érzése nagyon nehezen viselhető számodra." },
    { n: 9, title: "9-es lélekszám", body: "Tágabb értelmet keresel: szolgálatot, együttérzést, valamit, ami túlmutat rajtad. Akkor érzed teljesnek magad, ha az életed értelemmel tölt fel másokat is." },
    { n: 11, title: "11-es lélekszám", body: "Mestersz lélekszám: intuíció, ihlet, spirituális látás. Belső igazságokat akarsz közvetíteni — ám ehhez bátorság kell, mert a 11-es szenzitivitása sebezhetővé is tesz." },
    { n: 22, title: "22-es lélekszám", body: "Mestersz: nagy víziók megvalósítása a földön. Lelked olyat akar építeni, ami sokakat szolgál — ehhez fegyelmet és türelmet kell tanulnod." },
    { n: 33, title: "33-as lélekszám", body: "Mestersz: szeretetből szolgálni. A lelked tanítóként vagy gyógyítóként akar jelen lenni — de először magadnak kell megadnod azt a szeretetet, amit másoknak adsz." },
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
    "A születési neved mássalhangzóit váltod számértékre (a magánhangzókat kihagyod), összeadod, és egyetlen számjegyre vagy mestersz mára redukálod.",
  numbers: [
    { n: 1, title: "1-es személyiség", body: "Magabiztosnak, kezdeményezőnek látszol. Az emberek úgy érzékelnek, mint aki tudja, mit akar — vezetői benyomást keltesz." },
    { n: 2, title: "2-es személyiség", body: "Kedvesnek, diplomatikusnak, együttműködőnek látszol. A légkört, ami körülötted van, mások nyugtatónak érzik." },
    { n: 3, title: "3-as személyiség", body: "Vidámnak, szellemesnek, könnyednek látnak. Az emberek szívesen vannak veled, mert életet viszel a térbe." },
    { n: 4, title: "4-es személyiség", body: "Megbízhatónak, földönjárónak, alaposnak látszol. Téged komolyan vesznek — ha valamit kimondasz, mások számítanak rá." },
    { n: 5, title: "5-ös személyiség", body: "Szabadnak, vonzónak, kalandvágyónak látnak. Vibrálsz — könnyen kerülsz a figyelem középpontjába." },
    { n: 6, title: "6-os személyiség", body: "Melegnek, gondoskodónak, jelenlévőnek látszol. Az emberek hozzád fordulnak a gondjaikkal, mert biztonságot sugárzol." },
    { n: 7, title: "7-es személyiség", body: "Rejtélyesnek, mélynek, kicsit visszafogottnak látnak. Nem fecsegsz — ha megszólalsz, súlya van." },
    { n: 8, title: "8-as személyiség", body: "Erősnek, tekintélyesnek, sikeresnek látszol. Az emberek üzleti vagy döntéshozói szerepben látnak téged ösztönösen." },
    { n: 9, title: "9-es személyiség", body: "Bölcsnek, együttérzőnek, finomnak látnak. Egyfajta nemesség lengi körül a megjelenésedet." },
    { n: 11, title: "11-es személyiség", body: "Intuitívnak, érzékenynek, ihletettnek látszol. Mások gyakran kérik a véleményedet, anélkül hogy tudnák, miért." },
    { n: 22, title: "22-es személyiség", body: "Nagyívű látomásokat sugárzol — az emberek úgy érzik, valami fontosat építesz." },
    { n: 33, title: "33-as személyiség", body: "Anyai/atyai gyógyító erőt érzékelnek benned. Akik melletted vannak, megkönnyebbülnek." },
  ],
};

export const KIFEJEZES_SZAM: NumerologyType = {
  slug: "kifejezes-szam",
  title: "Kifejezésszám jelentése — a sorsfeladatod",
  shortTitle: "Kifejezésszám",
  lead: "A kifejezésszám (Expression Number, vagy Sorsfeladat-szám) azt írja le, milyen képességek megnyilvánítására születtél — a tehetségedet és az életcélodat.",
  intro:
    "Ez a szám a teljes születési nevedből számolódik (minden betű — magán- és mássalhangzó —, a magyar ékezetes formák ugyanazt az értéket kapják, mint az alapbetű) — abból a névből, amit a szüleidtől kaptál, és ami a sorsod kódját hordozza. A kifejezésszám nem azt mondja meg, mit fogsz csinálni, hanem azt, hogy milyen módon vagy a leghatékonyabb.",
  howTo:
    "A teljes születési neved minden betűjét számértékre váltod (A=1, B=2 … I=9, J=1, K=2 …), összeadod, és egy számjegyre vagy mestersz mára (11, 22, 33) redukálod.",
  numbers: [
    { n: 1, title: "1-es kifejezésszám", body: "Vezetésre, úttörésre, önálló alkotásra születtél. A feladatod megtanulni felelősséget vállalni a saját irányodért." },
    { n: 2, title: "2-es kifejezésszám", body: "Diplomata vagy: közvetítesz, harmonizálsz, kapcsolatokat építesz. A feladatod megtanulni határt szabni anélkül, hogy elveszítenéd az érzékenységed." },
    { n: 3, title: "3-as kifejezésszám", body: "Alkotásra születtél: szó, kép, hang. A feladatod, hogy az önkifejezésedet ne aprózd el — koncentráld egy fő alkotói pályára." },
    { n: 4, title: "4-es kifejezésszám", body: "Építkezésre születtél — rendszereket, struktúrákat hozol létre. A feladatod megtanulni, hogy a fegyelem nem rugalmatlanság, és a stabilitás nem unalom." },
    { n: 5, title: "5-ös kifejezésszám", body: "Szabadság, változatosság, kommunikáció. Sok mindennel megpróbálkozol — a feladatod megtanulni elkötelezni magad anélkül, hogy bezárva éreznéd magad." },
    { n: 6, title: "6-os kifejezésszám", body: "Gondoskodásra, otthonra, gyógyításra születtél. A feladatod megtanulni a felelősséget örömmel hordozni, nem áldozatként." },
    { n: 7, title: "7-es kifejezésszám", body: "Mélységkutató: tudomány, spiritualitás, kutatás. A feladatod megtanulni, hogy a magány nem elszigeteltség, és a bölcsesség akkor szolgál, ha megosztod." },
    { n: 8, title: "8-as kifejezésszám", body: "Anyagi hatalom, vezetés, üzlet. A feladatod megtanulni, hogy az erő szolgálni való, nem dominálni." },
    { n: 9, title: "9-es kifejezésszám", body: "Humanitárius út: szolgálat, együttérzés, művészet a köz javára. A feladatod megtanulni elengedni — embereket, kötődéseket, régi sebeket." },
    { n: 11, title: "11-es kifejezésszám (mestersz)", body: "Spirituális tanító, ihletett közvetítő. Magas feszültségű szám — feladatod megtanulni földelni a látomásaidat." },
    { n: 22, title: "22-es kifejezésszám (mestersz)", body: "Mesterépítő: nagy víziókat valósítasz meg a fizikai síkon. Feladatod összekötni az ihletet és a megvalósítást." },
    { n: 33, title: "33-as kifejezésszám (mestersz)", body: "Mester-tanító: feltétel nélküli szeretetből szolgálsz. Ritka szám — feladatod a saját szíved gyógyítása, mielőtt másokét gyógyítanád." },
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
    { n: 4, title: "4-es személyes év — Építkezés", body: "Kemény munka, alap, rend. Most a struktúrákat raksz le, amelyek hosszú távon tartanak. Egészségre, anyagi rendre különös figyelem." },
    { n: 5, title: "5-ös személyes év — Változás", body: "Mozgás, utazás, fordulat. Sok minden megváltozhat — költözés, munkahely, párkapcsolat. Maradj rugalmas, ne ragaszkodj a régihez túl szorosan." },
    { n: 6, title: "6-os személyes év — Felelősség és otthon", body: "Család, párkapcsolat, otthon kerül középpontba. Felelősséget vállalsz másokért — házasság, gyerek, költözés jellemző. Egyensúlyozz az adás és a kapás között." },
    { n: 7, title: "7-es személyes év — Befelé fordulás", body: "Csend, tanulás, spiritualitás. Külső eredmények lassulnak, de a belső munka most a legértékesebb. Pihenj, olvass, kutass — ne erőltess döntéseket." },
    { n: 8, title: "8-as személyes év — Beérés", body: "Anyagi és karrier-szempontból kiemelkedő év. Most jönnek az eredmények, amiket az 1-es évben elvetettél. Tedd kézbe a pénzügyeidet, vállalj felelősséget a hatalmadért." },
    { n: 9, title: "9-es személyes év — Lezárás", body: "Egy 9 éves ciklus zárul. Ami már nem szolgál, természetesen leválik — kapcsolatok, állások, szokások. Engedd el. A következő évben (1-es év) új ciklus indul." },
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
export function reduceNumber(n: number, keepMaster = true): number {
  while (n > 9) {
    if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
    n = String(n)
      .split("")
      .reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

export function lifePath(date: string): number {
  // date: YYYY-MM-DD
  const digits = date.replace(/\D/g, "").split("").map(Number);
  return reduceNumber(digits.reduce((a, b) => a + b, 0));
}

export function personalYear(date: string, year = new Date().getFullYear()): number {
  const [y, m, d] = date.split("-").map(Number);
  void y;
  const sum =
    String(m)
      .split("")
      .reduce((a, b) => a + Number(b), 0) +
    String(d)
      .split("")
      .reduce((a, b) => a + Number(b), 0) +
    String(year)
      .split("")
      .reduce((a, b) => a + Number(b), 0);
  return reduceNumber(sum);
}

export type LifePathInfo = {
  number: number;
  title: string;
  strengths: string;
  shadow: string;
  love: string;
  work: string;
  meaning: string;
  purpose?: string;
  advice?: string;
};

export const LIFE_PATHS: Record<number, LifePathInfo> = {
  1: {
    number: 1,
    title: "Az Úttörő",
    meaning:
      "Kezdeményező energia, önálló irány. Ott vagy a legjobb formádban, ahol nincs előtted kitaposott út.",
    strengths: "Bátorság, döntésképesség, függetlenség.",
    shadow: "Türelmetlenség, magány, makacsság.",
    love: "A szabadságodra szükséged van, de a társra is. A jó kapcsolat partneri, nem alávetett.",
    work: "Vezetői vagy alapítói szerepekben élsz igazán. Beosztottként hamar fulladsz.",
    purpose:
      "Megtanulni egyedül elindulni, anélkül hogy mások egyetértésére várnál — és közben nem elveszíteni a kapcsolódást.",
    advice: "Ne a legjobb tervet keresd, hanem az elsőt, ami a tiéd.",
  },
  2: {
    number: 2,
    title: "A Kapcsolódó",
    meaning: "Finom érzékelés, közvetítés, harmóniateremtés. Mások közt látsz tisztábban.",
    strengths: "Empátia, tapintat, együttműködés.",
    shadow: "Önfeladás, sértődékenység, döntésképtelenség.",
    love: "Mélyen kötődő típus. Vigyázz, ne tűnj el a másikban.",
    work: "Csapatban, közvetítő pozícióban virágzol — HR, tárgyalás, terápia, design.",
    purpose:
      "Megtanulni úgy adni, hogy közben magaddal is maradj — és úgy nemet mondani, hogy ne kelljen érte bocsánatot kérni.",
    advice: "A béke ára nem az, hogy te eltűnj.",
  },
  3: {
    number: 3,
    title: "A Kifejező",
    meaning: "Kreatív, szavakkal és formákkal dolgozó energia. Az életkedv a feladatod is.",
    strengths: "Kommunikáció, humor, inspiráció.",
    shadow: "Felszínesség, szétszórtság, halogatás.",
    love: "Élményekre vágysz, könnyű érzésekre. Vigyázz, ne menekülj a mélységtől.",
    work: "Alkotó, író, előadó, marketinges — bárhol, ahol a hangod is munkaeszköz.",
    purpose:
      "Megmutatni, ami benned van — és kibírni, hogy nem mindenki fogja érteni vagy szeretni.",
    advice: "Egy dolgot vigyél végig, mielőtt a következő ötletbe szerelmes leszel.",
  },
  4: {
    number: 4,
    title: "Az Építő",
    meaning:
      "Stabilitás, kitartás, hosszú távú építés. Hétköznapi szentség van abban, amit csinálsz.",
    strengths: "Megbízhatóság, struktúra, fegyelem.",
    shadow: "Merevség, túlterhelés, örömfelejtés.",
    love: "Hűséges, komoly. A nagy gesztusok helyett a következetesség a nyelved.",
    work: "Mérnök, jogász, kézműves, pénzügy — bárhol, ahol a részletek számítanak.",
    purpose: "Olyat építeni, ami másnak is otthon lehet — közben magadat se hagyni a falon kívül.",
    advice: "A pihenés is része a munkának, nem a gyengeség jele.",
  },
  5: {
    number: 5,
    title: "A Szabad",
    meaning: "Változás, tapasztalat, mozgás. Akkor élsz, ha új ingerek érnek.",
    strengths: "Alkalmazkodás, kíváncsiság, bátorság.",
    shadow: "Felelősségkerülés, függések, állhatatlanság.",
    love: "A monotonitás megöl. Olyan társ kell, aki nem akar megszelídíteni.",
    work: "Utazás, értékesítés, média, vállalkozás — szabadúszó lélek vagy.",
    purpose: "Megtanulni, hogy a szabadság nem a menekülés, hanem a választás képessége.",
    advice: "Egy dolgot vállalj most végig — abban lesz a szabadságod.",
  },
  6: {
    number: 6,
    title: "A Gondviselő",
    meaning: "Felelősség, otthon, szépség. Téged keresnek, ha valami megtartásra szorul.",
    strengths: "Szeretet, esztétika, gondoskodás.",
    shadow: "Beavatkozás, áldozatszerep, perfekcionizmus.",
    love: "Hosszú távra építesz. A családi élet központi téma.",
    work: "Tanítás, gyógyítás, design, vendéglátás — ahol valaki vagy valami szebb lesz általad.",
    purpose:
      "Megtanulni, hogy a szeretet nem kötelesség — és nem rajtad múlik, hogy mindenki rendben legyen.",
    advice: "Először magadnak adj abból, amit másnak adsz.",
  },
  7: {
    number: 7,
    title: "A Lelkek Kutatója",
    meaning:
      "Mélyen gondolkodó, elemző és spirituális lelkület. Küldetésed az igazság keresése és a belső tudás átadása.",
    strengths: "Intuíció, bölcsesség, belső tudás.",
    shadow: "Visszahúzódás, gyanakvás, túlanalízis.",
    love: "Mélységet keresel, nem zajt. Egyedüllét nélkül kifáradsz a kapcsolatban is.",
    work: "Kutatás, terápia, írás, tanácsadás — bárhol, ahol mélyre kell látni.",
    purpose: "A felszín mögé látni — és azt is megosztani, amit ott találsz.",
    advice: "Nem minden kérdésnek kell ma válasz. De ne menekülj a kérdés elől.",
  },
  8: {
    number: 8,
    title: "A Hatalom Kezelője",
    meaning:
      "Anyagi és szervezeti energiák gazdája. A pénz, a hatalom és a felelősség tanít téged.",
    strengths: "Stratégia, erő, eredményesség.",
    shadow: "Kontroll, kiégés, érzelmi keménység.",
    love: "Komoly kapcsolatokra vágysz. Vigyázz, ne menedzseld a társad.",
    work: "Vezetés, vállalkozás, pénzügy, ingatlan — ahol nagyban gondolkodhatsz.",
    purpose:
      "Megtanulni, hogy az erő nem ugyanaz, mint a kontroll — és a gyengéd nem ugyanaz, mint a gyenge.",
    advice: "Ne győzz le valakit, akit szeretsz. Az ár drágább, mint a győzelem.",
  },
  9: {
    number: 9,
    title: "A Bölcs",
    meaning:
      "Lezárások és tág horizontok embere. Számodra a sajátért gyakran kevésbé fontos, mint a közösért.",
    strengths: "Együttérzés, távlat, érettség.",
    shadow: "Áldozat, lemondás, melankólia.",
    love: "Mély, tartalmas kapcsolódást keresel. A felszín gyorsan elfáraszt.",
    work: "Civil szektor, művészet, tanítás, gyógyítás — ahol értelme van annak, amit teszel.",
    purpose: "Elengedni szépen, és a magadét sem felejteni el a sok közös közt.",
    advice: "A magadért való szeretet nem önzés. A te részed is hiányzik a világnak.",
  },
  11: {
    number: 11,
    title: "Az Intuitív Mester",
    meaning:
      "Magas érzékenység, megérzések és inspiráció. Mester-szám: nagy lehetőség és nagy nyomás.",
    strengths: "Látás, inspiráció, mély intuíció.",
    shadow: "Túlterhelés, szorongás, ön-leértékelés.",
    love: "Egy mély kapcsolatra van szükséged, nem sokra. A felszín fáj.",
    work: "Tanítás, coaching, művészet, spiritualitás — közvetítő szerepben.",
    purpose:
      "Hidat tartani két világ — a látható és az érzett — között, és nem összeroppanni a súly alatt.",
    advice: "Az, amit érzel, nem túlzás. De nem mindig kell rögtön kezdeni vele valamit.",
  },
  22: {
    number: 22,
    title: "A Mester Építő",
    meaning: "Nagy léptékű alkotás. Képes vagy olyat építeni, ami túléli a te kis történetedet.",
    strengths: "Vízió + kivitelezés egyszerre.",
    shadow: "Túlvállalás, kiégés, kontrollvágy.",
    love: "Stabil, hosszú távú partnerséget keresel, aki bírja a tempódat.",
    work: "Alapító, intézményépítő, nagy projektek vezetője.",
    purpose: "Olyat létrehozni, ami túléli a nevedet — és közben emberi maradni az úton.",
    advice: "Egy nagy víziót sok kicsi lépés visz végig. Ne ugord át a maiakat.",
  },
  33: {
    number: 33,
    title: "A Tanító Szív",
    meaning: "Szolgálat és gyengéd erő. A jelenléted gyógyít, akár tudsz róla, akár nem.",
    strengths: "Szeretet, felelősség, magasabb értelem.",
    shadow: "Mártírság, túlgondoskodás.",
    love: "Gyengéd, mély, gondoskodó. Vigyázz a határaidra.",
    work: "Hivatás-jellegű munka — tanítás, gyógyítás, közösségépítés.",
    purpose: "Szeretni úgy, hogy közben magadat is megtartod — ez a legmélyebb tanításod.",
    advice: "A te jólléted nem luxus. Nélküle a szereteted sem fenntartható.",
  },
};

export function lifePathInfo(n: number): LifePathInfo {
  return LIFE_PATHS[n] ?? LIFE_PATHS[7];
}

// Compatibility matrix (0-100). Symmetric.
const COMPAT: Record<string, number> = {
  "1-1": 70,
  "1-2": 75,
  "1-3": 85,
  "1-4": 60,
  "1-5": 80,
  "1-6": 65,
  "1-7": 60,
  "1-8": 70,
  "1-9": 75,
  "2-2": 80,
  "2-3": 70,
  "2-4": 85,
  "2-5": 60,
  "2-6": 90,
  "2-7": 75,
  "2-8": 70,
  "2-9": 80,
  "3-3": 75,
  "3-4": 55,
  "3-5": 85,
  "3-6": 80,
  "3-7": 60,
  "3-8": 65,
  "3-9": 85,
  "4-4": 80,
  "4-5": 50,
  "4-6": 80,
  "4-7": 75,
  "4-8": 90,
  "4-9": 65,
  "5-5": 70,
  "5-6": 60,
  "5-7": 75,
  "5-8": 65,
  "5-9": 80,
  "6-6": 85,
  "6-7": 70,
  "6-8": 75,
  "6-9": 90,
  "7-7": 85,
  "7-8": 60,
  "7-9": 80,
  "8-8": 75,
  "8-9": 65,
  "9-9": 85,
};

export function compatibilityScore(a: number, b: number): number {
  const aa = a > 9 ? reduceNumber(a, false) : a;
  const bb = b > 9 ? reduceNumber(b, false) : b;
  const k = aa <= bb ? `${aa}-${bb}` : `${bb}-${aa}`;
  return COMPAT[k] ?? 70;
}

export function relationshipNumber(a: number, b: number): number {
  return reduceNumber(a + b);
}

// --- Static, hand-written compatibility pair meanings ---
type Pair = { works: string; tension: string; advice: string };

const DEFAULT_PAIR: Pair = {
  works:
    "Ti ketten más-más ritmusban éltek, és pont ez tud benneteket táplálni — amíg egyik sem akarja a másikat a saját tempójához igazítani.",
  tension:
    'A baj akkor kezdődik, amikor azt hiszitek, ugyanazt értitek a „közös" alatt. Pedig két különböző értelmezés ül egy asztalnál.',
  advice: "Ne magyarázzátok el egymásnak, mit kellene érezni. Inkább kérdezzétek meg.",
};

const PAIR_TEXT: Record<string, Pair> = {
  "1-2": {
    works:
      "Az 1 viszi, a 2 érzi. Ha a 2 nem tűnik el a másik árnyékában, jó páros lehet — egyik döntésképes, másik kapcsolatkész.",
    tension:
      "A 2 sértődéseit az 1 nem fogja észrevenni. A néma sértődés viszont mindkettőjüket elszigeteli.",
    advice: "A 2 mondja ki, mire vágyik — az 1 hallani fogja, ha tisztán hangzik.",
  },
  "1-5": {
    works:
      "Két szabad ember. Ami másnál veszély, nálatok közös nyelv: a mozgás, a változás, a nem-megszelídülés.",
    tension: "Annyira félitek az unalmat, hogy közben a mélységet is elkerülitek.",
    advice: "Egyszer maradjatok ott, ahol nehéz. Az dönti el, mi van köztetek.",
  },
  "2-6": {
    works: "Az otthonteremtés és a finom érzékelés találkozása. Csendes, mély, tartós páros.",
    tension:
      "Mindketten könnyen elveszítitek magatokat a másikban. Két önfeladásból nem lesz kapcsolat.",
    advice: "Maradjon külön térfél is — nem ellenetek, hanem értetek.",
  },
  "3-5": {
    works: "Élet, kíváncsiság, könnyedség. Mellettetek vidám az élet, és ez nem felszín — energia.",
    tension:
      "Amikor jön a komoly, mindketten elsiklotok mellette. Halogatott beszélgetésekből lesznek a nagy szakítások.",
    advice: "Egy mondatot ne csomagoljatok viccbe a héten.",
  },
  "3-6": {
    works: "A 3 színt visz, a 6 keretet ad. Egy kreatív otthon, ahol van rend is és levegő is.",
    tension: "A 6 könnyen anyásít, a 3 könnyen kibújik a felelősség alól.",
    advice: "A 3 vállaljon egy konkrét, ismétlődő dolgot. A 6 ne vegye vissza tőle.",
  },
  "4-8": {
    works:
      "Két komoly ember. Stabil keretek, hosszú táv, közös építés. Egy olyan kapcsolat, ami tényleg meg tud állni.",
    tension: "A munka és a kontroll lassan megeszi a gyengédséget, ha nem figyeltek rá.",
    advice: "Egy estét hetente írjatok be a naptárba, ahol semmit nem szerveztek.",
  },
  "2-4": {
    works:
      "Egy finom és egy stabil ember. Itt nincs hangos szerelem, viszont van bizalom — és az a ritkább.",
    tension: "A 4 azt hiheti, a 2 nem akar dönteni. A 2 azt hiheti, a 4 nem érzi át, amit ő.",
    advice: "Mondjátok ki, amit éreztek, ne csak amit gondoltok.",
  },
  "5-9": {
    works:
      "Tág horizont, közös értelemkeresés. Ti nem azért vagytok együtt, mert kell, hanem mert akartok.",
    tension:
      "Mindketten könnyen elindultok befelé vagy kifelé — egyszerre. Olyankor nincs senki, aki tartson.",
    advice: "Legyen egy közös rituálé, ami akkor is megvan, ha épp nehéz.",
  },
  "6-9": {
    works: "Mély gondoskodás, érett szeretet. Ti tudtok valamit, amit a többiek csak utánoznak.",
    tension: "Mindketten azt hiszitek, a másik miatt vagytok így — pedig magatok döntöttetek így.",
    advice: 'Egy heti kérdés: „Mit szeretnék most magamnak?" Először magadnak válaszolj.',
  },
  "7-7": {
    works:
      "Két mély ember egy asztalnál. Csend nélkül kifáradtok — de csenddel együtt sokáig bírjátok.",
    tension: "Mindketten visszahúzódtok, ha sérültök. A távolság lassan magyarázattá válik.",
    advice: "Ne magyarázzatok semmit — kérdezzetek vissza egyet egymástól.",
  },
  "1-1": {
    works: "Két vezér. Ha tudtok ugyanabba az irányba menni, megállíthatatlanok vagytok.",
    tension:
      "Egy kapcsolat nem két monológ. Ha egyikőtök sem hajlandó kicsit hátralépni, kiég a páros.",
    advice: "Egy döntés a héten legyen olyan, ahol nem te vagy az első.",
  },
  "9-9": {
    works: "Mély, érett, jelentésteli kapcsolat. Két ember, aki tudja, mi a fontos.",
    tension: "Hajlamosak vagytok mindent megérteni — még azt is, amit nem kellene elviselni.",
    advice: 'Néha az „értem, miért csinálta" nem helyettesíti a „nem teszem zsebre".',
  },
};

export function compatPairMeaning(a: number, b: number): Pair {
  const aa = a > 9 ? reduceNumber(a, false) : a;
  const bb = b > 9 ? reduceNumber(b, false) : b;
  const k = aa <= bb ? `${aa}-${bb}` : `${bb}-${aa}`;
  return PAIR_TEXT[k] ?? DEFAULT_PAIR;
}

// 3-card synthesis from card keywords
export function threeCardSynthesis(past: string, present: string, future: string): string {
  return `Ami ${past}-ként indult, most ${present} formájában kér figyelmet, és ${future} felé hív. Nem három különálló dolog — egy ív, ami most rajtad keresztül folytatódik.`;
}

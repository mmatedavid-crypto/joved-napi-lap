export function reduceNumber(n: number, keepMaster = true): number {
  while (n > 9) {
    if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
    n = String(n).split("").reduce((a, b) => a + Number(b), 0);
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
  const sum = String(m).split("").reduce((a, b) => a + Number(b), 0)
    + String(d).split("").reduce((a, b) => a + Number(b), 0)
    + String(year).split("").reduce((a, b) => a + Number(b), 0);
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
};

export const LIFE_PATHS: Record<number, LifePathInfo> = {
  1: { number: 1, title: "Az Úttörő", meaning: "Kezdeményező energia, önálló irány. Ott vagy a legjobb formádban, ahol nincs előtted kitaposott út.",
    strengths: "Bátorság, döntésképesség, függetlenség.", shadow: "Türelmetlenség, magány, makacsság.",
    love: "A szabadságodra szükséged van, de a társra is. A jó kapcsolat partneri, nem alávetett.",
    work: "Vezetői vagy alapítói szerepekben élsz igazán. Beosztottként hamar fulladsz." },
  2: { number: 2, title: "A Kapcsolódó", meaning: "Finom érzékelés, közvetítés, harmóniateremtés. Mások közt látsz tisztábban.",
    strengths: "Empátia, tapintat, együttműködés.", shadow: "Önfeladás, sértődékenység, döntésképtelenség.",
    love: "Mélyen kötődő típus. Vigyázz, ne tűnj el a másikban.",
    work: "Csapatban, közvetítő pozícióban virágzol — HR, tárgyalás, terápia, design." },
  3: { number: 3, title: "A Kifejező", meaning: "Kreatív, szavakkal és formákkal dolgozó energia. Az életkedv a feladatod is.",
    strengths: "Kommunikáció, humor, inspiráció.", shadow: "Felszínesség, szétszórtság, halogatás.",
    love: "Élményekre vágysz, könnyű érzésekre. Vigyázz, ne menekülj a mélységtől.",
    work: "Alkotó, író, előadó, marketinges — bárhol, ahol a hangod is munkaeszköz." },
  4: { number: 4, title: "Az Építő", meaning: "Stabilitás, kitartás, hosszú távú építés. Hétköznapi szentség van abban, amit csinálsz.",
    strengths: "Megbízhatóság, struktúra, fegyelem.", shadow: "Merevség, túlterhelés, örömfelejtés.",
    love: "Hűséges, komoly. A nagy gesztusok helyett a következetesség a nyelved.",
    work: "Mérnök, jogász, kézműves, pénzügy — bárhol, ahol a részletek számítanak." },
  5: { number: 5, title: "A Szabad", meaning: "Változás, tapasztalat, mozgás. Akkor élsz, ha új ingerek érnek.",
    strengths: "Alkalmazkodás, kíváncsiság, bátorság.", shadow: "Felelősségkerülés, függések, állhatatlanság.",
    love: "A monotonitás megöl. Olyan társ kell, aki nem akar megszelídíteni.",
    work: "Utazás, értékesítés, média, vállalkozás — szabadúszó lélek vagy." },
  6: { number: 6, title: "A Gondviselő", meaning: "Felelősség, otthon, szépség. Téged keresnek, ha valami megtartásra szorul.",
    strengths: "Szeretet, esztétika, gondoskodás.", shadow: "Beavatkozás, áldozatszerep, perfekcionizmus.",
    love: "Hosszú távra építesz. A családi élet központi téma.",
    work: "Tanítás, gyógyítás, design, vendéglátás — ahol valaki vagy valami szebb lesz általad." },
  7: { number: 7, title: "A Lelkek Kutatója", meaning: "Mélyen gondolkodó, elemző és spirituális lelkület. Küldetésed az igazság keresése és a belső tudás átadása.",
    strengths: "Intuíció, bölcsesség, belső tudás.", shadow: "Visszahúzódás, gyanakvás, túlanalízis.",
    love: "Mélységet keresel, nem zajt. Egyedüllét nélkül kifáradsz a kapcsolatban is.",
    work: "Kutatás, terápia, írás, tanácsadás — bárhol, ahol mélyre kell látni." },
  8: { number: 8, title: "A Hatalom Kezelője", meaning: "Anyagi és szervezeti energiák gazdája. A pénz, a hatalom és a felelősség tanít téged.",
    strengths: "Stratégia, erő, eredményesség.", shadow: "Kontroll, kiégés, érzelmi keménység.",
    love: "Komoly kapcsolatokra vágysz. Vigyázz, ne menedzseld a társad.",
    work: "Vezetés, vállalkozás, pénzügy, ingatlan — ahol nagyban gondolkodhatsz." },
  9: { number: 9, title: "A Bölcs", meaning: "Lezárások és tág horizontok embere. Számodra a sajátért gyakran kevésbé fontos, mint a közösért.",
    strengths: "Együttérzés, távlat, érettség.", shadow: "Áldozat, lemondás, melankólia.",
    love: "Mély, tartalmas kapcsolódást keresel. A felszín gyorsan elfáraszt.",
    work: "Civil szektor, művészet, tanítás, gyógyítás — ahol értelme van annak, amit teszel." },
  11: { number: 11, title: "Az Intuitív Mester", meaning: "Magas érzékenység, megérzések és inspiráció. Mester-szám: nagy lehetőség és nagy nyomás.",
    strengths: "Látás, inspiráció, mély intuíció.", shadow: "Túlterhelés, szorongás, ön-leértékelés.",
    love: "Egy mély kapcsolatra van szükséged, nem sokra. A felszín fáj.",
    work: "Tanítás, coaching, művészet, spiritualitás — közvetítő szerepben." },
  22: { number: 22, title: "A Mester Építő", meaning: "Nagy léptékű alkotás. Képes vagy olyat építeni, ami túléli a te kis történetedet.",
    strengths: "Vízió + kivitelezés egyszerre.", shadow: "Túlvállalás, kiégés, kontrollvágy.",
    love: "Stabil, hosszú távú partnerséget keresel, aki bírja a tempódat.",
    work: "Alapító, intézményépítő, nagy projektek vezetője." },
  33: { number: 33, title: "A Tanító Szív", meaning: "Szolgálat és gyengéd erő. A jelenléted gyógyít, akár tudsz róla, akár nem.",
    strengths: "Szeretet, felelősség, magasabb értelem.", shadow: "Mártírság, túlgondoskodás.",
    love: "Gyengéd, mély, gondoskodó. Vigyázz a határaidra.",
    work: "Hivatás-jellegű munka — tanítás, gyógyítás, közösségépítés." },
};

export function lifePathInfo(n: number): LifePathInfo {
  return LIFE_PATHS[n] ?? LIFE_PATHS[7];
}

// Compatibility matrix (0-100). Symmetric.
const COMPAT: Record<string, number> = {
  "1-1": 70, "1-2": 75, "1-3": 85, "1-4": 60, "1-5": 80, "1-6": 65, "1-7": 60, "1-8": 70, "1-9": 75,
  "2-2": 80, "2-3": 70, "2-4": 85, "2-5": 60, "2-6": 90, "2-7": 75, "2-8": 70, "2-9": 80,
  "3-3": 75, "3-4": 55, "3-5": 85, "3-6": 80, "3-7": 60, "3-8": 65, "3-9": 85,
  "4-4": 80, "4-5": 50, "4-6": 80, "4-7": 75, "4-8": 90, "4-9": 65,
  "5-5": 70, "5-6": 60, "5-7": 75, "5-8": 65, "5-9": 80,
  "6-6": 85, "6-7": 70, "6-8": 75, "6-9": 90,
  "7-7": 85, "7-8": 60, "7-9": 80,
  "8-8": 75, "8-9": 65,
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
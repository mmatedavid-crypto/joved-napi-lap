// Local Hungarian copy for angel numbers, keyed by reduced root (1..9) plus
// master numbers (11, 22, 33). A confirmed root number may arrive from a
// symbolic calculation, but the displayed meaning always comes from this
// Hungarian tradition-aware text.

export type AngelMeaning = {
  title: string;
  message: string;
  love: string;
  decision: string;
  warn: string;
  oneLine: string;
};

export const ANGEL_HU: Record<number, AngelMeaning> = {
  1: {
    title: "Új kezdet",
    message: "Egy új ciklus nyílik. Amit most gondolsz, az formálja, ami jön.",
    love: "Ne ragaszkodj a régi mintához. A szíved most új vonalra áll.",
    decision: "Bátorság a kezdéshez — a részletek majd menet közben tisztulnak.",
    warn: "Ne magányból válassz.",
    oneLine: "Az első lépés a tiéd.",
  },
  2: {
    title: "Egyensúly",
    message: "A párhuzamok napja. Két dolog között keresd a középutat.",
    love: "Hallgatás és figyelem most többet épít, mint a szó.",
    decision: "Ne sürgesd. Egy nappal pontosabb lesz.",
    warn: "Ne legyél vakon megengedő.",
    oneLine: "A béke is döntés.",
  },
  3: {
    title: "Kifejeződés",
    message: "A hangod most fontos. Amit kimondasz, az alakul.",
    love: "Egy őszinte mondat ma sokat tisztít.",
    decision: "Ami kreatívnak tűnik, az most a jó út.",
    warn: "Ne szétaprózd magad túl sok felé.",
    oneLine: "Mondd ki, ami valóban van benned.",
  },
  4: {
    title: "Alap",
    message: "Stabilitás, építkezés, türelmes munka napja.",
    love: "Egy hétköznapi gesztus többet ér, mint egy nagy ígéret.",
    decision: "Csak abba vágj bele, aminek van valódi alapja.",
    warn: "Ne köss meg túl szorosan, ami szabadon is élni tudna.",
    oneLine: "Ami épül, az tart.",
  },
  5: {
    title: "Változás",
    message: "Mozgás, fordulat, új levegő. Most nem a kapaszkodás napja.",
    love: "Egy beszélgetés irányt vált — engedd, hogy így legyen.",
    decision: "Ami szűknek érződik, az most lecserélhető.",
    warn: "Ne dönts pánikból.",
    oneLine: "A változás nem veszteség.",
  },
  6: {
    title: "Gondoskodás",
    message: "Otthon, kapcsolatok, felelősség. A szíved most tudja, mire figyelj.",
    love: "Egy meleg gesztus most összeköt.",
    decision: "Vedd komolyan, ami a tiéid felé húz.",
    warn: "Ne csak másoknak adj — magadnak is.",
    oneLine: "Az otthon nem hely, hanem jelenlét.",
  },
  7: {
    title: "Befelé",
    message: "Mélységek napja. Egy belső igazságot most tisztábban hallasz.",
    love: "A csend ma többet mond, mint a magyarázat.",
    decision: "Ne dönts ma véglegesen — figyelj inkább.",
    warn: "Ne menekülj el a saját gondolataidtól.",
    oneLine: "Belül van a válasz.",
  },
  8: {
    title: "Erő",
    message: "Eredmények, vezetés, anyagi áramlás. Most látszik, amit építettél.",
    love: "Légy határozott, de ne keményebb a kelleténél.",
    decision: "Vállald, ami a tiéd — a felelősséget is.",
    warn: "Ne mérd magad csak a teljesítményen.",
    oneLine: "Az erő mértékletességgel működik.",
  },
  9: {
    title: "Lezárás",
    message: "Egy ciklus a végéhez ér. Ami már nem rólad szól, elengedhető.",
    love: "Egy régi seb most halkabban kérhet figyelmet, ha hagyod.",
    decision: "Ne kezdj újat, amíg a régit nem zártad.",
    warn: "Ne ragaszkodj abból dacból.",
    oneLine: "Engedd, hogy lezáruljon.",
  },
  11: {
    title: "Intuíció kapuja",
    message: "Mester szám. Egy belső hang most tisztábban szólhat hozzád.",
    love: "Egy érzés most több mint hangulat — komolyan veheted.",
    decision: "Ne kérj rajta tovább megerősítést, mint amennyit a tested ad.",
    warn: "Ne misztifikálj túl mindent.",
    oneLine: "Hallgass arra, amit először érzel.",
  },
  22: {
    title: "Építőmester",
    message: "Nagy ívű terv, hosszú távú építkezés. Most fundamentumot raksz.",
    love: "Egy közös jövőkép most testet ölthet.",
    decision: "Mérd fel reálisan — és vágj bele.",
    warn: "Ne ragadj a tervezésben.",
    oneLine: "Ami valódi, az fokról fokra épül.",
  },
  33: {
    title: "Tanító szív",
    message: "Mély gondoskodás és belső béke vezet most.",
    love: "A jelenléteddel többet adsz, mint amit szóban tudnál.",
    decision: "Az, ami másoknak is jót tesz, neked is jó.",
    warn: "Ne áldozd fel magadat túlzottan.",
    oneLine: "A szelíd erő is erő.",
  },
};

export function reduceAngel(num: string): number {
  if (!/^\d+$/.test(num)) return 0;
  // master numbers preserved
  const n = num.replace(/^0+/, "") || "0";
  if (n === "11" || n === "22" || n === "33") return Number(n);
  let s = n.split("").reduce((a, b) => a + Number(b), 0);
  while (s > 9 && s !== 11 && s !== 22 && s !== 33) {
    s = String(s)
      .split("")
      .reduce((a, b) => a + Number(b), 0);
  }
  return s;
}

export function angelMeaning(num: string, confirmedRoot?: number): AngelMeaning {
  const root = confirmedRoot && ANGEL_HU[confirmedRoot] ? confirmedRoot : reduceAngel(num);
  return ANGEL_HU[root] ?? ANGEL_HU[1];
}

// SEO-aloldalak a leggyakrabban keresett angyalszámokhoz (/angyalszam/111 stb.).
export type AngelNumberPage = {
  szam: string;
  intro: string;
  pattern: string;
};

export const ANGEL_NUMBER_PAGES: AngelNumberPage[] = [
  {
    szam: "000",
    intro:
      "A 000 a tiszta potenciál száma: a kör, amelynek nincs eleje és vége. Ha sokszor látod, az életed egy olyan pontján állsz, ahol bármi újraindítható — a lap üres, és te írhatsz rá.",
    pattern:
      "A megháromszorozott nulla a számszimbolikai hagyományban a nyitott lehetőséget és a körszerű lezárás-újrakezdés mintáját jelképezi. Nem nagy fordulatot ígér, inkább arra hívhatja fel a figyelmed, hol érdemes tiszta lapot nyitni.",
  },
  {
    szam: "111",
    intro:
      "A 111 az egyik legismertebb angyalszám: a kapunyitás, a fókusz és az új kezdet jelképe. Ha gyakran látod, a hagyomány szerint érdemes tudatosan figyelni, mire irányítod a gondolataidat.",
    pattern:
      "A megháromszorozott 1-es az új kezdet és a szándék rendezésének témáját emeli ki. Nem ígéretként, inkább önismereti jelként segíthet észrevenni, hol kér több figyelmet az első lépés.",
  },
  {
    szam: "222",
    intro:
      "A 222 az egyensúly, a türelem és a partnerség száma. Ha újra és újra felbukkan, arra hívhatja fel a figyelmed, hogy most nem a kapkodás, hanem az arányérzék visz közelebb.",
    pattern: "A megháromszorozott 2-es az együttműködést és a bizalmat hangsúlyozza. Gyakran kapcsolati kérdések idején jelenik meg.",
  },
  {
    szam: "333",
    intro:
      "A 333 a kifejeződés és a kreatív figyelem száma. Nem azt jelzi, hogy másoknak utat kell mutatnod, inkább arra terelheti a figyelmed, hogy a kimondott, megírt vagy megalkotott forma most tisztábban szólhat hozzád.",
    pattern:
      "A megháromszorozott 3-as a kommunikáció és önkifejezés témáit emeli ki. Egyes hagyományok tanítói jelképrendszerekhez kötik, de itt nem külső üzenetként, hanem önismereti figyelmeztető jelként érdemes olvasni.",
  },
  {
    szam: "444",
    intro:
      "A 444 a védelem és a stabil alapok száma. Ha gyakran látod, a hagyomány szerint a rend, a kitartás és a belső támasz keresésére terelheti a figyelmed.",
    pattern: "A megháromszorozott 4-es a rendet, a kitartást és a támogató jelenlétet erősíti. Sokan nehéz időszakban találkoznak vele.",
  },
  {
    szam: "555",
    intro:
      "Az 555 a nagy változás száma. Ha mindenhol ezt látod, arra hívhatja fel a figyelmed, hogy valami régi forma lazul, és több tér kellene az új mozgásnak.",
    pattern:
      "A megháromszorozott 5-ös a fordulat, mozgástér és rugalmas alkalmazkodás témáit emeli ki. Nem költözést vagy új életszakaszt jósol, inkább azt mutatja, hol lazulhat egy régi forma.",
  },
  {
    szam: "666",
    intro:
      "A 666 nem baljós szám: az egyensúly helyreállítására hív. Azt jelzi, hogy a figyelmed túlságosan az anyagi gondok felé billent — ideje visszatalálni a belső középpontodhoz.",
    pattern: "A megháromszorozott 6-os az otthon, a gondoskodás és az anyagi-lelki egyensúly témáit emeli ki.",
  },
  {
    szam: "777",
    intro:
      "A 777 a hagyományos számszimbolikában a belső elmélyülés és a csendesebb iránykeresés jele lehet. Ha sokszor látod, érdemes lehet több teret adni annak, ami benned már tisztábban formálódik.",
    pattern:
      "A megháromszorozott 7-es a befelé figyelés, tanulás és önismereti ritmus témáit emeli ki. Nem különleges spirituális állapotot jelez, inkább azt, hogy a csend most tisztább figyelmet adhat.",
  },
  {
    szam: "888",
    intro:
      "A 888 a számszimbolikában az eredmény, méltányosság és kiegyenlítődés témáihoz kapcsolódik. Gyakori felbukkanása arra utalhat, hogy érdemes észrevenned, hol kap formát a befektetett figyelmed és munkád.",
    pattern:
      "A megháromszorozott 8-as az erő, felelősség és következmény témáit emeli ki. Nem anyagi ígéretként, inkább önismereti jelként érdemes olvasni.",
  },
  {
    szam: "999",
    intro:
      "A 999 a lezárás száma. Egy nagy ciklus ér véget az életedben — és a szám arra biztat, hogy méltósággal engedd el, ami már nem rólad szól, mert csak így nyílhat tér az újnak.",
    pattern: "A megháromszorozott 9-es a befejezést és a tanulságok összegzését erősíti. Gyakran búcsúk és nagy döntések idején tűnik fel.",
  },
  {
    szam: "1010",
    intro:
      "Az 1010 az új szintre lépés száma. Az 1-es kezdete és a 0 végtelen lehetősége váltakozik benne: az életed most spirálszerűen ugyanoda ér vissza — de már magasabb szinten.",
    pattern: "Az 1-0 ismétlődése a fejlődési fokozatokat jelzi: minden kör egy érettebb újrakezdés.",
  },
  {
    szam: "1111",
    intro:
      "Az 1111 az ébredés kapuja — a legtöbbet keresett angyalszám. Ha az órán, számlán, rendszámon újra és újra ezt látod, önismereti jelként arra terelheti a figyelmed, milyen gondolatot erősítesz magadban.",
    pattern: "A négyszeres 1-es a kezdés, a fókusz és az éberség jele. Sokan fordulópontok idején veszik észre sorozatosan.",
  },
  {
    szam: "1212",
    intro:
      "Az 1212 a harmonikus növekedés száma. Az 1-es kezdeményezése és a 2-es együttműködése váltja egymást benne: lépj, de ne egyedül — most a közös építkezés visz előre.",
    pattern: "Az 1-2 ritmusa az egyéni akarat és a társas egyensúly összehangolását jelzi.",
  },
  {
    szam: "1221",
    intro:
      "Az 1221 tükörszám: ugyanaz az energia néz vissza rád mindkét irányból. Üzenete a bizalom — amit kifelé adsz, az tükröződik vissza, ezért most a saját hozzáállásod a kulcs.",
    pattern: "A tükörszerkezet az ok-okozat finom játékára hívja fel a figyelmet: a változás belül kezdődik.",
  },
  {
    szam: "1234",
    intro:
      "Az 1234 a lépcsőzetes haladás száma. Nem ugrást kér, hanem következetes, egymásra épülő lépéseket, hogy könnyebben észrevedd, melyik mozdulat készítheti elő a következőt.",
    pattern: "Az emelkedő számsor a természetes fejlődést jelzi: minden lépés a következőt készíti elő.",
  },
  {
    szam: "2222",
    intro:
      "A 2222 a béke, türelem és hosszabb távú építkezés száma. Ha sokszor látod, önismereti jelként arra terelheti a figyelmed, hogy a csendes gondozás nem feltétlen tétlenség.",
    pattern:
      "A négyszeres 2-es a kapcsolódás, arányérzék és közösen épített tervek témáit emeli ki. Nem tartós eredményt ígér, inkább a lassabb, következetesebb ritmust támogatja.",
  },
];

export function findAngelNumberPage(szam: string): AngelNumberPage | undefined {
  return ANGEL_NUMBER_PAGES.find((p) => p.szam === szam);
}

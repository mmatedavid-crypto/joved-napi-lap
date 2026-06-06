// Lightweight Hungarian I-Ching narrative. We use the hexagram number from
// Roxy and render Jövőd's own short text — never the English raw.

export type HexHU = {
  name: string; // hungarian short title
  show: string;
  warn: string;
  move: string;
  oneLine: string;
};

const GENERIC: HexHU = {
  name: "Útmutató jel",
  show: "A helyzet most lassabb tempót, csendes figyelmet kér.",
  warn: "Ne hozz végleges döntést, amíg nem ülepedett le benned.",
  move: "Tegyél egy apró, de őszinte lépést a javasolt irányba.",
  oneLine: "Lassan, de tisztán.",
};

// Minimal map of well-known hexagrams. Anything else uses the generic frame
// with a unique Hungarian name + the hex number.
export const IC_HU: Record<number, HexHU> = {
  1: {
    name: "Az alkotó",
    show: "Tiszta, kezdeményező energia van veled.",
    warn: "Ne lobbanj fel hirtelen erőből.",
    move: "Indítsd el, ami régóta benned van.",
    oneLine: "A kezdet az erőd.",
  },
  2: {
    name: "A befogadó",
    show: "Most a hallgatás és a befogadás napja.",
    warn: "Ne kényszerítsd a kibontakozást.",
    move: "Engedd, hogy jöjjön hozzád, ami a tiéd.",
    oneLine: "A csend is válasz.",
  },
  3: {
    name: "Kezdeti nehézség",
    show: "Egy új dolog nehezen indul — természetes.",
    warn: "Ne add fel az első akadálynál.",
    move: "Egy kis lépés most többet ér a nagy ívnél.",
    oneLine: "A gyökerek lassan erednek.",
  },
  4: {
    name: "Ifjú balgaság",
    show: "Még tanulsz a helyzetben — ez nem hiba.",
    warn: "Ne tegyél úgy, mintha már tudnád.",
    move: "Kérdezz, és figyelj őszintén.",
    oneLine: "A tanulás is bölcsesség.",
  },
  5: {
    name: "Várakozás",
    show: "Most az idő dolgozik érted.",
    warn: "Ne erőltesd a megoldást.",
    move: "Készülj fel arra, ami közeleg.",
    oneLine: "A várakozás is cselekvés.",
  },
  6: {
    name: "A viszály",
    show: "Egy konfliktus érlelődik — érdemes átgondolni.",
    warn: "Ne kezdj harcot, amit nem tudsz lezárni.",
    move: "Inkább lépj hátra, és nézz rá felülről.",
    oneLine: "Nem minden harcot kell megvívni.",
  },
  7: {
    name: "A sereg",
    show: "Most fegyelem és belső rend kell.",
    warn: "Ne legyél keményebb, mint amennyi szükséges.",
    move: "Vezesd magad nyugodt eltökéltséggel.",
    oneLine: "A rend belső erő.",
  },
  11: {
    name: "Béke",
    show: "Áramló, harmonikus időszak.",
    warn: "Ne vedd magától értetődőnek.",
    move: "Ápold, ami most jól működik.",
    oneLine: "A béke gondozandó.",
  },
  12: {
    name: "Pangás",
    show: "Egy időszak akadozik — természetes szünet.",
    warn: "Ne erőltess, ami most nem mozdul.",
    move: "Húzódj vissza, és tartsd magadat.",
    oneLine: "A szünet is része az útnak.",
  },
  24: {
    name: "Visszatérés",
    show: "Valami régi, jó dolog visszatér.",
    warn: "Ne ragadj a múltba — vidd magaddal a tanulást.",
    move: "Indítsd újra, ami fontos volt neked.",
    oneLine: "A kezdet újra a kezdet.",
  },
  29: {
    name: "A mély",
    show: "Mély víz: érzékeny, komoly időszak.",
    warn: "Ne add át magad a sodrásnak.",
    move: "Tarts irányt, és bízz a saját ritmusodban.",
    oneLine: "A mély is átúszható.",
  },
  30: {
    name: "A ragaszkodó",
    show: "Fényes, tisztánlátó periódus.",
    warn: "Ne ragadj egyetlen szemszögbe.",
    move: "Hagyd, hogy a tisztaság vezessen.",
    oneLine: "A fény mértéket kér.",
  },
  42: {
    name: "Gyarapodás",
    show: "Egy minőség most növekszik benned.",
    warn: "Ne legyél túlságosan szétszórt.",
    move: "Tedd láthatóvá, amit építesz.",
    oneLine: "Növekedj nyugodtan.",
  },
  48: {
    name: "A kút",
    show: "A belső forrásod most elérhető.",
    warn: "Ne hagyd, hogy eltömítse a sok zaj.",
    move: "Tisztítsd meg, amit régóta halogatsz.",
    oneLine: "A forrás mindig adott.",
  },
  52: {
    name: "A hegy",
    show: "Csend, mozdulatlanság, befelé fordulás.",
    warn: "Ne keverd össze a megállást a megrekedéssel.",
    move: "Ülj le egy gondolatban, és nézz rá.",
    oneLine: "A mozdulatlanság is irány.",
  },
  61: {
    name: "Belső igazság",
    show: "A megérzéseid most pontosak.",
    warn: "Ne magyarázd túl őket.",
    move: "Cselekedj abból, amit valóban érzel.",
    oneLine: "A belső hang ma tiszta.",
  },
  63: {
    name: "Beteljesedés után",
    show: "Egy szakasz lezárult — most jön a karbantartás.",
    warn: "Ne kezdj újat, amíg nem rendezted a meglévőt.",
    move: "Ápold, amit elértél.",
    oneLine: "A vég is gondozandó.",
  },
  64: {
    name: "Beteljesedés előtt",
    show: "Majdnem ott vagy — de még nem.",
    warn: "Ne lazíts el korán.",
    move: "Tedd meg az utolsó pontos lépéseket.",
    oneLine: "A célnál finomságra van szükség.",
  },
};

export function hexHU(num?: number): { name: string; m: HexHU } {
  if (!num) return { name: GENERIC.name, m: GENERIC };
  const m = IC_HU[num];
  if (m) return { name: m.name, m };
  return { name: `${num}. jel`, m: { ...GENERIC, name: `${num}. jel` } };
}

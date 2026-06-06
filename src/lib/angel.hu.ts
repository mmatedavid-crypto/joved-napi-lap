// Local Hungarian copy for angel numbers, keyed by reduced root (1..9) plus
// master numbers (11, 22, 33). Roxy lookup is used only to confirm the
// root number — we never display Roxy English narrative.

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
    love: "Egy régi seb most begyógyulhat, ha hagyod.",
    decision: "Ne kezdj újat, amíg a régit nem zártad.",
    warn: "Ne ragaszkodj abból dacból.",
    oneLine: "Engedd, hogy lezáruljon.",
  },
  11: {
    title: "Intuíció kapuja",
    message: "Mester szám. Egy belső hang most pontosan szól hozzád.",
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
    s = String(s).split("").reduce((a, b) => a + Number(b), 0);
  }
  return s;
}

export function angelMeaning(num: string, rootFromRoxy?: number): AngelMeaning {
  const root = rootFromRoxy && ANGEL_HU[rootFromRoxy] ? rootFromRoxy : reduceAngel(num);
  return ANGEL_HU[root] ?? ANGEL_HU[1];
}
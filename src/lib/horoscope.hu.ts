// Local Hungarian fallback + enrichment templates for daily horoscope.
// We never show raw Roxy English. Roxy values (energyRating, luckyNumber,
// luckyColor, moonPhase) only influence the wording via small phrase maps.

import { SIGN_HU } from "./roxyNormalize";

type Sign = keyof typeof SIGN_HU;

type HoroBlock = {
  mood: string;
  love: string;
  work: string;
  warn: string;
  oneLine: string;
};

const TABLE: Record<Sign, HoroBlock> = {
  aries: {
    mood: "Lendülettel indul a nap, de a tempót te szabd, ne a környezet.",
    love: "Egy őszinte mondat többet ér, mint egy nagy gesztus.",
    work: "Egy döntés érlelődik benned — még ma kimondhatod.",
    warn: "Ne harapj rá az első ingerre, amit provokációnak érzel.",
    oneLine: "A bátorság ma a türelemben van.",
  },
  taurus: {
    mood: "Csendes, befelé forduló nap, ahol minden lassabb ízű.",
    love: "Jelenléttel mondj el ma többet, mint szavakkal.",
    work: "Egy halogatott feladat ma váratlanul könnyen megy.",
    warn: "Ne ragaszkodj ahhoz, ami már nem épít.",
    oneLine: "A nyugalom most a te erőd.",
  },
  gemini: {
    mood: "Sok inger, sok ötlet — válassz egyet, és vidd végig.",
    love: "Egy beszélgetés ma váratlan közelséget hoz.",
    work: "Ma jobban szól a hangod, ha rövid mondatokat választasz.",
    warn: "Ne szétaprózd magad, mert estére semmiből nem érzel kerek dolgot.",
    oneLine: "Egy ötlet, egy lépés, egy nap.",
  },
  cancer: {
    mood: "Érzékenyebb vagy, mint mutatod — ez nem gyengeség, hanem információ.",
    love: "A közelséged most több biztonságot ad, mint bármely magyarázat.",
    work: "Hallgass arra, amit az első benyomásod súgott.",
    warn: "Ne vedd magadra azt, ami nem a tiéd.",
    oneLine: "Otthon van benned, vidd magaddal.",
  },
  leo: {
    mood: "Természetes ragyogás — nem kell erőltetni, hogy lássanak.",
    love: "Egy meleg gesztus most többet ér, mint egy nagy vallomás.",
    work: "Ma érdemes elöl állni, de meghallgatni is.",
    warn: "Ne keverd össze a büszkeséget a megsértődéssel.",
    oneLine: "A fény belülről jön ma.",
  },
  virgo: {
    mood: "Tiszta fej, jó ítélőképesség — egy régi rendetlenséget most fel tudsz oldani.",
    love: "Egy apró figyelmesség hosszan elkíséri a másikat.",
    work: "Ami ma rendbe kerül, az hetekre megnyugtat.",
    warn: "Ne legyél keményebb magadhoz, mint amit egy baráthoz megengednél.",
    oneLine: "A részletek ma neked dolgoznak.",
  },
  libra: {
    mood: "Békés hangulat, jó egyensúly, finom döntések napja.",
    love: "Ma egy egyszerű igen vagy nem többet old, mint a magyarázat.",
    work: "Egy közös ügyben te tudod kimondani a középutat.",
    warn: "Ne halaszd el a döntést csak azért, mert nem mindenkinek tetszik majd.",
    oneLine: "A harmónia néha határvonal.",
  },
  scorpio: {
    mood: "Mély, kicsit visszafogott nap — érdemes inkább figyelni, mint beszélni.",
    love: "Egy hallgatás ma többet árul el, mint a szavak.",
    work: "Ha mélyre ásol egy témában, ma megtalálod a kulcsot.",
    warn: "Ne tedd próbára azt, akiben már megbízhatsz.",
    oneLine: "Amit megérzel, az most pontos.",
  },
  sagittarius: {
    mood: "Tág horizont, távoli tervek — egy ötlet ma elindít valamit.",
    love: "Ma egy közös cél többet hoz közelségben, mint egy randi.",
    work: "Egy nagyobb ívű döntésre most rálátsz felülről is.",
    warn: "Ne ígérj többet, mint amit holnap is vállalni tudsz.",
    oneLine: "Az út most fontosabb, mint a cél.",
  },
  capricorn: {
    mood: "Komoly, fegyelmezett nap — most halad az, ami lassan épül.",
    love: "Egy állhatatos gesztus ma többet jelent, mint egy ünnep.",
    work: "Egy régi terved most konkrétummá tud válni.",
    warn: "Ne mérd a napodat csak a teljesítményed alapján.",
    oneLine: "Ami épül, az tart.",
  },
  aquarius: {
    mood: "Friss látásmód, váratlan kapcsolódások — egy beszélgetés inspirál.",
    love: "Ma a szabadság és a közelség nem kizárja egymást.",
    work: "Egy szokatlan ötleted most kiállja a próbát.",
    warn: "Ne legyél olyan távolságtartó, hogy ne lehessen elérni.",
    oneLine: "A te utadat csak te ismered.",
  },
  pisces: {
    mood: "Álmodozó, finom nap — érdemes figyelni a megérzéseidre.",
    love: "Egy halk gesztus ma mélyebbre megy, mint egy hangos.",
    work: "Egy alkotó vagy gondozó feladatban ma különösen jó vagy.",
    warn: "Ne menekülj el attól, amit egyszerűen ki kellene mondani.",
    oneLine: "Az intuíciód ma iránytű.",
  },
};

export function localHoroscope(sign: string): HoroBlock {
  return TABLE[sign as Sign] ?? TABLE.aries;
}

const LUCKY_COLOR_HU: Record<string, string> = {
  red: "vörös",
  crimson: "bíbor",
  pink: "rózsaszín",
  orange: "narancs",
  yellow: "sárga",
  gold: "arany",
  green: "zöld",
  emerald: "smaragdzöld",
  blue: "kék",
  navy: "tengerkék",
  indigo: "indigó",
  purple: "lila",
  violet: "ibolya",
  white: "fehér",
  silver: "ezüst",
  black: "fekete",
  brown: "barna",
  grey: "szürke",
  gray: "szürke",
  turquoise: "türkiz",
};

export function luckyColorHU(c?: string): string | null {
  if (!c) return null;
  return LUCKY_COLOR_HU[c.toLowerCase().trim()] ?? null;
}

export function energyPhraseHU(rating?: number): string | null {
  if (rating == null) return null;
  if (rating >= 8) return "magas energia";
  if (rating >= 5) return "kiegyensúlyozott energia";
  if (rating >= 3) return "halkabb nap";
  return "befelé forduló nap";
}

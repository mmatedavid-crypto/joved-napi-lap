export type TarotCard = {
  id: string;
  name: string;
  keywords: string[];
  general: string;
  love: string;
  decision: string;
  warning: string;
  daily: string;
};

export const CARDS: TarotCard[] = [
  { id: "bolond", name: "A Bolond", keywords: ["új kezdet", "bizalom", "ugrás"],
    general: "Egy új szakasz küszöbén állsz. A lap arra hívhatja fel a figyelmed, hogy ne a régi térképpel próbálj új tájon eligazodni.",
    love: "Friss érzés, ami még formátlan. Érdemes lehet nem azonnal beskatulyázni, hanem hagyni, hogy megmutassa magát.",
    decision: "A logika most kevesebbet mond, mint a megérzés. Ha túl régóta mérlegelsz, valószínűleg már tudod a választ.",
    warning: "Ne keverd össze a könnyedséget a felelőtlenséggel. Egy ugrás akkor szabad, ha tudod, mit hagysz hátra.",
    daily: "Ma engedj egy kicsi kockázatot, ami felé régóta húz valami benned." },
  { id: "mago", name: "A Mágus", keywords: ["szándék", "eszközök", "fókusz"],
    general: "Most minden kéznél van, amire szükséged van. A kérdés inkább az, mire irányítod a figyelmed.",
    love: "Tudatos jelenlét. Az, ahogy megszólítasz valakit, most többet számít, mint amit mondasz.",
    decision: "A döntés nem új információra vár, hanem arra, hogy felvállald, amit már látsz.",
    warning: "A szavak ereje most kétélű. Amit kimondasz, az könnyen valósággá válik.",
    daily: "Egyetlen tiszta szándék ma többet ér, mint öt párhuzamos terv." },
  { id: "fopapno", name: "A Főpapnő", keywords: ["belső tudás", "csend", "intuíció"],
    general: "Van egy válasz, ami már megszületett benned, csak még nem mondtad ki magadnak teljesen.",
    love: "Amit nem mondanak ki, az most fontosabb, mint amit igen. Figyelj a csendre a sorok között.",
    decision: "Ne siettesd a választ. A lap most inkább kivárást jelez, nem lezárást.",
    warning: "A racionalizálás ezúttal el fog vinni a lényegtől.",
    daily: "Ma keress tíz perc csendet — abban van valami, amit a zaj eltakart." },
  { id: "csaszarno", name: "A Császárnő", keywords: ["bőség", "gondoskodás", "teremtés"],
    general: "Valami most érik benned vagy körülötted. Nem kell siettetni, csak helyet adni neki.",
    love: "Lágyság és valódi figyelem. Egy kapcsolat ettől válik élővé, nem a nagy gesztusoktól.",
    decision: "Az a választás jó most, ami táplál téged is, nem csak másokat.",
    warning: "A túlzott gondoskodás könnyen elnyomássá válhat. Magadnak is hagyj teret.",
    daily: "Ma egy apró dolgot tegyél magadért, ami nem teljesítmény." },
  { id: "csaszar", name: "A Császár", keywords: ["struktúra", "határ", "felelősség"],
    general: "Itt az ideje rendet tenni valamiben, amit eddig hagytál elsodródni.",
    love: "Tisztább keretek. Egy kapcsolat akkor tud mélyülni, ha mindketten tudjátok, hol vannak a határok.",
    decision: "A lap arra utalhat, hogy most a stabilabb, kevésbé látványos út a jó.",
    warning: "A kontroll nem mindenható. Ne tévedj össze a vezetést a kényszerítéssel.",
    daily: "Egy határt húzz meg ma, amit régóta halogatsz." },
  { id: "fopap", name: "A Főpap", keywords: ["hagyomány", "tanítás", "értékek"],
    general: "Olyan kérdés érint, ami a saját értékeidhez nyúl hozzá.",
    love: "Az elköteleződés súlya kerül elő. Nem szükségszerűen házasság — inkább az, hogy mit veszel komolyan.",
    decision: "Ha most kétségek között vagy, nézd meg, melyik út az, amit később is vállalni tudsz.",
    warning: "Ne a mások elvárásaiból dönts, de a saját értékeidből igen.",
    daily: "Egy mondatban fogalmazd meg, mi az, ami nem alku tárgya nálad." },
  { id: "szeretok", name: "A Szeretők", keywords: ["választás", "értékrend", "kapcsolódás"],
    general: "Egy választás előtt állsz, ahol nem két dolog, hanem két önmagad között döntesz.",
    love: "Valódi találkozás esélye. De csak akkor, ha mered megmutatni magad olyannak, amilyen vagy.",
    decision: "A szíved és a fejed most ugyanazt mondja, csak más nyelven. Hallgasd meg mindkettőt.",
    warning: "A kompromisszum nem ugyanaz, mint az önfeladás.",
    daily: "Ma figyelj arra, kivel vagy igazán önmagad — és kivel játszol szerepet." },
  { id: "diadalszeker", name: "A Diadalszekér", keywords: ["lendület", "akarat", "irány"],
    general: "Az erőd most összpontosul. Egy irányba indulj, ne ötbe egyszerre.",
    love: "Bátor lépés ideje, ha eddig csak vártál. De a tempót te szabd, ne a másik bizonytalansága.",
    decision: "Ha most döntesz, döntsd el teljesen — a félig megtett lépés most többet árt, mint a kivárás.",
    warning: "A lendületet ne tévezd össze a meneküléssel.",
    daily: "Egy dolgot vigyél ma végig, ne hármat félig." },
  { id: "ero", name: "Az Erő", keywords: ["szelíd erő", "türelem", "önuralom"],
    general: "Nem a hangerő, hanem a kitartás dönti el most. Egy nehéz érzéssel szelíden, de őszintén ülj le.",
    love: "A szenvedély most akkor él, ha nem akarod erőltetni vagy elnyomni.",
    decision: "A jó válasz nem a leggyorsabb. Adj magadnak még egy lélegzetet.",
    warning: "A düh érthető, de nem most a tanácsadód.",
    daily: "Ma legyél kedves magaddal abban, amiben máskor szigorú vagy." },
  { id: "remete", name: "A Remete", keywords: ["visszavonulás", "belső fény", "kérdés"],
    general: "Egy kicsit kifelé indultál a saját életedből. Most ideje visszafordulni befelé.",
    love: "A magány nem büntetés most, hanem visszatérés ahhoz, aki vagy. Egy kapcsolat ettől lehet később őszintébb.",
    decision: "Mielőtt másoktól kérdezel, ülj le a saját válaszoddal.",
    warning: "A visszahúzódás akkor jó, ha választás — nem akkor, ha menekülés.",
    daily: "Egy fél óra ma legyen csak a tiéd, telefon nélkül." },
  { id: "kerek", name: "A Szerencsekerék", keywords: ["fordulat", "ciklus", "időzítés"],
    general: "Valami most magától mozdul, amit eddig erőltettél. Engedd.",
    love: "Egy régi minta lezárulhat, ha hagyod. Nem te erőlteted, az idő hozza.",
    decision: "A körülmények változnak — érdemes lehet pár napot várni a végleges szóval.",
    warning: "A szerencse nem jellem. Ne a hullámra építsd a hosszú távot.",
    daily: "Ma figyeld, mi az, ami magától oldódik, ha nem szólsz bele." },
  { id: "igazsag", name: "Az Igazság", keywords: ["egyensúly", "felelősség", "tisztánlátás"],
    general: "Egy helyzet most a saját mérlegére tesz. Az őszinteség most ár, de befektetés is.",
    love: "Egy ki nem mondott dolog most kérdez vissza. Érdemes lehet nevén nevezni.",
    decision: "Nem érzelmi, hanem tényszerű döntés ideje. Nézd meg, mi van a papíron.",
    warning: "A saját részedet ne hárítsd át a másikra.",
    daily: "Egy dolgot vállalj fel ma magadnak, amit eddig elkentél." },
  { id: "akasztott", name: "Az Akasztott", keywords: ["nézőpont", "felfüggesztés", "engedés"],
    general: "Most nem a cselekvés visz előre, hanem az, hogy elengeded, ami nem mozdul.",
    love: "Egy ideig nem lesz tiszta a helyzet. Ne döntsd el korábban, mint kell.",
    decision: "Ha mindenhonnan zsákutca, lehet, hogy nem a válasz, hanem a kérdés rossz.",
    warning: "A várakozás nem ugyanaz, mint a beletörődés.",
    daily: "Ma fordítsd meg fejben az egyik kérdésedet — és kérdezd újra." },
  { id: "halal", name: "A Halál", keywords: ["lezárás", "átalakulás", "új forma"],
    general: "Valami véget ér, hogy más kezdődhessen. Nem szó szerinti veszteségről beszél a lap.",
    love: "Egy régi forma már nem tud tovább élni. A kérdés inkább az, mit engedsz a helyére.",
    decision: "Az a választás jó most, ami enged elhagyni valamit, ami már nem te vagy.",
    warning: "Ne tartsd életben, ami már nem él. Az a fárasztóbb, mint a búcsú.",
    daily: "Ma kérdezd meg: mi az, amit régóta cipelek puszta szokásból?" },
  { id: "mertekletesseg", name: "A Mértékletesség", keywords: ["egyensúly", "türelem", "keverék"],
    general: "Egy köztes állapot, ami nem hiba, hanem érlelődés. Most a fokozatos lépés visz tovább.",
    love: "Két különböző tempó találkozik. A jó ritmus most összehangolódás kérdése, nem kompromisszumé.",
    decision: "A szélsőséges válasz most téves. A finomhangolás a helyes út.",
    warning: "A túl sok mindenből egyszerre kioltja egymást.",
    daily: "Ma egy dolgot csinálj kicsit lassabban, mint szoktad." },
  { id: "ordog", name: "Az Ördög", keywords: ["függés", "árny", "őszinteség"],
    general: "Egy minta most láthatóvá válik. Nem ítélet, hanem lehetőség kilépni belőle.",
    love: "Egy vonzás, ami erős, de nem feltétlenül jó. Érdemes lehet megnézni, mit etet benned.",
    decision: "Ha a választásod a félelmedből születik, valószínűleg nem szabadon választasz.",
    warning: "Ne romantizáld azt, ami fáj.",
    daily: "Ma nevezd meg magadnak egy szokásodat, ami nem szolgál már." },
  { id: "torony", name: "A Torony", keywords: ["váratlan", "összeomlás", "tisztulás"],
    general: "Valami most leesik, ami eddig csak látszott stabilnak. Nem rombolás — leleplezés.",
    love: "Egy illúzió helyére őszintébb valóság léphet, ha bírod a kíméletlenebb fényt.",
    decision: "A régi terv összedől. Ne ragaszkodj hozzá makacsságból.",
    warning: "Most ne hozz nagy, visszafordíthatatlan döntést érzelmi rengésben.",
    daily: "Ma kevesebbet magyarázz, többet engedj megtörténni." },
  { id: "csillag", name: "A Csillag", keywords: ["remény", "gyógyulás", "inspiráció"],
    general: "Egy nehéz időszak után most újra látszik valami irány. Halkan, de tisztán.",
    love: "Egy gyengéd nyitás. A bizalom most lassan, de visszatérhet.",
    decision: "A lap most nem siettet. Inkább azt mondja: bízhatsz abban, ami benned formálódik.",
    warning: "Ne keverd össze a reményt a passzivitással.",
    daily: "Ma engedj be egy szép pillanatot, amit máskor elsietnél." },
  { id: "hold", name: "A Hold", keywords: ["bizonytalanság", "álom", "tudattalan"],
    general: "Most nem minden az, aminek látszik. Nem rossz hír — csak még nincs minden megvilágítva.",
    love: "Egy érzés erős, de a kép még nem tiszta. Adj időt, mielőtt értelmezed.",
    decision: "Most ne hozz végleges döntést abból, ami csak homályban látszik.",
    warning: "A félelem most jobban dramatizál, mint amennyit a helyzet megérdemel.",
    daily: "Ma írj le egy érzést, ne értelmezd — csak figyeld." },
  { id: "nap", name: "A Nap", keywords: ["tisztaság", "öröm", "láthatóság"],
    general: "Valami most kitisztul. Az, ami eddig nehéz volt, könnyebbé válhat.",
    love: "Őszinte, meleg jelenlét. Most merj láthatóvá válni.",
    decision: "Az egyenes válasz a jó válasz. Ne bonyolítsd túl.",
    warning: "A túl sok lelkesedés most elfedhet egy fontos részletet.",
    daily: "Ma mondj ki egy köszönömöt, amit eddig csak gondoltál." },
  { id: "itelet", name: "Az Ítélet", keywords: ["hívás", "újraértékelés", "ébredés"],
    general: "Egy belső hívás, hogy másképp nézz valamire. A régi értelmezés már nem fér rá a helyzetre.",
    love: "Egy második esély lehetősége — vagy egy végleges lezárás. Mindkettő tisztulás.",
    decision: "Ne onnan dönts, ahonnan tavaly döntöttél volna. Más ember vagy.",
    warning: "Az önítélet most nem útmutató, csak zaj.",
    daily: "Ma kérdezd meg: mi az, amit ma másképp választanék, mint egy éve?" },
  { id: "vilag", name: "A Világ", keywords: ["beteljesedés", "egész", "kör"],
    general: "Egy szakasz lezárul. Nem mindig nagy esemény — sokszor egy belső megérkezés.",
    love: "Egy kapcsolat egésszé érhet, vagy egy régi mintát végleg le tudsz zárni.",
    decision: "A lap arra utalhat: ez a döntés egy hosszabb út utolsó lépése.",
    warning: "Ne kezdj újat, mielőtt a régit valóban lezártad.",
    daily: "Ma adj magadnak egy kicsi ünneplést valamiért, amit túléltél vagy elvégeztél." },
];

export function pickCards(n: number, seed?: number): TarotCard[] {
  const arr = [...CARDS];
  let s = seed ?? Math.floor(Math.random() * 1e9);
  // simple seeded shuffle
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

export function dailySeed(): number {
  const d = new Date();
  return Number(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`);
}
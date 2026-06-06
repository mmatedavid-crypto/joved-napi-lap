// Local Hungarian interpretations for known dream symbols. We never claim
// diagnosis — symbols are mirrors, not predictions.

export type DreamMeaning = {
  title: string;
  surface: string;
  notice: string;
  oneLine: string;
};

export const DREAM_HU: Record<string, DreamMeaning> = {
  flying: {
    title: "Repülés",
    surface: "Szabadság, kilépés egy szorító helyzetből, vagy egy belső emelkedés.",
    notice: "Hol vágysz több levegőre az életedben?",
    oneLine: "Valami felfelé szólít.",
  },
  falling: {
    title: "Esés",
    surface: "Egy kontrollvesztés érzése — gyakran egy bizonytalanság tükre.",
    notice: "Hol kapaszkodsz olyanba, ami már nem tart meg?",
    oneLine: "Az esés sokszor csak engedés.",
  },
  water: {
    title: "Víz",
    surface: "Érzelmek, a tudattalan, az, ami áramlik benned.",
    notice: "Milyen volt a víz: tiszta, zavaros, mozdulatlan?",
    oneLine: "Az érzéseid most beszélni akarnak.",
  },
  snake: {
    title: "Kígyó",
    surface: "Átalakulás, megújulás — de egyben egy figyelmeztetés is.",
    notice: "Mi az, ami most a régi bőrödből hullik le?",
    oneLine: "Az átváltozás nem büntetés.",
  },
  spider: {
    title: "Pók",
    surface: "Egy szövevény, kapcsolatháló, vagy egy régóta szövögetett terv.",
    notice: "Te szövöd, vagy beleragadtál?",
    oneLine: "A háló is otthon lehet, és csapda is.",
  },
  house: {
    title: "Ház",
    surface: "Önmagad belső szerkezete: szobák, zárt ajtók, ismerős sarkok.",
    notice: "Volt-e olyan szoba, ahova ritkán mész be?",
    oneLine: "Az otthon belül kezdődik.",
  },
  death: {
    title: "Halál",
    surface: "Szinte sosem szó szerinti — egy lezárás, átmenet, új ciklus jele.",
    notice: "Mi az, ami most ér véget benned?",
    oneLine: "A vég is kapu.",
  },
  teeth: {
    title: "Fogak",
    surface: "Önbizalom, megjelenés, a saját erőd érzése.",
    notice: "Hol érzed, hogy nem foghatsz keményen oda?",
    oneLine: "A hangod most fontos.",
  },
  car: {
    title: "Autó",
    surface: "Az életed iránya és tempója — te ülsz a volánnál?",
    notice: "Ki vezet most az életedben?",
    oneLine: "A volán is döntés.",
  },
  chase: {
    title: "Üldözés",
    surface: "Egy halogatott téma, amit szembe kellene nézni.",
    notice: "Mi az, ami elől futsz?",
    oneLine: "Amit megnézel, azt már nem üldöz.",
  },
  fire: {
    title: "Tűz",
    surface: "Szenvedély, harag, vagy átalakító erő.",
    notice: "Mi az, ami most lobog benned?",
    oneLine: "A tűz éltet és emészt.",
  },
  baby: {
    title: "Csecsemő",
    surface: "Új kezdet, gyengéd kezdemény, vagy egy belső rész, ami figyelmet kér.",
    notice: "Mi az új, ami most születőben van?",
    oneLine: "A kezdet törékeny és erős.",
  },
  wedding: {
    title: "Esküvő",
    surface: "Egyesülés — nem feltétlen kapcsolat, lehet saját részek összeérése is.",
    notice: "Mi az, ami most egy lesz benned?",
    oneLine: "Egy belső igen formálódik.",
  },
  naked: {
    title: "Meztelenség",
    surface: "Sebezhetőség, lelepleződés, vagy a valódi önmagad mutatása.",
    notice: "Hol érzed, hogy nem lehetsz mégsem teljesen őszinte?",
    oneLine: "A valódi nem szégyen.",
  },
  money: {
    title: "Pénz",
    surface: "Érték, önbecsülés, áramlás — nem mindig anyagi.",
    notice: "Mi az, amit most valóban értékelsz magadban?",
    oneLine: "Az érték belül kezdődik.",
  },
  stairs: {
    title: "Lépcső",
    surface: "Egy fokozat: emelkedés vagy alászállás belső szinteken.",
    notice: "Felfelé vagy lefelé mentél?",
    oneLine: "Egy fok az is.",
  },
  cat: {
    title: "Macska",
    surface: "Intuíció, függetlenség, női minőség.",
    notice: "Mit súg most a benső megérzésed?",
    oneLine: "A finomság erő.",
  },
  dog: {
    title: "Kutya",
    surface: "Hűség, barátság, ösztönös biztonság.",
    notice: "Kihez tartozol valójában?",
    oneLine: "A hűség kétoldalú.",
  },
};

export function dreamMeaning(slug: string | null): DreamMeaning | null {
  if (!slug) return null;
  return DREAM_HU[slug] ?? null;
}

export const DREAM_SLUG_OPTIONS: Array<{ slug: string; label: string }> = Object.entries(DREAM_HU).map(
  ([slug, m]) => ({ slug, label: m.title }),
);
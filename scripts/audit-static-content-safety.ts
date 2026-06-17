import { readdirSync, readFileSync, statSync } from "node:fs";

type StaticSafetyCheck = {
  file: string;
  forbidden: RegExp[];
  required?: string[];
};

const checks: StaticSafetyCheck[] = [
  {
    file: "src/lib/dateKeys.ts",
    forbidden: [],
    required: [
      'const HU_TIME_ZONE = "Europe/Budapest"',
      "export function huTodayKey",
      "export function addDaysToDateKey",
    ],
  },
  {
    file: "src/lib/storage.ts",
    forbidden: [/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/],
    required: ['import { huTodayKey } from "./dateKeys";', "return huTodayKey();"],
  },
  {
    file: "src/routes/szerencseszamok.tsx",
    forbidden: [/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/],
    required: ['import { huTodayKey } from "@/lib/dateKeys";', "return huTodayKey();"],
  },
  {
    file: "src/data/magazin.hu.ts",
    forbidden: [/now\.toISOString\(\)\.slice\(0, 10\)/],
    required: ['import { huTodayKey } from "@/lib/dateKeys";', "const today = huTodayKey(now);"],
  },
  {
    file: "src/lib/paidReadings.ts",
    forbidden: [/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/],
    required: [
      'import { huTodayKey } from "./dateKeys";',
      "dateKey: text(input.dateKey) || huTodayKey()",
    ],
  },
  {
    file: "src/lib/roxy.functions.ts",
    forbidden: [/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/],
    required: [
      'import { huTodayKey } from "./dateKeys";',
      "const date = data.date ?? huTodayKey();",
      "const dateKey = data.dateKey ?? huTodayKey();",
    ],
  },
  {
    file: "src/routes/sitemap[.]xml.tsx",
    forbidden: [/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/],
    required: ['import { huTodayKey } from "@/lib/dateKeys";', "const today = huTodayKey();"],
  },
  {
    file: "src/components/PaidReadingBody.tsx",
    forbidden: [
      /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/,
      /szimbolikus, önismereti digitális tartalom/i,
    ],
    required: [
      'import { huTodayKey } from "@/lib/dateKeys";',
      "`jovod-olvasat-${huTodayKey()}.txt`",
      "régi jelképrendszerekből készült önismereti olvasat",
    ],
  },
  {
    file: "src/data/chineseZodiac.hu.ts",
    forbidden: [
      /\bidegrendszer\b/i,
      /\bemésztés\b/i,
      /\bhormon/i,
      /\bpajzsmirigy\b/i,
      /\bízület/i,
      /\banyagcsere\b/i,
      /\bmáj\b/i,
      /\bmasszázs kötelező\b/i,
      /\bgyógyít/i,
      /\bVonzza a bőséget\b/i,
      /\bJó pénzügyi érzéke\b/i,
      /\bbefektetésre érzékenyen\b/i,
      /\bügyvédi\b/i,
      /\borvosi\b/i,
      /\bkatonai\b/i,
      /\bhalálos pontosan\b/i,
    ],
    required: [
      "ritmus",
      "támogató munka",
      "nem minden feszültséget saját feladatként",
      "józan ellenőrzést",
      "meglepően pontosan és fókuszáltan",
      "Rendszerező, elemző, adminisztratív",
    ],
  },
  {
    file: "src/data/numerologyTypes.hu.ts",
    forbidden: [
      /\bgyógyít/i,
      /\bgyógyító/i,
      /\bmestersz mára\b/i,
      /\bAnyagi hatalom\b/i,
      /\bpénzügyeidet\b/i,
      /\bházasság, gyerek, költözés\b/i,
      /\bMost jönnek az eredmények\b/i,
    ],
    required: [
      "mélyen támogató jelenlétként",
      "megtartó erőt",
      "mások támogatására",
      "Nem pénzügyi ígéret",
      "mesterszámra",
    ],
  },
  {
    file: "src/data/lifePathMeanings.hu.ts",
    forbidden: [
      /\bgyógyít/i,
      /\bgyógyító/i,
      /\bterapeuta\w*/i,
      /\bápoló\b/i,
      /\bpénzügyi tanácsad/i,
      /\bpénzügyi szakértelem\b/i,
      /\bsiker megtestesítője\b/i,
      /\belőre megérezni dolgokat\b/i,
      /\bfelsőbb síkok\b/i,
      /\bideális diplomaták\b/i,
    ],
    required: [
      "egészséges határokkal",
      "spirituális érlelődésre",
      "tanítás, támogatás",
      "tartós rend és felelősség eszközeként",
      "Nem felsőbbrendűség",
    ],
  },
  {
    file: "src/data/cards.ts",
    forbidden: [/\bbiztosan\b/i, /\bgyógyít/i, /\bgyógyítható\b/i, /\bbefektetés\b/i],
    required: ["bukkanhat fel", "finoman feldolgozható"],
  },
  {
    file: "src/lib/angel.hu.ts",
    forbidden: [
      /\bkészülj\b/i,
      /\bvisszatérülés közeledik\b/i,
      /\bami jár, az megérkezik\b/i,
      /\begészen új kezdődik\b/i,
      /\bjó úton vagy\b/i,
      /\bpontosan ott vagy\b/i,
      /\blenned kell\b/i,
      /\bteremtő erejű\b/i,
      /\bmanifesztáció\b/i,
    ],
    required: [
      "arra hívhatja fel a figyelmed",
      "nem ígéretként, inkább önismereti jelként",
      "önismereti jelként arra terelheti a figyelmed",
      "tisztábban szólhat hozzád",
    ],
  },
  {
    file: "src/data/ichingHexagrams.hu.ts",
    forbidden: [
      /\bValami jó közeledik\b/i,
      /\bValami jó dolog visszatér\b/i,
      /\bhatni fog rád\b/i,
      /\bA megérzéseid most pontosak\b/i,
      /\bEngedd magadhoz, akit a szíved hív\b/i,
      /\bBocsáss meg\b/i,
      /\bmegérkezik\b/i,
      /\bki kell mondani vagy meg kell tenni\b/i,
      /\bcélja a gyógyulás\b/i,
    ],
    required: [
      "Egy kedvezőbb mozgás közeledhet",
      "A megbékélés akkor értékes, ha belülről érik",
      "Valamit talán tisztábban kell kimondani vagy vállalni",
      "Az átharapás célja a tisztázás",
      "nem a múlt ismétlése",
      "vesd össze a helyzet tényeivel is",
    ],
  },
  {
    file: "src/lib/crystal.hu.ts",
    forbidden: [
      /\bgyógyít/i,
      /\bgyógyító/i,
      /\bFinomítja\b/i,
      /\bMegerősíti\b/i,
      /\bfókuszt ad\b/i,
      /\bönbizalmat hoz\b/i,
      /\bjelenlétet hoz\b/i,
      /\bminőséget hoz\b/i,
      /\bho(t|z) elő\b/i,
      /\berősíti\b/i,
    ],
    required: [
      "milyen minőséget jelképez",
      "Önismereti jelként",
      "Hagyományosan",
      "jelképezi",
      "társítják",
    ],
  },
  {
    file: "src/routes/kristaly.tsx",
    forbidden: [/\bminőséget hoz elő\b/i, /\bgyógyít/i, /\bgyógyító/i],
    required: [
      "milyen minőséget hordoz",
      'Section eyebrow="Milyen minőséget hordoz?"',
      "A kristályok hagyományosan szimbólumok",
      "önismereti jelként használjuk",
    ],
  },
  {
    file: "src/components/ReadingLoadingState.tsx",
    forbidden: [
      /\bLekérdezzük\b/i,
      /\bAPI\b/i,
      /\bháttéradat\b/i,
      /\bszolgáltató\b/i,
      /\blefordít/i,
    ],
    required: [
      "Figyelembe vesszük a Nap, a Hold és a bolygók aktuális állását",
      "Az asztrológiai képlet időminőségéből",
      "a Major és Minor Arcana hagyományával",
      "hagyományos álomfejtésben",
      "hagyományos jelentésével",
    ],
  },
  {
    file: "src/lib/dream.hu.ts",
    forbidden: [/\bSzinte sosem szó szerinti\b/i, /\bA vég is kapu\b/i],
    required: [
      "Nem jóslat és nem szó szerinti előrejelzés",
      "lezárást, átmenetet",
      "Nem végzet, hanem átmenet képe",
    ],
  },
  {
    file: "src/routes/alomfejtes.tsx",
    forbidden: [
      /Az álom nem előrejelzés\. Egy belső kép, amit érdemes meghallgatni, de nem szó\s+ szerint venni\./i,
    ],
    required: [
      "function dreamSafetyNote",
      "result.title",
      "halálesetet jósol",
      "Az álom nem szó szerinti jövőjel",
      "hagyományos álomfejtés",
      "milyen érzés, lezárás vagy vágy kér most figyelmet",
      "gyászhoz, krízishez vagy tartós szorongáshoz",
      "kérj emberi vagy szakmai támogatást",
    ],
  },
  {
    file: "src/routes/alomfejtes-jelentes.tsx",
    forbidden: [/\ba halál pedig sokszor\b/i],
    required: [
      "halálképek pedig nem jóslatként",
      "Mit jelent, ha halállal álmodom?",
      "Nem kezeljük előrejelzésként",
      "tartós szorongáshoz kapcsolódik",
    ],
  },
  {
    file: "src/routes/arak.tsx",
    forbidden: [
      /Nem\. A Jövőd\.hu szimbolikus/i,
      /szimbolikus, önismereti digitális tartalmat ad/i,
      /Azonnali digitális olvasat/i,
      /Részletes digitális olvasat/i,
    ],
    required: [
      "Azonnali önismereti olvasat",
      "Részletes önismereti olvasat",
      "A tarot, a számmisztika és az asztrológia régi jelképrendszerekből indul.",
      "önismereti olvasatként kezeljük",
      "tisztábban ránézni egy helyzetre",
      "nem helyettesítenek orvosi, jogi, pénzügyi vagy krízishelyzeti segítséget",
    ],
  },
  {
    file: "src/lib/roxy.functions.ts",
    forbidden: [
      /roxyAngolForras/,
      /Roxy angol forrás/i,
      /FORDÍTANDÓ FORRÁST/i,
      /raw provider-szöveget/i,
      /endpoint- vagy mezőneveket/i,
    ],
    required: [
      "forrasAdatok",
      "forrasJelentes",
      "forrasJelentesSzabaly",
      "gépházi szöveget",
      "hűséges magyar szerkesztő",
    ],
  },
  {
    file: "src/lib/roxyTranslate.functions.ts",
    forbidden: [
      /Roxy API/i,
      /nyers angol Roxy/i,
      /raw provider-szöveget/i,
      /endpoint- vagy mezőneveket/i,
      /fordítója vagy/i,
    ],
    required: [
      "magyar szimbolikus olvasatainak szerkesztője",
      "forrásanyag jelentését",
      "FORRÁSANYAG",
      "magyar olvasat",
    ],
  },
  {
    file: "src/lib/horoscopeNews.server.ts",
    forbidden: [
      /RoxyAPI horoszkóp-forrás/i,
      /Angolról magyarra fordítasz/i,
      /Fordítandó szöveg/i,
      /endpointnevet/i,
      /AI-meta mondatot/i,
      /háttéradat most nem érhető el/i,
    ],
    required: [
      "horoszkóp-rovatának szerkesztője",
      "forrásszöveg jelentését",
      "Forrásanyag",
      "technikai mezőnevet vagy gépházi magyarázatot",
    ],
  },
  {
    file: "src/lib/products/personal30day.server.ts",
    forbidden: [/Roxy-forrás/i, /ROXY NATAL/i, /ROXY FORECAST/i, /nyers JSON, angol/i],
    required: [
      "asztrológiai forrásanyagból",
      "SZÜLETÉSI KÉPLET FORRÁSANYAGA",
      "ASZTROLÓGIAI IDŐVONAL 30 NAPRA",
    ],
  },
  {
    file: "src/lib/products/personalYearly.server.ts",
    forbidden: [/Roxy-forrás/i, /ROXY NATAL/i, /ROXY ÉVES/i, /nyers JSON, angol/i],
    required: [
      "asztrológiai forrásanyagból",
      "SZÜLETÉSI KÉPLET FORRÁSANYAGA",
      "ÉVES ASZTROLÓGIAI FORRÁSANYAG",
    ],
  },
  {
    file: "src/lib/products/transitsPersonal.server.ts",
    forbidden: [/Roxy-forrás/i, /ROXY NATAL/i, /ROXY TRANZIT/i, /nyers JSON, angol/i],
    required: [
      "asztrológiai forrásanyagból",
      "SZÜLETÉSI KÉPLET FORRÁSANYAGA",
      "TRANZITFORRÁS 90 NAPRA",
    ],
  },
  {
    file: "src/lib/products/vedicFull.server.ts",
    forbidden: [/ROXY NATAL/i, /nyers JSON, angol/i],
    required: ["VÉDIKUS (SZIDERIKUS) ÉRTÉKEK", "TROPIKUS SZÜLETÉSI KÉPLET FORRÁSANYAGA"],
  },
  {
    file: "src/lib/analytics.ts",
    forbidden: [/roxy_call_/, /roxy_cache_/, /roxy_fallback_/, /roxy_domain_/, /endpoint:/],
    required: [
      "knowledge_lookup_started",
      "knowledge_lookup_succeeded",
      "knowledge_lookup_failed",
      "knowledge_cache_hit",
      "knowledge_cache_miss",
      "local_meaning_used",
    ],
  },
  {
    file: "src/components/RitualTable.tsx",
    forbidden: [/roxy_call_/, /roxy_cache_/, /roxy_fallback_/, /endpoint:/],
    required: ["knowledge_lookup_started", "knowledge_cache_hit", "local_meaning_used"],
  },
  {
    file: "src/routes/mai-iranytu.tsx",
    forbidden: [/roxy_call_/, /roxy_cache_/, /roxy_fallback_/, /endpoint:/],
    required: ["knowledge_cache_hit", "knowledge_cache_miss", "local_meaning_used"],
  },
];

const failures: string[] = [];

const publicUiFiles = [
  "src/components/ui/dialog.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/pagination.tsx",
  "src/components/ui/carousel.tsx",
  "src/components/ui/sidebar.tsx",
  "src/components/ui/breadcrumb.tsx",
];

function walkPublicUiSources(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const path = `${dir}/${entry}`;
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (["api", "dev.roxy", "lovable"].some((part) => path.includes(`/${part}`))) continue;
      files.push(...walkPublicUiSources(path));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry)) files.push(path);
  }
  return files;
}

for (const file of publicUiFiles) {
  const body = readFileSync(file, "utf8");
  for (const forbidden of [
    />Close</,
    />Previous</,
    />Next</,
    />Previous slide</,
    />Next slide</,
    />More pages</,
    />More</,
    />Toggle Sidebar</,
    /aria-label="Go to previous page"/,
    /aria-label="Go to next page"/,
    /aria-label="Toggle Sidebar"/,
    /aria-label="breadcrumb"/,
    /aria-label="pagination"/,
  ]) {
    if (forbidden.test(body)) {
      failures.push(`${file}: public UI accessibility text must be Hungarian: ${forbidden}`);
    }
  }
}

const publicTrustLeakFiles = [
  ...walkPublicUiSources("src/routes").filter(
    (file) => !file.includes("/api/") && !file.includes("/lovable/") && !file.endsWith("dev.roxy.tsx"),
  ),
  ...walkPublicUiSources("src/components"),
  "src/lib/error-page.ts",
  "src/lib/products.ts",
];
const publicTrustLeakPatterns = [
  /\bháttéradat\b/i,
  /\bháttértudás\b/i,
  /\bprovider response\b/i,
  /\bprovider error\b/i,
  /\bRoxy API\b/i,
  /\bOpenAI\b/i,
  /\bGPT\b/i,
  /\bAI hiba\b/i,
  /\bmint AI\b/i,
  /természetes magyar olvasattá/i,
  /közérthető magyar nyelven fogalmazzuk meg/i,
  /magyarra fordít/i,
  /lefordít/i,
];

for (const file of publicTrustLeakFiles) {
  const body = readFileSync(file, "utf8");
  for (const forbidden of publicTrustLeakPatterns) {
    if (forbidden.test(body)) {
      failures.push(`${file}: public trust copy must not expose internal/provider wording: ${forbidden}`);
    }
  }
}

for (const check of checks) {
  const body = readFileSync(check.file, "utf8");

  for (const forbidden of check.forbidden) {
    if (forbidden.test(body)) {
      failures.push(
        `${check.file}: unsafe static self-reflection claim still present: ${forbidden}`,
      );
    }
  }

  for (const required of check.required ?? []) {
    if (!body.includes(required)) {
      failures.push(`${check.file}: expected safer symbolic wording missing: ${required}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Static content safety audit passed: ${checks.length} files.`);

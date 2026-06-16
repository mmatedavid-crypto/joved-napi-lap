import { readFileSync } from "node:fs";

type StaticSafetyCheck = {
  file: string;
  forbidden: RegExp[];
  required?: string[];
};

const checks: StaticSafetyCheck[] = [
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
    forbidden: [/\bgyógyít/i, /\bgyógyító/i],
    required: ["mélyen támogató jelenlétként", "megtartó erőt", "mások támogatására"],
  },
  {
    file: "src/data/lifePathMeanings.hu.ts",
    forbidden: [/\bgyógyít/i, /\bgyógyító/i, /\bterapeuta\w*/i, /\bápoló\b/i],
    required: ["egészséges határokkal", "spirituális érlelődésre", "tanítás, támogatás"],
  },
  {
    file: "src/data/cards.ts",
    forbidden: [/\bbiztosan\b/i, /\bgyógyít/i, /\bgyógyítható\b/i],
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

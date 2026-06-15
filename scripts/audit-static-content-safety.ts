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
    ],
    required: ["ritmus", "támogató munka", "nem minden feszültséget saját feladatként"],
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
];

const failures: string[] = [];

for (const check of checks) {
  const body = readFileSync(check.file, "utf8");

  for (const forbidden of check.forbidden) {
    if (forbidden.test(body)) {
      failures.push(`${check.file}: unsafe static self-reflection claim still present: ${forbidden}`);
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

import { readFileSync } from "node:fs";

type Check = {
  name: string;
  file: string;
  includes: string[];
};

const checks: Check[] = [
  {
    name: "profile clears account and browser memory together",
    file: "src/routes/profil.tsx",
    includes: [
      "clearMyReadingMemories",
      "clearGuestPersonalization",
      "ebből a fiókból és ebből a böngészőből",
      "Töröltük az olvasati memóriát a fiókodból és a helyi böngészőmintát",
    ],
  },
  {
    name: "profile explains memory scope gently",
    file: "src/routes/profil.tsx",
    includes: [
      "Itt csak rövid olvasati mintákat őrzünk",
      "nem készítünk belőle biztos jövőállítást",
      "profilt",
      "legfeljebb 180 napig",
      "A törlés nem érinti a rendelési előzményeket",
    ],
  },
  {
    name: "privacy page exposes guest memory clearing",
    file: "src/routes/adatkezelesi-tajekoztato.tsx",
    includes: [
      "clearGuestPersonalization",
      "Helyi olvasati minta törlése",
      "localStorage-ban és",
      "cookie-jelzésben",
      "legfeljebb 180 napig használjuk",
    ],
  },
  {
    name: "guest personalization clears and expires local and cookie signals",
    file: "src/lib/guestReadingMemory.ts",
    includes: [
      "const RETENTION_DAYS = 180",
      "new Date(row.createdAt).getTime() >= cutoff",
      "window.localStorage.removeItem(`jovod:${KEY}`)",
      "deleteCookie(COOKIE_TOTAL_KEY)",
      "deleteCookie(COMPATIBILITY_COUNT_KEY)",
      "deleteCookie(COMPATIBILITY_STATUS_KEY)",
    ],
  },
];

const failed: string[] = [];

for (const check of checks) {
  const body = readFileSync(check.file, "utf8");
  const missing = check.includes.filter((needle) => !body.includes(needle));
  if (missing.length) failed.push(`${check.name}: missing ${missing.join(", ")}`);
}

if (failed.length) {
  console.error("Memory experience audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Memory experience audit passed: ${checks.length} checks.`);

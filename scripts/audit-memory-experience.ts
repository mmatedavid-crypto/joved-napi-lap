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
      "Később itt látod",
      "milyen témához térsz vissza újra",
      "Miben segít?",
      "nem idegenként indul",
      "Nem készítünk belőle személyiségprofilt",
      "A törlés nem érinti a rendelési előzményeket",
    ],
  },
  {
    name: "profile turns memory insights into gentle next actions",
    file: "src/routes/profil.tsx",
    includes: [
      "MemoryNextSteps",
      "memoryNextStepItems",
      "Következő jó kérdés",
      "nem kell újra nulláról indulnod",
      "Kapcsolati dinamika",
      'to: "/osszeillunk"',
      "Döntés előtt",
      'to: "/dontes-elott"',
      "Három lap",
      'to: "/harom-lap"',
      "Mai iránytű",
      'to: "/mai-iranytu"',
    ],
  },
  {
    name: "privacy page exposes guest memory clearing",
    file: "src/routes/adatkezelesi-tajekoztato.tsx",
    includes: [
      "clearGuestPersonalization",
      "setGuestPersonalizationEnabled",
      "Helyi olvasati minta törlése",
      "Helyi személyesítés kikapcsolása",
      "Helyi személyesítés visszakapcsolása",
      "localStorage-ban és",
      "cookie-jelzésben",
      "legfeljebb 180 napig használjuk",
    ],
  },
  {
    name: "guest personalization clears and expires local and cookie signals",
    file: "src/lib/guestReadingMemory.ts",
    includes: [
      "const DISABLED_KEY =",
      "export function isGuestPersonalizationEnabled",
      "export function setGuestPersonalizationEnabled",
      "if (!isGuestPersonalizationEnabled()) return",
      "const RETENTION_DAYS = 180",
      "new Date(row.createdAt).getTime() >= cutoff",
      "window.localStorage.removeItem(`jovod:${KEY}`)",
      "deleteCookie(COOKIE_TOTAL_KEY)",
      "deleteCookie(COMPATIBILITY_COUNT_KEY)",
      "deleteCookie(COMPATIBILITY_STATUS_KEY)",
    ],
  },
  {
    name: "guest memory builds a real returning-user arc",
    file: "src/lib/guestReadingMemory.ts",
    includes: [
      "export type GuestReadingInsights",
      "weeklySummary",
      "monthlySummary",
      "recurringQuestion",
      "changeSinceLast",
      "gentleNudge",
      "Miben kérdezel újra",
      "Múltkorihoz képest",
    ],
  },
  {
    name: "guest compatibility pattern is tracked before signup",
    file: "src/lib/guestReadingMemory.ts",
    includes: [
      "distinctCompatibilityTopics(rows, 30)",
      "saveLocal(",
      "COMPATIBILITY_KEY",
      "saveCookie(COMPATIBILITY_COUNT_KEY",
      "saveCookie(COMPATIBILITY_STATUS_KEY",
      "Több emberrel is megnézted az összeillést",
    ],
  },
  {
    name: "guest memory notice is visible and controllable",
    file: "src/components/GuestMemoryNotice.tsx",
    includes: [
      "guest_reading_memory_count",
      "clearGuestPersonalization",
      "setGuestPersonalizationEnabled",
      "ne minden alkalom",
      "idegenként induljon",
      "Helyi minta törlése",
      "Személyesítés kikapcsolása",
      "Új vendégmintát nem mentünk",
      "Adatkezelés",
      "guest_memory_notice_dismissed",
    ],
  },
  {
    name: "guest memory insight panel shows returning-user arc gently",
    file: "src/components/GuestMemoryInsightPanel.tsx",
    includes: [
      "getGuestReadingContext",
      "setGuestPersonalizationEnabled",
      "context.memories.length < 2",
      "Ismétlődő mintád",
      "insights.recurringQuestion",
      "insights.changeSinceLast",
      "distinctCompatibilityCount >= 3",
      "Csak ebben a böngészőben tárolt",
      "clearGuestPersonalization",
      "Helyi minta törlése",
      "Személyesítés kikapcsolása",
      "Új vendégmintát nem mentünk",
      "adatkezelési oldalon",
    ],
  },
  {
    name: "layout mounts guest memory notice",
    file: "src/components/Layout.tsx",
    includes: ["GuestMemoryNotice", "<GuestMemoryNotice />"],
  },
  {
    name: "key reading pages surface guest memory insight panel",
    file: "src/routes/osszeillunk.tsx",
    includes: [
      "GuestMemoryInsightPanel",
      'readingType="compatibility"',
      "topic={status}",
      "situation={status}",
    ],
  },
  {
    name: "tarot relationship pages surface guest memory insight panel",
    file: "src/routes/randi-elott.tsx",
    includes: [
      "GuestMemoryInsightPanel",
      'readingType="love"',
      "topic={q || sit}",
      "situation={sit}",
    ],
  },
  {
    name: "decision and three-card pages surface guest memory insight panel",
    file: "src/routes/dontes-elott.tsx",
    includes: [
      "GuestMemoryInsightPanel",
      'readingType="decision"',
      "topic={q || cat}",
      "situation={cat}",
    ],
  },
  {
    name: "three-card page surfaces guest memory insight panel",
    file: "src/routes/harom-lap.tsx",
    includes: [
      "GuestMemoryInsightPanel",
      'readingType="tarot"',
      "topic={question || category}",
      "situation={category}",
    ],
  },
  {
    name: "dream page surfaces guest memory insight panel",
    file: "src/routes/alomfejtes.tsx",
    includes: [
      "GuestMemoryInsightPanel",
      'readingType="dream"',
      "topic={result?.title || text}",
      "situation={emotion}",
    ],
  },
  {
    name: "home daily compass uses and records returning-user context",
    file: "src/components/PersonalDailyBriefing.tsx",
    includes: [
      "getGuestReadingContext",
      "recordGuestReadingMemory",
      "memoryContext",
      'readingType: "daily_compass"',
      'topic: "mai iránytű"',
    ],
  },
  {
    name: "compatibility fallback memory reflects status and repeated comparisons",
    file: "src/routes/osszeillunk.tsx",
    includes: [
      "function compatibilityMemorySentence",
      "Több emberrel is megnézted az összeillést",
      "Visszatérő történetnél nem csak az számít",
      "ismerkedésnél a kezdeti vonzalom",
      "relationshipNumber: fallbackProfile.relationshipNumber",
      "summary: `${fallbackReading.oneSentence} ${memorySentence}`",
      "oneSentence: memorySentence",
    ],
  },
  {
    name: "compatibility cached AI reading still returns display profile",
    file: "src/lib/readingQuality/functions.ts",
    includes: [
      "const localProfile = calculateCompatibilityProfile",
      "const compatHit = await readCachedReading(compatCacheKey)",
      "profile: localProfile",
      "...localProfile",
    ],
  },
  {
    name: "server daily briefing can personalize from memory without exposing it",
    file: "src/lib/roxy.functions.ts",
    includes: [
      "memoryContext: z.string().max(1600).optional()",
      "felhasznaloiIv",
      "hasMemoryContext",
      "Ne nevezd memóriának",
      "memoryKey",
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

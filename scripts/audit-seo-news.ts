import { readFileSync } from "node:fs";

type Check = {
  name: string;
  file: string;
  includes: string[];
  excludes?: string[];
};

const checks: Check[] = [
  {
    name: "news sitemap only exposes fresh horoscope articles",
    file: "src/routes/sitemap-news[.]xml.tsx",
    includes: [
      "function isNewsFresh",
      "48 * 60 * 60 * 1000",
      ".filter((u) => isNewsFresh(u.publicationDate, generatedAt))",
      "<news:publication_date>${u.publicationDate}</news:publication_date>",
      "Cache-Control",
    ],
  },
  {
    name: "regular sitemap still exposes every horoscope landing article",
    file: "src/routes/sitemap[.]xml.tsx",
    includes: [
      "...allHoroscopeArticlePaths().map",
      'changefreq: period === "napi" ? "daily" : period === "heti" ? "weekly" : "monthly"',
      'priority: period === "napi" ? "0.8" : "0.6"',
    ],
  },
  {
    name: "horoscope article fallback pages are not indexed",
    file: "src/routes/horoszkop.$period.$sign.tsx",
    includes: [
      'loaderData.fallbackUsed ? "noindex,follow" : "index,follow"',
      '"@type": "NewsArticle"',
      "datePublished: articleDate",
      "dateModified: articleDate",
    ],
  },
  {
    name: "horoscope article communicates live preparation during slow loads",
    file: "src/routes/horoszkop.$period.$sign.tsx",
    includes: [
      "pendingComponent: HoroscopeArticlePending",
      "HOROSCOPE_PENDING_STEPS",
      "nem előre megírt sablont",
      "Készül a friss horoszkópod",
      "háttéradatot vesszük alapul",
      "természetes magyar olvasatot",
    ],
  },
  {
    name: "horoscope news can be prewarmed through a protected internal route",
    file: "src/routes/api/internal/horoscope-news/prewarm.ts",
    includes: [
      'createFileRoute("/api/internal/horoscope-news/prewarm")',
      "HOROSCOPE_PREWARM_SECRET",
      "SUPABASE_SERVICE_ROLE_KEY",
      "Authorization",
      "Bearer ",
      "MAX_LIMIT = 36",
      "getHoroscopeNewsArticle",
      '"Cache-Control": "no-store"',
      "fallbackCount",
      "translationCached",
    ],
    excludes: ["article.lead", "article.title", "roxy.data", "response_payload"],
  },
  {
    name: "horoscope fallback is publishable Hungarian copy, not provider error text",
    file: "src/lib/horoscopeNews.server.ts",
    includes: [
      'const NEWS_TRANSLATION_VERSION = "news-horo-hu-v4"',
      "LOVABLE_HOROSCOPE_NEWS_MODEL",
      "HOROSCOPE_NEWS_MODEL",
      "HOROSCOPE_NEWS_TIMEOUT_MS",
      "TECHNICAL_FALLBACK_RE",
      "function hasTechnicalFallbackText",
      "cached && !hasTechnicalFallbackText(cached)",
      "if (hasTechnicalFallbackText(raw)) return null",
      "SIGN_FALLBACK_ARCHETYPE",
      "SIGN_WITH_ARTICLE",
      "SIGN_RELATIONSHIP_FOCUS",
      "SIGN_WORK_FOCUS",
      "SIGN_ATTENTION_FOCUS",
      "periodFocus",
      "Heti hangulat",
      "Havi irány",
      "Kapcsolatok",
      "Munka és ritmus",
      "FALLBACK_COLORS",
      'providerPreference: "lovable_first"',
      "lovableModel: HOROSCOPE_NEWS_MODEL",
      "timeoutMs: HOROSCOPE_NEWS_TIMEOUT_MS",
    ],
    excludes: [
      "A háttéradat most nem érhető el",
      "általános magyar tartalmat mutatunk",
      "provider error",
      "a ${signName} jegy",
      "nem nagy jóslatot",
    ],
  },
];

const failed: string[] = [];

for (const check of checks) {
  const body = readFileSync(check.file, "utf8");
  const missing = check.includes.filter((needle) => !body.includes(needle));
  if (missing.length) failed.push(`${check.name}: missing ${missing.join(", ")}`);
  const forbidden = (check.excludes ?? []).filter((needle) => body.includes(needle));
  if (forbidden.length) failed.push(`${check.name}: forbidden ${forbidden.join(", ")}`);
}

if (failed.length) {
  console.error("SEO/news audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`SEO/news audit passed: ${checks.length} checks.`);

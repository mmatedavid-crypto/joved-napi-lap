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
      "SITE_LEGAL.siteUrl",
      "const SITEMAP_ORIGIN = SITE_LEGAL.siteUrl",
      "getFreshPublishedHoroscopeNewsItems",
      "/horoszkop/${u.article.period}/${u.article.signSlug}",
      "<news:publication_date>${u.publicationDate}</news:publication_date>",
      "horoscopeSeoTitle(u.article.period, u.article.signName)",
      "Cache-Control",
    ],
    excludes: ["x-forwarded-host", 'request.headers.get("host")', "originFromRequest"],
  },
  {
    name: "regular sitemap still exposes every horoscope landing article",
    file: "src/routes/sitemap[.]xml.tsx",
    includes: [
      "SITE_LEGAL.siteUrl",
      "const SITEMAP_ORIGIN = SITE_LEGAL.siteUrl",
      "...allHoroscopeArticlePaths().map",
      'changefreq: period === "napi" ? "daily" : period === "heti" ? "weekly" : "monthly"',
      'priority: period === "napi" ? "0.8" : "0.6"',
    ],
    excludes: ["x-forwarded-host", 'request.headers.get("host")', "originFromRequest"],
  },
  {
    name: "robots sitemap URLs use the canonical production domain",
    file: "src/routes/robots[.]txt.tsx",
    includes: [
      "SITE_LEGAL.siteUrl",
      "const SITEMAP_ORIGIN = SITE_LEGAL.siteUrl",
      "`Sitemap: ${origin}/sitemap.xml`",
      "`Sitemap: ${origin}/sitemap-news.xml`",
    ],
    excludes: ["x-forwarded-host", 'request.headers.get("host")', "originFromRequest"],
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
      "ReadingLoadingState",
      'kind="horoscope"',
      "nem egy rövid, általános sablonszöveg",
      "Készül a friss horoszkópod",
      "holdfázisát és kiemelt témáit",
      "természetes magyar olvasattá",
      "loadingSteps",
      "időszakának fő témáit tekintjük át",
      "A holdfázist, a kiemelt színt és a szerencseszámot",
      "természetes, közérthető magyar nyelven",
      "utolsó ellenőrzött változatot mutatjuk",
      "Természetes, átnézett magyar szöveg",
    ],
  },
  {
    name: "horoscope article cross-links same sign across all periods",
    file: "src/routes/horoszkop.$period.$sign.tsx",
    includes: [
      "const periodLinks = HOROSCOPE_PERIODS.map",
      "horoscopeArticlePath(period, article.sign)",
      "{article.signName} időszakai",
      "periodLinks.map",
      "item.period === article.period",
      "periodDateLabel(item.period)",
    ],
  },
  {
    name: "horoscope article paid CTA carries article context into premium reading",
    file: "src/routes/horoszkop.$period.$sign.tsx",
    includes: [
      'productSlug="horoszkop_szemelyre"',
      "const [personalTopic, setPersonalTopic]",
      "Mostani témád",
      "a cikk hangulatából kiindulva",
      "personalTopic.trim() || articleSituation",
      "situation: personalSituation",
      "articleSituation,",
      "articleLead: article.lead",
      "articleSections: article.sections.slice(0, 4).map",
      "moonPhase: article.moonPhase",
      "luckyColor: article.luckyColor",
      "luckyNumber: article.luckyNumber",
      "SmartReadingFollowup",
      'intent="horoscope"',
      'readingType="horoscope"',
      "question={personalTopic.trim() || articleSituation}",
    ],
  },
  {
    name: "paid horoscope fallback can use article context",
    file: "src/lib/paidReadings.ts",
    includes: [
      "const articleLead = text(input.articleLead)",
      "const articleSections = horoscopeArticleSections(input.articleSections)",
      "A friss horoszkópcikkedből",
      "A most olvasott cikk alaphangja",
      "A legerősebb cikkbeli fókuszok",
      "function horoscopeArticleSections",
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
      "DEFAULT_CONCURRENCY = 2",
      "MAX_CONCURRENCY = 4",
      "parseOffset",
      "parseConcurrency",
      "warmTargetsInBatches",
      "nextOffset",
      "totalTargets",
      "getHoroscopeNewsArticle",
      '"Cache-Control": "no-store"',
      "qualityOkCount",
      "fallbackCount",
      "retryTargets",
      "translationCached",
    ],
    excludes: ["article.lead", "article.title", "roxy.data", "response_payload"],
  },
  {
    name: "horoscope fallback is publishable Hungarian copy, not provider error text",
    file: "src/lib/horoscopeNews.server.ts",
    includes: [
      'const NEWS_TRANSLATION_VERSION = "news-horo-hu-v7-source-locked"',
      "LOVABLE_HOROSCOPE_NEWS_MODEL",
      "HOROSCOPE_NEWS_MODEL",
      "HOROSCOPE_NEWS_TIMEOUT_MS",
      "TECHNICAL_FALLBACK_RE",
      "function hasTechnicalFallbackText",
      "async function readLatestCachedArticle",
      "getFreshPublishedHoroscopeNewsItems",
      "articlePublicationDate",
      "isNewsFresh",
      "if (!article || article.fallbackUsed || hasTechnicalFallbackText(article)) continue",
      '.like("cache_key", `horo-news:${NEWS_TRANSLATION_VERSION}:${opts.period}:${opts.sign}:%`)',
      "translationCached: true",
      "cached && !hasTechnicalFallbackText(cached)",
      "if (hasTechnicalFallbackText(raw)) return null",
      "SIGN_FALLBACK_ARCHETYPE",
      "SIGN_WITH_ARTICLE",
      "SIGN_RELATIONSHIP_FOCUS",
      "SIGN_WORK_FOCUS",
      "SIGN_ATTENTION_FOCUS",
      "PERIOD_THEME_VARIANTS",
      "stableVariantIndex",
      "fallbackVariant",
      "type RoxyHoroscopeSignals",
      "function extractRoxyHoroscopeSignals",
      "collectSourceStrings",
      "SOURCE_FOCUS_LABEL",
      "sourceSignalSentence",
      "sourceSectionNudge",
      "const sourceSignals = extractRoxyHoroscopeSignals(roxy.data)",
      "function sourceOverview",
      "async function translateOverviewFaithfully",
      'return { ...fallback, lead: faithfulLead ?? "" }',
      "sourceSignals,",
      "periodFocus",
      "Heti hangulat",
      "Havi irány",
      "Kapcsolatok",
      "Munka és ritmus",
      "FALLBACK_COLORS",
      'providerPreference: "openai_first"',
      "lovableModel: HOROSCOPE_NEWS_MODEL",
      "allowLovableFallback: true",
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

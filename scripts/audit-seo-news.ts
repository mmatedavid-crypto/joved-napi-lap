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
    name: "horoscope fallback is publishable Hungarian copy, not provider error text",
    file: "src/lib/horoscopeNews.server.ts",
    includes: [
      "SIGN_FALLBACK_ARCHETYPE",
      "periodFocus",
      "Heti hangulat",
      "Havi irány",
      "Kapcsolatok",
      "Munka és ritmus",
      "FALLBACK_COLORS",
    ],
    excludes: [
      "A háttéradat most nem érhető el",
      "általános magyar tartalmat mutatunk",
      "provider error",
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

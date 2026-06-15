import { createFileRoute } from "@tanstack/react-router";
import { allHoroscopeArticlePaths } from "@/lib/horoscopeNews";
import { LIFE_PATH_NUMBERS } from "@/data/lifePathMeanings.hu";
import { CARDS } from "@/data/cards";
import { CHINESE_ANIMALS } from "@/data/chineseZodiac.hu";
import { HEXAGRAMS } from "@/data/ichingHexagrams.hu";
import { NUMEROLOGY_TYPES } from "@/data/numerologyTypes.hu";
import { getPublishedMagazinPosts } from "@/data/magazin.hu";
import { ANGEL_NUMBER_PAGES } from "@/lib/angel.hu";
import { SITE_LEGAL } from "@/lib/legal";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const SITEMAP_ORIGIN = SITE_LEGAL.siteUrl;

const STATIC_PATHS = [
  "/",
  "/mai-lap",
  "/harom-lap",
  "/randi-elott",
  "/dontes-elott",
  "/szammisztika",
  "/numerologia",
  "/osszeillunk",
  "/horoszkop",
  "/arak",
  "/mai-iranytu",
  "/angyalszam",
  "/angyalszam-jelentese",
  "/alomfejtes",
  "/alomfejtes-jelentes",
  "/kristaly",
  "/sorsszam-kalkulator",
  "/szerencseszamok",
  "/tarot-napi-lap",
  "/szemelyes-30-napos-horoszkop",
  "/eves-horoszkop",
  "/tranzitok",
  "/vedikus-asztrologia",
  "/szuletesi-keplet",
  "/tarot",
  "/kinai-horoszkop",
  "/jiking",
  "/magazin",
  "/rolunk",
  "/impresszum",
  "/aszf",
  "/adatkezelesi-tajekoztato",
  "/elallasi-tajekoztato",
] as const;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = SITEMAP_ORIGIN;
        const today = new Date().toISOString().slice(0, 10);
        const paths = [
          ...STATIC_PATHS.map((path) => ({ path, changefreq: "weekly", priority: "0.7" })),
          ...LIFE_PATH_NUMBERS.map((n) => ({
            path: `/sorsszam/${n}`,
            changefreq: "monthly",
            priority: "0.6",
          })),
          ...CARDS.map((card) => ({
            path: `/tarot/${card.id}`,
            changefreq: "monthly",
            priority: "0.7",
          })),
          ...ANGEL_NUMBER_PAGES.map((p) => ({
            path: `/angyalszam/${p.szam}`,
            changefreq: "monthly",
            priority: "0.7",
          })),
          ...CHINESE_ANIMALS.map((a) => ({
            path: `/kinai-horoszkop/${a.slug}`,
            changefreq: "monthly",
            priority: "0.7",
          })),
          ...HEXAGRAMS.map((h) => ({
            path: `/jiking/${h.slug}`,
            changefreq: "monthly",
            priority: "0.6",
          })),
          ...NUMEROLOGY_TYPES.map((t) => ({
            path: `/numerologia/${t.slug}`,
            changefreq: "monthly",
            priority: "0.7",
          })),
          ...getPublishedMagazinPosts().map((p) => ({
            path: `/magazin/${p.slug}`,
            changefreq: "monthly" as const,
            priority: "0.6",
          })),
          ...allHoroscopeArticlePaths().map(({ path, period }) => ({
            path,
            changefreq: period === "napi" ? "daily" : period === "heti" ? "weekly" : "monthly",
            priority: period === "napi" ? "0.8" : "0.6",
          })),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    (item) => `  <url>
    <loc>${xmlEscape(`${origin}${item.path}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;
        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
  component: () => null,
});

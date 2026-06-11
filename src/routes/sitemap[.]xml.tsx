import { createFileRoute } from "@tanstack/react-router";
import { allHoroscopeArticlePaths } from "@/lib/horoscopeNews";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function originFromRequest(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

const STATIC_PATHS = [
  "/",
  "/mai-lap",
  "/harom-lap",
  "/randi-elott",
  "/dontes-elott",
  "/szammisztika",
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
  "/tarot-napi-lap",
  "/szemelyes-30-napos-horoszkop",
  "/vedikus-asztrologia",
  "/rolunk",
  "/impresszum",
  "/aszf",
  "/adatkezelesi-tajekoztato",
  "/elallasi-tajekoztato",
] as const;

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = originFromRequest(request);
        const today = new Date().toISOString().slice(0, 10);
        const paths = [
          ...STATIC_PATHS.map((path) => ({ path, changefreq: "weekly", priority: "0.7" })),
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

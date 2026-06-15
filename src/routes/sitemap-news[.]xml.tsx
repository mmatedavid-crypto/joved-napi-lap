import { createFileRoute } from "@tanstack/react-router";
import { SITE_LEGAL } from "@/lib/legal";
import { horoscopeSeoTitle } from "@/lib/horoscopeNews";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const SITEMAP_ORIGIN = SITE_LEGAL.siteUrl;

export const Route = createFileRoute("/sitemap-news.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = SITEMAP_ORIGIN;
        const { getFreshPublishedHoroscopeNewsItems } = await import("@/lib/horoscopeNews.server");
        const urls = await getFreshPublishedHoroscopeNewsItems();
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(`${origin}/horoszkop/${u.article.period}/${u.article.signSlug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>Jövőd.hu</news:name>
        <news:language>hu</news:language>
      </news:publication>
      <news:publication_date>${u.publicationDate}</news:publication_date>
      <news:title>${xmlEscape(horoscopeSeoTitle(u.article.period, u.article.signName))}</news:title>
    </news:news>
  </url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
  component: () => null,
});

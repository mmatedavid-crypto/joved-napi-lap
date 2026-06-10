import { createFileRoute } from "@tanstack/react-router";
import { horoscopeSeoTitle } from "@/lib/horoscopeNews";

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

export const Route = createFileRoute("/sitemap-news.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = originFromRequest(request);
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

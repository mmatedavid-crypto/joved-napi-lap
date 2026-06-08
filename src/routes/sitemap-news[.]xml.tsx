import { createFileRoute } from "@tanstack/react-router";
import {
  PERIOD_LABEL,
  allHoroscopeArticlePaths,
  horoscopeSeoTitle,
  type HoroscopePeriodHU,
} from "@/lib/horoscopeNews";

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

function publicationDateFor(period: HoroscopePeriodHU): string {
  const now = new Date();
  if (period === "havi") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 6, 0, 0))
      .toISOString()
      .replace(".000Z", "+00:00");
  }
  if (period === "heti") {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0),
    );
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    return d.toISOString().replace(".000Z", "+00:00");
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0))
    .toISOString()
    .replace(".000Z", "+00:00");
}

export const Route = createFileRoute("/sitemap-news.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = originFromRequest(request);
        const urls = allHoroscopeArticlePaths();
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${xmlEscape(`${origin}${u.path}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>Jövőd.hu</news:name>
        <news:language>hu</news:language>
      </news:publication>
      <news:publication_date>${publicationDateFor(u.period)}</news:publication_date>
      <news:title>${xmlEscape(horoscopeSeoTitle(u.period, u.signName))}</news:title>
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

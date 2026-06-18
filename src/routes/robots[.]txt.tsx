import { createFileRoute } from "@tanstack/react-router";
import { SITE_LEGAL } from "@/lib/legal";

const SITEMAP_ORIGIN = SITE_LEGAL.siteUrl;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const origin = SITEMAP_ORIGIN;
        return new Response(
          [
            "User-agent: *",
            "Disallow: /api/",
            "Disallow: /dev/",
            "Disallow: /lovable/",
            "Disallow: /email/",
            "Disallow: /profil",
            "Disallow: /koszonjuk",
            "Disallow: /bejelentkezes",
            "Disallow: /unsubscribe",
            "Allow: /",
            `Sitemap: ${origin}/sitemap.xml`,
            `Sitemap: ${origin}/sitemap-news.xml`,
            "",
          ].join("\n"),
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          },
        );
      },
    },
  },
  component: () => null,
});

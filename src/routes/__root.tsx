import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SITE_LEGAL } from "../lib/legal";
import brandLogoAsset from "../assets/jovod-logo.png.asset.json";
import brandShareAsset from "../assets/jovod-share.png.asset.json";

const SITE_URL = SITE_LEGAL.siteUrl;
const BRAND_NAME = "Jövőd.hu";
const SITE_DESCRIPTION =
  "Magyar tarot, számmisztika, horoszkóp és önismereti olvasatok egy csendes napi rituáléhoz.";
const BRAND_LOGO_URL = `${SITE_URL}${brandLogoAsset.url}`;
const BRAND_OG_IMAGE_URL = `${SITE_URL}${brandShareAsset.url}`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Az oldal nem található</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Lehet, hogy a keresett oldal elköltözött, vagy már nem elérhető.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Ha rendelési linkről vagy elkészült olvasatból érkeztél, az olvasat nem vész el. Írj a
          vásárlási email címedről, és utánanézünk:{" "}
          <a
            className="font-medium text-primary hover:text-primary/80"
            href={`mailto:${SITE_LEGAL.supportEmail}`}
          >
            {SITE_LEGAL.supportEmail}
          </a>
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Vissza a főoldalra
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root route error", {
    error_code: "root_route_error",
  });
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Ez az oldal most nem töltött be
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Valami megakadt nálunk. A rendelésed vagy olvasatod ettől nem vész el; frissíts rá az
          oldalra, vagy térj vissza a főoldalra.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Újrapróbálom
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Főoldal
          </a>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Ha fizetés vagy elkészült olvasat közben akadtál el, ne indíts új fizetést. Írj a
          vásárlási email címedről, és utánanézünk:{" "}
          <a
            className="font-medium text-primary hover:text-primary/80"
            href={`mailto:${SITE_LEGAL.supportEmail}`}
          >
            {SITE_LEGAL.supportEmail}
          </a>
        </p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#181126" },
      { name: "application-name", content: BRAND_NAME },
      { name: "apple-mobile-web-app-title", content: BRAND_NAME },
      {
        name: "google-site-verification",
        content: "V36Zfy13SRBnVwyLGXY20HLeJOA9IbWsKDUC4l7rvX4",
      },
      { title: "Jövőd.hu — Húzz egy lapot, mielőtt döntesz" },
      {
        name: "description",
        content: SITE_DESCRIPTION,
      },
      { name: "author", content: "Jövőd.hu" },
      { property: "og:site_name", content: BRAND_NAME },
      { property: "og:title", content: "Jövőd.hu — Húzz egy lapot, mielőtt döntesz" },
      {
        property: "og:description",
        content: SITE_DESCRIPTION,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Jövőd.hu — Húzz egy lapot, mielőtt döntesz" },
      {
        name: "twitter:description",
        content: SITE_DESCRIPTION,
      },
      {
        property: "og:image",
        content: BRAND_OG_IMAGE_URL,
      },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1536" },
      { property: "og:image:height", content: "1024" },
      { property: "og:image:alt", content: "Jövőd.hu logó és márkakép" },
      {
        name: "twitter:image",
        content: BRAND_OG_IMAGE_URL,
      },
      {
        name: "twitter:image:alt",
        content: "Jövőd.hu logó és márkakép",
      },
    ],
    links: [
      { rel: "icon", href: brandLogoAsset.url, type: "image/png" },
      { rel: "apple-touch-icon", href: brandLogoAsset.url },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_LEGAL.operator.name,
          alternateName: BRAND_NAME,
          legalName: SITE_LEGAL.operator.name,
          url: SITE_URL,
          logo: BRAND_LOGO_URL,
          image: BRAND_OG_IMAGE_URL,
          taxID: SITE_LEGAL.operator.taxNumber,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Ady Endre utca 11.",
            postalCode: "2636",
            addressLocality: "Tésa",
            addressCountry: "HU",
          },
          email: SITE_LEGAL.supportEmail,
          sameAs: [],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: BRAND_NAME,
          alternateName: "Jövőd",
          url: SITE_URL,
          inLanguage: "hu-HU",
          description: SITE_DESCRIPTION,
          publisher: {
            "@type": "Organization",
            name: SITE_LEGAL.operator.name,
            alternateName: BRAND_NAME,
            logo: {
              "@type": "ImageObject",
              url: BRAND_LOGO_URL,
            },
          },
        }),
      },
      {
        src: "https://plausible.io/js/pa-jERW-QPOefpKPqQ3v5Mwk.js",
        async: true,
      },
      {
        children:
          "window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}

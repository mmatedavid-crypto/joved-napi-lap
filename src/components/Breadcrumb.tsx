import { Link } from "@tanstack/react-router";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const SITE_URL = "https://jovod.hu";

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Útvonal"
      className="mx-auto max-w-3xl px-4 md:px-6 pt-6 text-xs text-ivory/55"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-gold transition-colors">
            Főoldal
          </Link>
        </li>
        {items.map((item, idx) => (
          <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="text-ivory/35">
              ›
            </span>
            {item.href && idx < items.length - 1 ? (
              <Link to={item.href} className="hover:text-gold transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={idx === items.length - 1 ? "text-ivory/80" : ""}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  const list = [
    { "@type": "ListItem", position: 1, name: "Főoldal", item: SITE_URL },
    ...items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 2,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list,
  };
}
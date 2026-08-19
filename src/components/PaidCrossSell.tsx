import { Link } from "@tanstack/react-router";

type CrossSellItem = {
  to: string;
  title: string;
  text: string;
};

const DEFAULT_ITEMS: CrossSellItem[] = [
  {
    to: "/eves-horoszkop",
    title: "Éves horoszkóp",
    text: "Személyre szabott éves útiterv a születési adataidból.",
  },
  {
    to: "/tranzitok",
    title: "Személyes tranzitok",
    text: "A következő hónapok fontos időpontjai a te képletedre.",
  },
  {
    to: "/arak",
    title: "Minden olvasat és ár",
    text: "Nézd meg, milyen mélyebb olvasatokat kérhetsz.",
  },
];

export function PaidCrossSell({
  eyebrow = "Ha mélyebbre mennél",
  title = "Személyes olvasatok a saját képletedből",
  items = DEFAULT_ITEMS,
  className = "",
}: {
  eyebrow?: string;
  title?: string;
  items?: CrossSellItem[];
  className?: string;
}) {
  return (
    <section className={`surface p-5 md:p-7 ${className}`}>
      <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
        {eyebrow}
      </div>
      <h2 className="font-display text-2xl text-ivory mt-1">{title}</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-3 hover:border-gold/50 transition-colors"
          >
            <span className="block text-ivory/90">{item.title}</span>
            <span className="block text-xs text-ivory/55 mt-1 leading-relaxed">{item.text}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

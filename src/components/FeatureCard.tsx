import { Link } from "@tanstack/react-router";

function Icon({ name }: { name: string }) {
  const stroke = "currentColor";
  switch (name) {
    case "star":
      return (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke={stroke}
          strokeWidth="1.3"
        >
          <path d="M12 3l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6z" />
        </svg>
      );
    case "three":
      return (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke={stroke}
          strokeWidth="1.3"
        >
          <rect x="3" y="6" width="4" height="12" rx="1" />
          <rect x="10" y="6" width="4" height="12" rx="1" />
          <rect x="17" y="6" width="4" height="12" rx="1" />
        </svg>
      );
    case "heart":
      return (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke={stroke}
          strokeWidth="1.3"
        >
          <path d="M12 21s-7-4.5-9.5-9A5 5 0 0112 6a5 5 0 019.5 6c-2.5 4.5-9.5 9-9.5 9z" />
        </svg>
      );
    case "diamond":
      return (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke={stroke}
          strokeWidth="1.3"
        >
          <path d="M12 3l9 9-9 9-9-9z" />
        </svg>
      );
    case "num":
      return (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke={stroke}
          strokeWidth="1.3"
        >
          <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
        </svg>
      );
    case "rings":
      return (
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke={stroke}
          strokeWidth="1.3"
        >
          <circle cx="9" cy="13" r="6" />
          <circle cx="15" cy="13" r="6" />
        </svg>
      );
    default:
      return null;
  }
}

export function FeatureCard({
  to,
  title,
  desc,
  icon,
}: {
  to: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link
      to={to}
      className="surface p-5 group hover:border-[oklch(0.78_0.10_80/0.4)] transition-all block"
    >
      <div className="flex items-start gap-4">
        <div className="size-10 shrink-0 rounded-full border border-[oklch(0.78_0.10_80/0.4)] flex items-center justify-center text-gold">
          <Icon name={icon} />
        </div>
        <div className="flex-1">
          <div className="font-display text-lg text-ivory">{title}</div>
          <p className="font-editorial text-ivory/70 mt-1 leading-relaxed">{desc}</p>
          <div className="mt-3 text-[oklch(0.78_0.10_80/0.85)] text-sm group-hover:text-gold inline-flex items-center gap-1">
            Megnyitom <span aria-hidden>→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

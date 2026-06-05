import type { ReactNode } from "react";

export function Section({ title, children, eyebrow }: { title?: string; eyebrow?: string; children: ReactNode }) {
  return (
    <section className="surface p-5 md:p-7">
      {eyebrow && <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-2">{eyebrow}</div>}
      {title && <h2 className="font-display text-2xl md:text-3xl text-ivory mb-3">{title}</h2>}
      <div className="font-editorial text-ivory/85 text-lg leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <header className="text-center max-w-2xl mx-auto pt-12 pb-8 px-4">
      {eyebrow && <div className="text-[10px] tracking-[0.35em] uppercase text-[oklch(0.78_0.10_80/0.8)] mb-3">{eyebrow}</div>}
      <h1 className="font-display text-4xl md:text-5xl text-ivory leading-[1.1]">{title}</h1>
      {lead && <p className="font-editorial text-ivory/75 text-lg md:text-xl mt-4 leading-relaxed">{lead}</p>}
    </header>
  );
}
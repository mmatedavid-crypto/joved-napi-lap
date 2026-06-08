import type { ReactNode } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";

export function LegalPage({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <Layout>
      <PageHeader eyebrow={eyebrow} title={title} lead={lead} />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">{children}</div>
    </Layout>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <Section title={title}>{children}</Section>;
}

import { Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";

type FaqItem = {
  question: string;
  answer: string;
};

export function SeoLandingPage({
  eyebrow,
  title,
  lead,
  sections,
  ctaTo,
  ctaLabel,
  faq,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  sections: { title: string; text: string }[];
  ctaTo: string;
  ctaLabel: string;
  faq?: FaqItem[];
}) {
  return (
    <Layout>
      <PageHeader eyebrow={eyebrow} title={title} lead={lead} />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        {sections.map((section) => (
          <Section key={section.title} title={section.title}>
            <p>{section.text}</p>
          </Section>
        ))}
        <div className="surface p-5 md:p-7 text-center">
          <Link to={ctaTo} className="btn-gold">
            {ctaLabel}
          </Link>
        </div>
        {faq && (
          <Section title="Gyakori kérdések">
            {faq.map((item) => (
              <div key={item.question}>
                <h2 className="font-display text-xl text-ivory">{item.question}</h2>
                <p>{item.answer}</p>
              </div>
            ))}
          </Section>
        )}
      </div>
    </Layout>
  );
}

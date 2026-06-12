import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { Breadcrumb, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { CHINESE_ANIMALS, findAnimalByDate, type ChineseCalcResult } from "@/data/chineseZodiac.hu";

const SITE_URL = "https://jovod.hu";
const TITLE = "Kínai horoszkóp — 12 állatöv jelentése magyarul";
const DESCRIPTION =
  "Kínai zodiákus magyarul: patkány, bivaly, tigris, nyúl, sárkány, kígyó, ló, kecske, majom, kakas, kutya, disznó. Jellem, szerelem, karrier, kompatibilitás és születési évek.";

export const Route = createFileRoute("/kinai-horoszkop/")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Jövőd.hu` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/kinai-horoszkop` },
    ],
    links: [{ rel: "canonical", href: "/kinai-horoszkop" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ label: "Kínai horoszkóp", href: "/kinai-horoszkop" }]),
        ),
      },
    ],
  }),
  component: ChineseHubPage,
});

function ChineseHubPage() {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [result, setResult] = useState<ChineseCalcResult | null>(null);
  const [calcErr, setCalcErr] = useState<string | null>(null);

  function calculate(e: React.FormEvent) {
    e.preventDefault();
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!y || !m || !d) {
      setCalcErr("Add meg a teljes születési dátumod (év, hónap, nap).");
      setResult(null);
      return;
    }
    const r = findAnimalByDate(y, m, d);
    if (!r) {
      setCalcErr("Érvényes dátumot adj meg 1920 és 2033 között.");
      setResult(null);
      return;
    }
    setCalcErr(null);
    setResult(r);
  }

  return (
    <Layout>
      <Breadcrumb items={[{ label: "Kínai horoszkóp", href: "/kinai-horoszkop" }]} />
      <PageHeader
        eyebrow="Kínai zodiákus"
        title="Kínai horoszkóp — 12 állatöv magyarul"
        lead="A kínai állatöv minden jegye egy energiát képvisel. Az alábbi listából megnyithatod a saját jegyedet, és elolvashatod a jellemzőit, szerelmi mintáit, karrieres alkatát és a kompatibilis jegyeket."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-5">
        <section className="surface p-5 md:p-7">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            Kalkulátor
          </div>
          <h2 className="font-display text-2xl text-ivory">Melyik kínai jegy vagyok?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ivory/62">
            Add meg a születési dátumod — a kínai újév pontos dátumát is figyelembe vesszük, így a
            januári-februári születésnél is a helyes jegyet kapod.
          </p>
          <form onSubmit={calculate} className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
            <label className="block">
              <span className="block text-xs text-ivory/55 mb-1">Év</span>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1985"
                inputMode="numeric"
                className="w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-3 py-2.5 text-ivory text-center tabular-nums focus:border-gold outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-ivory/55 mb-1">Hónap</span>
              <input
                value={month}
                onChange={(e) => setMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="2"
                inputMode="numeric"
                className="w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-3 py-2.5 text-ivory text-center tabular-nums focus:border-gold outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs text-ivory/55 mb-1">Nap</span>
              <input
                value={day}
                onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="11"
                inputMode="numeric"
                className="w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-3 py-2.5 text-ivory text-center tabular-nums focus:border-gold outline-none"
              />
            </label>
            <div className="col-span-3">
              <button className="btn-gold w-full sm:w-auto">Megnézem a jegyem</button>
            </div>
          </form>
          {calcErr && <p className="mt-3 text-sm text-gold">{calcErr}</p>}
          {result && (
            <div className="mt-5 rounded-md border border-gold/30 p-4 text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)]">
                A jegyed
              </div>
              <div className="font-display text-3xl text-ivory mt-1">{result.animal.name}</div>
              <div className="mt-1 text-sm text-ivory/60">
                {result.animal.element} · {result.animal.yinYang === "jang" ? "Jang" : "Jin"} ·{" "}
                {result.zodiacYear}. állatövi év
              </div>
              {result.adjustedForNewYear && (
                <p className="mt-2 text-xs text-ivory/50">
                  A születésnapod az adott évi kínai újév előtt van, ezért az előző állatövi év
                  jegye érvényes rád.
                </p>
              )}
              <Link
                to="/kinai-horoszkop/$animal"
                params={{ animal: result.animal.slug }}
                className="btn-gold mt-4 inline-block"
              >
                {result.animal.name} teljes jellemzése
              </Link>
            </div>
          )}
        </section>
        <Section title="Hogyan találom meg a jegyemet?">
          <p>
            A kínai zodiákus a holdnaptár szerinti születési évhez köti az állatövi jegyet. Ha január vagy február elején születtél, érdemes ellenőrizni a pontos kínai újév dátumát abban az évben, mert nem a január 1-jei évváltáshoz, hanem a kínai újévhez (általában január 21. és február 21. között) igazodik.
          </p>
        </Section>
        <section className="surface p-5 md:p-7">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-3">
            12 állatöv
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {CHINESE_ANIMALS.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/kinai-horoszkop/$animal"
                  params={{ animal: a.slug }}
                  className="block rounded-md border border-[oklch(0.78_0.10_80/0.18)] px-3 py-2 hover:text-gold hover:border-gold/50 transition-colors"
                >
                  <span className="block text-ivory/85">{a.name}</span>
                  <span className="block text-xs text-ivory/50 mt-0.5">{a.element}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
}
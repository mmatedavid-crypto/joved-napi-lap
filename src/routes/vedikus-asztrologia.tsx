import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { HUDateInput } from "@/components/HUDateInput";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";

type AreaKey = "szerelem" | "munka" | "penz" | "altalanos";

const AREA_OPTIONS: { value: AreaKey; label: string; hint: string }[] = [
  { value: "szerelem", label: "Szerelem / párkapcsolat (kama)", hint: "Kapcsolatok, vonzódás" },
  { value: "munka", label: "Munka / karrier (artha)", hint: "Hivatás, váltás, projekt" },
  { value: "penz", label: "Pénz / döntések (artha)", hint: "Anyagi biztonság, befektetés" },
  { value: "altalanos", label: "Általános (dharma–moksha egyensúly)", hint: "Teljes életkép" },
];

export const Route = createFileRoute("/vedikus-asztrologia")({
  head: () => ({
    meta: [
      { title: "Védikus asztrológia – teljes elemzés a születési képletedből | Jövőd.hu" },
      {
        name: "description",
        content:
          "Védikus (sziderikus) asztrológiai elemzés magyarul: Lagna, Hold-rashi, nakshatra, dharma, artha, kama, moksha. 1990 Ft.",
      },
    ],
    links: [{ rel: "canonical", href: "/vedikus-asztrologia" }],
  }),
  component: Page,
});

function Page() {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [area, setArea] = useState<AreaKey>("altalanos");
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [paywall, setPaywall] = useState(false);

  const canSubmit = Boolean(birthDate && birthPlace.trim().length >= 2);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPaywall(true);
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Védikus asztrológia"
        title="Védikus asztrológia – teljes elemzés"
        lead="Sziderikus (indiai) szemlélet: Lagna, Hold-rashi és nakshatra. A karma itt nem büntetés, hanem visszatérő minta — ezt nézzük meg a te képletedben."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-8">
        <form onSubmit={onSubmit} className="surface p-6 space-y-5">
          <HUDateInput
            label="Születési dátumod"
            required
            value={birthDate}
            onChange={setBirthDate}
          />

          <div>
            <label htmlFor="birth-time" className="block text-sm text-ivory/80 mb-2">
              Születési idő (a Lagna miatt fontos)
            </label>
            <input
              id="birth-time"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none"
            />
            <p className="text-xs text-ivory/50 mt-2 font-editorial">
              Ha nem tudod, hagyd üresen — Hold-rashi és nakshatra akkor is számolható, csak a Lagna
              (aszcendens) lesz pontatlan.
            </p>
          </div>

          <div>
            <label htmlFor="birth-place" className="block text-sm text-ivory/80 mb-2">
              Születési hely / város <span className="text-gold">*</span>
            </label>
            <input
              id="birth-place"
              required
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              placeholder="Pl. Budapest"
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
          </div>

          <div>
            <label htmlFor="person-name" className="block text-sm text-ivory/80 mb-2">
              Neved (opcionális)
            </label>
            <input
              id="person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahogy a riportban szólítsunk"
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="block text-sm text-ivory/80 mb-1">
              Melyik életterületre fókuszáljunk?
            </legend>
            {AREA_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-start gap-3 p-3 rounded-md border border-[oklch(0.78_0.10_80/0.18)] cursor-pointer text-sm text-ivory/80 hover:border-gold/40"
              >
                <input
                  type="radio"
                  name="area"
                  value={opt.value}
                  checked={area === opt.value}
                  onChange={() => setArea(opt.value)}
                  className="mt-1"
                />
                <span>
                  {opt.label}
                  <span className="block text-xs text-ivory/45 mt-0.5">{opt.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div>
            <label htmlFor="user-question" className="block text-sm text-ivory/80 mb-2">
              Rövid kérdés (opcionális, max 240 karakter)
            </label>
            <textarea
              id="user-question"
              value={question}
              maxLength={240}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pl. Mi a karmikus mintám a kapcsolataimban?"
              rows={3}
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
          </div>

          <button type="submit" disabled={!canSubmit} className="btn-gold w-full">
            {productCtaLabel("Kérem a védikus elemzést", "vedic_full")}
          </button>
          <p className="text-[11px] text-ivory/45 text-center font-editorial">
            Fizetés után a vállalt elkészülési időn belül itt és emailben is eléred a riportot.
          </p>
        </form>

        <section className="rounded-md border border-gold/15 bg-black/10 p-5 md:p-7 space-y-3 text-sm leading-relaxed text-ivory/72">
          <h2 className="font-display text-2xl text-ivory">Mit kapsz?</h2>
          <ul className="space-y-2">
            <li>• Lagna, Nap-rashi, Hold-rashi és nakshatra megnevezése</li>
            <li>• A Hold-jegy és a nakshatra üzenete</li>
            <li>• Dharma – élethivatás iránya</li>
            <li>• Artha – munka, anyagi biztonság</li>
            <li>• Kama – szerelem, kapcsolatok</li>
            <li>• Moksha – belső út, elengedés</li>
            <li>• A választott életterületed mélyebben + karmikus mintázat</li>
          </ul>
          <p className="text-xs text-ivory/55">
            A jegyek és nakshatra számítása sziderikus (Lahiri ayanamsa). A riport a saját
            adataidból készül — nem általános szöveg.
          </p>
        </section>
      </div>

      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="vedic_full"
        sourceRoute="/vedikus-asztrologia"
        inputPayload={{
          birthDate,
          birthTime: birthTime || null,
          birthPlace: birthPlace.trim(),
          area,
          question: question.trim() || null,
          name: name.trim() || null,
        }}
      />
    </Layout>
  );
}

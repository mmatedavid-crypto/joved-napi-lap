import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageHeader } from "@/components/Section";
import { HUDateInput } from "@/components/HUDateInput";
import { PaywallDialog } from "@/components/PaywallDialog";
import { productCtaLabel } from "@/lib/products";

type AreaKey = "szerelem" | "munka" | "penz" | "altalanos";

const AREA_OPTIONS: { value: AreaKey; label: string; hint: string }[] = [
  { value: "szerelem", label: "Szerelem / párkapcsolat", hint: "Randi, ex, hosszú táv" },
  { value: "munka", label: "Munka / karrier", hint: "Váltás, projekt, főnök" },
  { value: "penz", label: "Pénz / döntések", hint: "Költés, befektetés, váltás" },
  { value: "altalanos", label: "Általános", hint: "Minden életterület egyformán" },
];

export const Route = createFileRoute("/szemelyes-30-napos-horoszkop")({
  head: () => ({
    meta: [
      { title: "A következő 30 napod térképe — személyes asztrológiai riport | Jövőd.hu" },
      {
        name: "description",
        content:
          "Személyes 30 napos előrejelzés a saját születési képletedből: szerelem, munka, döntések. 1490 Ft.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "/szemelyes-30-napos-horoszkop" }],
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
        eyebrow="Személyes asztrológia"
        title="A következő 30 napod térképe"
        lead="Egy riport a saját születési képletedről és a következő 30 nap legfontosabb időablakairól. Nem általános horoszkóp."
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
              Születési idő (opcionális)
            </label>
            <input
              id="birth-time"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none"
            />
            <p className="text-xs text-ivory/50 mt-2 font-editorial">
              Ha nem tudod pontosan, hagyd üresen. 12:00-val közelítünk, és a riportban jelezzük.
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
              placeholder="Pl. Most válthatok-e munkahelyet?"
              rows={3}
              className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
          </div>

          <button type="submit" disabled={!canSubmit} className="btn-gold w-full">
            {productCtaLabel("Kérem a 30 napos térképemet", "personal_30_day")}
          </button>
          <p className="text-[11px] text-ivory/45 text-center font-editorial">
            Fizetés után pár percen belül kézhez kapod a riportot ezen az oldalon és emailben is.
          </p>
        </form>

        <section className="rounded-md border border-gold/15 bg-black/10 p-5 md:p-7 space-y-3 text-sm leading-relaxed text-ivory/72">
          <h2 className="font-display text-2xl text-ivory">Mit kapsz?</h2>
          <ul className="space-y-2">
            <li>• A következő 30 napod fő témája</li>
            <li>• Születési képleted rövid összefoglalója</li>
            <li>• Legfontosabb időablakok az időszakban</li>
            <li>• Szerelem / munka / pénz-döntés bontás</li>
            <li>• Mire figyelj és záró üzenet</li>
          </ul>
          <p className="text-xs text-ivory/55">
            A riport a saját születési adataidból és a következő 30 nap tranzitjaiból készül. Nem
            általános horoszkóp: a személyes képleted és az előtted álló időszak találkozását
            értelmezi közérthetően.
          </p>
        </section>
      </div>

      <PaywallDialog
        open={paywall}
        onOpenChange={setPaywall}
        productSlug="personal_30_day"
        sourceRoute="/szemelyes-30-napos-horoszkop"
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

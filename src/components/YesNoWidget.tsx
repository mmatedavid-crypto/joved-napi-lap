import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { aiTarotYesNoHU, type TarotYesNoHU } from "@/lib/roxyTranslate.functions";

// Egyszerű igen/nem/talán mini-widget a főoldalra. A Roxy /tarot/yes-no
// végpontot használja a roxyTranslate.functions.ts magyarító rétegén át.
export function YesNoWidget() {
  const ask = useServerFn(aiTarotYesNoHU);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reading, setReading] = useState<TarotYesNoHU | null>(null);

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (question.length < 4) {
      setErr("Fogalmazd meg a kérdést egy mondatban.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const seed = `yesno:${Date.now()}:${Math.floor(Math.random() * 1_000_000)}`.slice(0, 60);
      const r = await ask({ data: { question, seed } });
      if (!r.ok || !r.reading) {
        setErr(r.message ?? "Most nem érkezett válasz.");
        return;
      }
      setReading(r.reading);
    } finally {
      setBusy(false);
    }
  }

  const answerLabel =
    reading?.answer === "igen" ? "Igen" : reading?.answer === "nem" ? "Nem" : "Talán";
  const answerTone =
    reading?.answer === "igen"
      ? "text-emerald-300"
      : reading?.answer === "nem"
        ? "text-rose-300"
        : "text-gold";

  return (
    <section className="mx-auto max-w-3xl px-4 md:px-6 pb-10">
      <div className="surface p-5 md:p-6">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.75)]">
          Igen / Nem kérdés
        </div>
        <h2 className="font-display text-xl md:text-2xl text-ivory mt-1">
          Egy kérdés — egy lap.
        </h2>
        <p className="font-editorial text-sm text-ivory/65 mt-1">
          Kérdezz egyértelműen, eldöntendő formában. A lap nem ígér biztos jövőt — irányt mutat.
        </p>

        {!reading && (
          <form onSubmit={onAsk} className="mt-4 flex flex-col md:flex-row gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={240}
              placeholder="Pl. Írjak neki ma?"
              aria-label="Igen/nem kérdés"
              className="flex-1 bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
            />
            <button className="btn-gold" disabled={busy}>
              {busy ? "Húzás…" : "Húzom a lapot"}
            </button>
          </form>
        )}
        {err && <p className="text-sm text-rose-200/80 mt-3">{err}</p>}

        {reading && (
          <div className="mt-5 space-y-3">
            <div className="flex items-baseline gap-3">
              <div className={`font-display text-4xl ${answerTone}`}>{answerLabel}</div>
              {reading.strength && (
                <div className="text-xs uppercase tracking-[0.25em] text-ivory/55">
                  {reading.strength} jel
                </div>
              )}
            </div>
            <div className="text-sm text-ivory/75">
              <span className="text-ivory/55">A lap: </span>
              <span className="text-ivory">
                {reading.card.name}
                {reading.card.reversed ? " (fordított)" : ""}
              </span>
            </div>
            <p className="font-editorial text-ivory/85 leading-relaxed">{reading.interpretation}</p>
            <button
              type="button"
              className="btn-ghost-gold"
              onClick={() => {
                setReading(null);
                setQ("");
              }}
            >
              Új kérdés
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
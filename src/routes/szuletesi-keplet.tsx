import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Layout } from "@/components/Layout";
import { PageHeader, Section } from "@/components/Section";
import { HUDateInput } from "@/components/HUDateInput";
import { roxyLocationSearch } from "@/lib/roxy.functions";
import { aiNatalChartHU, type NatalChartHU } from "@/lib/roxyTranslate.functions";

export const Route = createFileRoute("/szuletesi-keplet")({
  head: () => ({
    meta: [
      { title: "Születési képlet — natal chart magyarul | Jövőd.hu" },
      {
        name: "description",
        content:
          "Készítsd el a születési képletedet: Nap, Hold, Aszcendens és a fő bolygók magyar olvasata. Csendes, alapos, ítélkezés nélküli.",
      },
      { property: "og:title", content: "Születési képlet magyarul — Jövőd.hu" },
      {
        property: "og:description",
        content: "Nap, Hold, Aszcendens és bolygók magyar olvasata a születési adataidból.",
      },
    ],
    links: [{ rel: "canonical", href: "/szuletesi-keplet" }],
  }),
  component: Page,
});

type City = {
  city: string;
  province?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA
};

function parseCities(payload: unknown): City[] {
  if (!payload || typeof payload !== "object") return [];
  const raw = (payload as { cities?: unknown }).cities;
  if (!Array.isArray(raw)) return [];
  const out: City[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const o = c as Record<string, unknown>;
    const lat = Number(o.latitude);
    const lon = Number(o.longitude);
    const tz = typeof o.timezone === "string" ? o.timezone : "";
    const city = typeof o.city === "string" ? o.city : "";
    if (!city || !tz || Number.isNaN(lat) || Number.isNaN(lon)) continue;
    out.push({
      city,
      province: typeof o.province === "string" ? o.province : undefined,
      country: typeof o.country === "string" ? o.country : undefined,
      latitude: lat,
      longitude: lon,
      timezone: tz,
    });
  }
  return out.slice(0, 8);
}

function cityLabel(c: City): string {
  return [c.city, c.province, c.country].filter(Boolean).join(", ");
}

function Page() {
  const searchLoc = useServerFn(roxyLocationSearch);
  const getChart = useServerFn(aiNatalChartHU);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [q, setQ] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [chosen, setChosen] = useState<City | null>(null);
  const [searching, setSearching] = useState(false);
  const [chart, setChart] = useState<NatalChartHU | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lastQRef = useRef("");

  useEffect(() => {
    if (chosen) return;
    const v = q.trim();
    if (v.length < 2) {
      setCities([]);
      return;
    }
    lastQRef.current = v;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchLoc({ data: { q: v } });
        if (lastQRef.current !== v) return;
        if (r.ok) setCities(parseCities(r.data));
        else setCities([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q, chosen, searchLoc]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!date) {
      setErr("Add meg a születési dátumot.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setErr("Add meg a születési időt (ÓÓ:PP).");
      return;
    }
    if (!chosen) {
      setErr("Válassz egy várost a listából.");
      return;
    }
    setBusy(true);
    try {
      const r = await getChart({
        data: {
          date,
          time,
          latitude: chosen.latitude,
          longitude: chosen.longitude,
          timezone: chosen.timezone,
          placeLabel: cityLabel(chosen),
        },
      });
      if (!r.ok || !r.reading) {
        setErr(r.message ?? "A képletet most nem sikerült elkészíteni.");
        return;
      }
      setChart(r.reading);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Születési képlet"
        title="Nap, Hold, Aszcendens — magyarul"
        lead="A bolygóid pillanatfelvétele a születésed percében. Csendes, alapos olvasat."
      />
      <div className="mx-auto max-w-3xl px-4 md:px-6 pb-20 space-y-8">
        {!chart && (
          <form onSubmit={onSubmit} className="surface p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <HUDateInput label="Születési dátum" value={date} onChange={setDate} />
              <div>
                <label htmlFor="natal-time" className="block text-sm text-ivory/80 mb-2">
                  Születési idő (ÓÓ:PP)
                </label>
                <input
                  id="natal-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none"
                />
                <p className="text-xs text-ivory/50 mt-1">
                  Ha nem tudod pontosan, a 12:00 használható közelítésként.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="natal-place" className="block text-sm text-ivory/80 mb-2">
                Születési hely
              </label>
              <input
                id="natal-place"
                value={chosen ? cityLabel(chosen) : q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (chosen) setChosen(null);
                }}
                placeholder="Pl. Budapest"
                autoComplete="off"
                className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
              />
              {!chosen && cities.length > 0 && (
                <div className="mt-2 border border-[oklch(0.78_0.10_80/0.18)] rounded-md overflow-hidden">
                  {cities.map((c, i) => (
                    <button
                      type="button"
                      key={`${c.city}-${c.latitude}-${i}`}
                      onClick={() => {
                        setChosen(c);
                        setCities([]);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-ivory/85 hover:bg-[oklch(0.78_0.10_80/0.08)] border-b border-[oklch(0.78_0.10_80/0.1)] last:border-b-0"
                    >
                      {cityLabel(c)}
                      <span className="text-ivory/45 text-xs ml-2">({c.timezone})</span>
                    </button>
                  ))}
                </div>
              )}
              {!chosen && q.trim().length >= 2 && cities.length === 0 && !searching && (
                <p className="text-xs text-ivory/50 mt-2">
                  Nincs találat. Próbálj másik írásmódot.
                </p>
              )}
              {searching && <p className="text-xs text-ivory/50 mt-2">Keresés…</p>}
            </div>

            <button className="btn-gold" disabled={busy}>
              {busy ? "Készítjük a képletet…" : "Képlet elkészítése"}
            </button>
            {err && <p className="text-sm text-rose-200/80">{err}</p>}
          </form>
        )}

        {chart && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-3 gap-3">
              <PlanetCard
                title="Nap"
                sign={chart.sun.signHu}
                house={chart.sun.house}
                line={chart.sun.oneLine}
              />
              <PlanetCard
                title="Hold"
                sign={chart.moon.signHu}
                house={chart.moon.house}
                line={chart.moon.oneLine}
              />
              {chart.ascendant && (
                <PlanetCard
                  title="Aszcendens"
                  sign={chart.ascendant.signHu}
                  house={chart.ascendant.house}
                  line={chart.ascendant.oneLine}
                />
              )}
            </div>

            <Section eyebrow="A képleted röviden">{chart.summary}</Section>

            {chart.oneLine && (
              <Section eyebrow="Egy mondatban">
                <em>{chart.oneLine}</em>
              </Section>
            )}

            {chart.others.length > 0 && (
              <div className="grid md:grid-cols-2 gap-3">
                {chart.others.map((p) => (
                  <PlanetCard
                    key={p.key}
                    title={p.nameHu}
                    sign={p.signHu}
                    house={p.house}
                    line={p.oneLine}
                  />
                ))}
              </div>
            )}

            <div className="text-center">
              <button
                className="btn-ghost-gold"
                onClick={() => {
                  setChart(null);
                }}
              >
                Új képlet
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function PlanetCard({
  title,
  sign,
  house,
  line,
}: {
  title: string;
  sign: string;
  house?: number;
  line?: string;
}) {
  return (
    <div className="surface p-4">
      <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.75)]">
        {title}
      </div>
      <div className="font-display text-xl text-ivory mt-1">
        {sign}
        {typeof house === "number" ? (
          <span className="text-ivory/55 text-base"> · {house}. ház</span>
        ) : null}
      </div>
      {line && <p className="font-editorial text-sm text-ivory/75 mt-2 leading-relaxed">{line}</p>}
    </div>
  );
}

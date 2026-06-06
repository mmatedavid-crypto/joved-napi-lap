import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SpreadDeck } from "./SpreadDeck";
import { HUDateInput } from "./HUDateInput";
import { CardFace } from "./TarotCard";
import { CARDS, type TarotCard } from "@/data/cards";
import { loadLocal, saveLocal, todayKey } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import {
  roxyNumerologyChart,
  roxyNumerologyCompatibility,
} from "@/lib/roxy.functions";
import {
  normalizeRoxyChart,
  normalizeRoxyCompat,
  type RoxyChart,
  type RoxyCompat,
} from "@/lib/roxyNormalize";
import {
  compatPairMeaning,
  compatibilityScore,
  lifePath,
  lifePathInfo,
  personalYear,
  relationshipNumber,
  threeCardSynthesis,
} from "@/lib/numerology";

type Mode = "mai" | "harom" | "randi" | "dontes" | "szam" | "osszeillunk";

const TABS: { id: Mode; label: string; short: string }[] = [
  { id: "mai", label: "Mai lap", short: "Mai" },
  { id: "harom", label: "3 lapos húzás", short: "3 lap" },
  { id: "randi", label: "Randi előtt", short: "Randi" },
  { id: "dontes", label: "Döntés előtt", short: "Döntés" },
  { id: "szam", label: "Sorsszám", short: "Sorsszám" },
  { id: "osszeillunk", label: "Összeillünk?", short: "Összeillés" },
];

export function RitualTable() {
  const [mode, setMode] = useState<Mode>("mai");

  return (
    <div>
      {/* Tabs */}
      <div className="px-2 py-1 mb-0 overflow-x-auto">
        <div className="flex gap-1 min-w-max md:justify-center">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`px-3 md:px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors ${
                mode === t.id
                  ? "bg-[oklch(0.78_0.10_80/0.18)] text-gold border border-[oklch(0.78_0.10_80/0.4)]"
                  : "text-ivory/70 hover:text-ivory border border-transparent"
              }`}
              aria-pressed={mode === t.id}
            >
              <span className="md:hidden">{t.short}</span>
              <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={mode === "mai" || mode === "harom" ? "pt-0" : "surface p-4 md:p-7"}>
        {mode === "mai" && <MaiLapInline />}
        {mode === "harom" && <HaromLapInline />}
        {mode === "randi" && <RandiInline />}
        {mode === "dontes" && <DontesInline />}
        {mode === "szam" && <SzamInline />}
        {mode === "osszeillunk" && <OsszeillunkInline />}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] tracking-[0.3em] uppercase text-[oklch(0.78_0.10_80/0.7)] mb-1">
      {children}
    </div>
  );
}

function Block({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[oklch(0.78_0.10_80/0.12)] pt-4">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="font-editorial text-ivory/90 text-[17px] leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Mai lap ─────────────────────────────────────────────────

type Daily = { date: string; cardId: string };

function MaiLapInline() {
  const [card, setCard] = useState<TarotCard | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const stored = loadLocal<Daily>("daily");
    if (stored && stored.date === todayKey()) {
      const c = CARDS.find((x) => x.id === stored.cardId) ?? null;
      if (c) { setCard(c); setLocked(true); }
    }
    trackEvent("daily_card_started");
  }, []);

  return (
    <div>
      {!card && (
        <>
          <SpreadDeck
            count={1}
            onComplete={(cards) => {
              const c = cards[0];
              setCard(c);
              setLocked(true);
              saveLocal<Daily>("daily", { date: todayKey(), cardId: c.id });
              trackEvent("daily_card_revealed", { cardId: c.id });
            }}
          />
        </>
      )}
      {card && (
        <CardResult
          card={card}
          eyebrow="A mai lapod"
          sections={[
            { title: "Mit üzen ma?", text: card.general },
            { title: "Mire figyelj?", text: card.warning },
          ]}
          oneLiner={card.daily}
          footer={
            locked ? (
              <p className="text-xs text-ivory/45 font-editorial">
                A mai lapod megérkezett. Holnap jön a következő.
              </p>
            ) : null
          }
        />
      )}
    </div>
  );
}

// ─── 3 lapos ─────────────────────────────────────────────────

function HaromLapInline() {
  const [cards, setCards] = useState<TarotCard[] | null>(null);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => { trackEvent("three_card_started"); }, [resetKey]);
  return (
    <div>
      {!cards && (
        <>
          <div className="text-center mb-2">
            <Eyebrow>3 lapos húzás · Múlt · Jelen · Jövő</Eyebrow>
          </div>
          <SpreadDeck
            count={3}
            slotLabels={["Múlt", "Jelen", "Jövő"]}
            resetKey={resetKey}
            onComplete={(c) => { setCards(c); trackEvent("three_card_completed", { ids: c.map(x => x.id) }); }}
          />
        </>
      )}
      {cards && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Eyebrow>A te három lapod</Eyebrow>
            <button
              className="text-xs text-ivory/55 hover:text-gold"
              onClick={() => { setCards(null); setResetKey((k) => k + 1); }}
            >
              Új húzás
            </button>
          </div>
          <Block eyebrow="Múlt — honnan jön ez a helyzet?">{cards[0].general}</Block>
          <Block eyebrow="Jelen — mi történik most valójában?">{cards[1].general}</Block>
          <Block eyebrow="Jövő — merre mozdulhat?">{cards[2].general}</Block>
          <Block eyebrow="A három lap együtt">
            {threeCardSynthesis(cards[0].keywords[0], cards[1].keywords[0], cards[2].keywords[0])}
          </Block>
          <Block eyebrow="Egy mondatban az üzenet"><em>{cards[2].daily}</em></Block>
        </div>
      )}
    </div>
  );
}

// ─── Randi ───────────────────────────────────────────────────

const SITS = ["randi előtt", "nem ír vissza", "most ismerkedünk", "ex / visszatérő történet", "randi után"];

function RandiInline() {
  const [sit, setSit] = useState(SITS[0]);
  const [started, setStarted] = useState(false);
  const [card, setCard] = useState<TarotCard | null>(null);

  if (!started) {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => { e.preventDefault(); setStarted(true); trackEvent("dating_reading_started", { situation: sit }); }}
      >
        <Eyebrow>Randi előtt</Eyebrow>
        <h2 className="font-display text-2xl text-ivory">Egy lap a kapcsolatról</h2>
        <div>
          <label className="block text-sm text-ivory/80 mb-2">A helyzet</label>
          <select value={sit} onChange={(e) => setSit(e.target.value)} className={selectCls}>
            {SITS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn-gold">Megyek a pakliért</button>
      </form>
    );
  }

  if (!card) {
    return (
      <div>
        <Eyebrow>Helyzet: {sit}</Eyebrow>
        <h2 className="font-display text-2xl text-ivory mb-4">Válassz egy lapot</h2>
        <SpreadDeck count={1} onComplete={(c) => { setCard(c[0]); trackEvent("dating_reading_revealed", { cardId: c[0].id, situation: sit }); }} />
      </div>
    );
  }

  return (
    <CardResult
      card={card}
      eyebrow={`Randi előtt · ${sit}`}
      sections={[
        { title: "Mit mond a lap a kapcsolatról?", text: card.love },
        { title: "Mire figyelj?", text: card.warning },
      ]}
      oneLiner={card.daily}
      footer={
        <div className="flex flex-wrap gap-2 mt-2">
          <button className="btn-ghost-gold" onClick={() => { setCard(null); setStarted(false); }}>
            Új húzás
          </button>
          <Link to="/randi-elott" className="btn-ghost-gold" onClick={() => trackEvent("detailed_reading_cta_clicked", { from: "randi" })}>Részletes olvasat →</Link>
        </div>
      }
    />
  );
}

// ─── Döntés ──────────────────────────────────────────────────

function DontesInline() {
  const [q, setQ] = useState("");
  const [started, setStarted] = useState(false);
  const [card, setCard] = useState<TarotCard | null>(null);

  if (!started) {
    return (
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStarted(true); trackEvent("decision_reading_started", { hasQuestion: !!q }); }}>
        <Eyebrow>Döntés előtt</Eyebrow>
        <h2 className="font-display text-2xl text-ivory">Egy lap, mielőtt cselekszel</h2>
        <div>
          <label className="block text-sm text-ivory/80 mb-2">A helyzet röviden <span className="text-ivory/45">(opcionális)</span></label>
          <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3}
            placeholder="Pl. Elfogadjam-e az új állást?" className={inpCls} />
        </div>
        <button className="btn-gold">Húzom a lapot</button>
      </form>
    );
  }

  if (!card) {
    return (
      <div>
        {q && <p className="text-sm text-ivory/55 font-editorial italic mb-3">A kérdésed: „{q}"</p>}
        <SpreadDeck count={1} onComplete={(c) => { setCard(c[0]); trackEvent("decision_reading_revealed", { cardId: c[0].id }); }} />
      </div>
    );
  }

  return (
    <CardResult
      card={card}
      eyebrow={q ? `Kérdés: „${q}"` : "Döntés előtt"}
      sections={[
        { title: "A lap üzenete", text: card.decision },
        { title: "Amit most nem látsz tisztán", text: card.warning },
      ]}
      oneLiner={card.daily}
      footer={
        <div className="flex flex-wrap gap-2 mt-2">
          <button className="btn-ghost-gold" onClick={() => { setCard(null); setStarted(false); setQ(""); }}>
            Új kérdés
          </button>
          <Link to="/dontes-elott" className="btn-ghost-gold" onClick={() => trackEvent("detailed_reading_cta_clicked", { from: "dontes" })}>Részletes olvasat →</Link>
        </div>
      }
    />
  );
}

// ─── Sorsszám ────────────────────────────────────────────────

function SzamInline() {
  const [dob, setDob] = useState("");
  const [name, setName] = useState("");
  const [res, setRes] = useState<number | null>(null);
  const [roxy, setRoxy] = useState<RoxyChart | null>(null);
  const [roxyYear, setRoxyYear] = useState<number | null>(null);

  const info = useMemo(() => (res != null ? lifePathInfo(res) : null), [res]);

  const callChart = useServerFn(roxyNumerologyChart);

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!dob) return;
    const n = lifePath(dob);
    setRes(n);
    trackEvent("numerology_completed", { number: n });
    saveLocal("numerology:last", { dob, name });

    // Personal year is computed locally — no Roxy call needed.
    setRoxyYear(personalYear(dob));

    // Full chart (Expression / Soul Urge / Personality / Maturity) requires
    // a birth-certificate full name. Only call Roxy when the user gave one.
    if (name.trim().length > 0) {
      trackEvent("roxy_call_started", { kind: "numerology" });
      try {
        const r = await callChart({ data: { birthDate: dob, fullName: name.trim() } });
        if (r.ok) {
          setRoxy(normalizeRoxyChart(r.data));
          trackEvent("roxy_call_succeeded", { endpoint: "numerology/chart", cached: r.cached });
          trackEvent(r.cached ? "roxy_cache_hit" : "roxy_cache_miss", { endpoint: "numerology/chart" });
        } else {
          trackEvent("roxy_call_failed", { endpoint: "numerology/chart", code: r.providerCode });
          trackEvent("roxy_fallback_used", { endpoint: "numerology/chart" });
        }
      } catch {
        trackEvent("roxy_fallback_used", { endpoint: "numerology/chart" });
      }
    }
  }

  return (
    <div>
      <form onSubmit={calc} className="space-y-4">
        <Eyebrow>Sorsszám</Eyebrow>
        <h2 className="font-display text-2xl text-ivory">Számold ki a sorsszámod</h2>
        <HUDateInput value={dob} onChange={setDob} label="Születési dátumod" required />
        <div>
          <label className="block text-sm text-ivory/80 mb-2">Keresztneved <span className="text-ivory/45">(opcionális)</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inpCls} />
        </div>
        <button className="btn-gold" disabled={!dob}>Megnézem</button>
      </form>

      {res != null && info && (
        <div className="mt-6 space-y-4">
          <div className="text-center border-t border-[oklch(0.78_0.10_80/0.12)] pt-5">
            <Eyebrow>{name ? `${name} sorsszáma` : "A sorsszámod"}</Eyebrow>
            <div className="font-display text-7xl text-gold-gradient leading-none mt-1">{res}</div>
            <div className="font-display text-xl text-ivory mt-1">{info.title}</div>
          </div>
          <Block eyebrow="Mit jelent rólad?">{info.meaning}</Block>
          <div className="grid md:grid-cols-2 gap-4">
            <Block eyebrow="Erősségeid">{info.strengths}</Block>
            <Block eyebrow="Árnyékoldalad">{info.shadow}</Block>
            <Block eyebrow="Szerelemben">{info.love}</Block>
            <Block eyebrow="Munkában">{info.work}</Block>
          </div>
          {(roxy?.expression || roxy?.soulUrge || roxy?.personality) && (
            <div className="grid md:grid-cols-3 gap-3">
              {roxy.expression != null && (
                <Block eyebrow={`Kifejeződésed · ${roxy.expression}`}>
                  {lifePathInfo(roxy.expression).meaning}
                </Block>
              )}
              {roxy.soulUrge != null && (
                <Block eyebrow={`Belső vágyad · ${roxy.soulUrge}`}>
                  {lifePathInfo(roxy.soulUrge).meaning}
                </Block>
              )}
              {roxy.personality != null && (
                <Block eyebrow={`Külső képed · ${roxy.personality}`}>
                  {lifePathInfo(roxy.personality).meaning}
                </Block>
              )}
            </div>
          )}
          {roxy?.maturity != null && (
            <Block eyebrow={`Érettségi számod · ${roxy.maturity}`}>
              {lifePathInfo(roxy.maturity).meaning}
            </Block>
          )}
          {roxyYear != null && (
            <Block eyebrow={`Az idei személyes éved · ${roxyYear}`}>
              {lifePathInfo(roxyYear).meaning}
            </Block>
          )}
          {!roxy && name.trim().length === 0 && (
            <p className="text-xs text-ivory/45 font-editorial text-center">
              Tipp: ha megadod a teljes születési neved, mélyebb olvasatot kapsz.
            </p>
          )}
          {info.purpose && <Block eyebrow="Életfeladat">{info.purpose}</Block>}
          {info.advice && <Block eyebrow="Egy mondat, amit vigyél magaddal"><em>{info.advice}</em></Block>}
          <div className="text-center"><Link to="/szammisztika" className="btn-ghost-gold" onClick={() => trackEvent("detailed_reading_cta_clicked", { from: "szam" })}>Bővebb sorsszám-olvasat →</Link></div>
        </div>
      )}
    </div>
  );
}

// ─── Összeillés ──────────────────────────────────────────────

function OsszeillunkInline() {
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [na, setNa] = useState(""); const [nb, setNb] = useState("");
  const [res, setRes] = useState<null | { aN: number; bN: number; rel: number; score: number }>(null);
  const [roxyC, setRoxyC] = useState<RoxyCompat | null>(null);
  const callCompat = useServerFn(roxyNumerologyCompatibility);

  async function calc(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b) return;
    const aN = lifePath(a), bN = lifePath(b);
    const out = { aN, bN, rel: relationshipNumber(aN, bN), score: compatibilityScore(aN, bN) };
    setRes(out);
    trackEvent("compatibility_completed", { score: out.score, rel: out.rel });

    trackEvent("roxy_call_started", { kind: "compatibility" });
    try {
      const r = await callCompat({
        data: {
          birthDate1: a, birthDate2: b,
          fullName1: na || undefined, fullName2: nb || undefined,
        },
      });
      if (r.ok) {
        setRoxyC(normalizeRoxyCompat(r.data));
        trackEvent("roxy_call_succeeded", { endpoint: "numerology/compatibility", cached: r.cached });
        trackEvent(r.cached ? "roxy_cache_hit" : "roxy_cache_miss", { endpoint: "numerology/compatibility" });
      } else {
        trackEvent("roxy_call_failed", { endpoint: "numerology/compatibility", code: r.providerCode });
        trackEvent("roxy_fallback_used", { endpoint: "numerology/compatibility" });
      }
    } catch {
      trackEvent("roxy_fallback_used", { endpoint: "numerology/compatibility" });
    }
  }

  const pair = res ? compatPairMeaning(res.aN, res.bN) : null;
  const ai = res && lifePathInfo(res.aN);
  const bi = res && lifePathInfo(res.bN);
  const ri = res && lifePathInfo(res.rel);

  return (
    <div>
      <form onSubmit={calc} className="space-y-4">
        <Eyebrow>Összeillés</Eyebrow>
        <h2 className="font-display text-2xl text-ivory">Két születési dátum, egy közös szám</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-ivory/80 mb-2">A te neved <span className="text-ivory/45">(opc.)</span></label>
            <input value={na} onChange={(e)=>setNa(e.target.value)} className={inpCls} />
          </div>
          <div>
            <label className="block text-sm text-ivory/80 mb-2">Az ő neve <span className="text-ivory/45">(opc.)</span></label>
            <input value={nb} onChange={(e)=>setNb(e.target.value)} className={inpCls} />
          </div>
        </div>
        <HUDateInput label="A te születési dátumod" required value={a} onChange={setA} />
        <HUDateInput label="Az ő születési dátuma" required value={b} onChange={setB} />
        <button className="btn-gold" disabled={!a || !b}>Megnézem</button>
      </form>

      {res && pair && ai && bi && ri && (
        <div className="mt-6 space-y-4">
          <div className="text-center border-t border-[oklch(0.78_0.10_80/0.12)] pt-5">
            <Eyebrow>Összeillés</Eyebrow>
            <div className="font-display text-6xl md:text-7xl text-gold-gradient leading-none mt-1">{res.score}%</div>
            <p className="font-editorial text-ivory/65 mt-2">{na || "Te"} és {nb || "ő"}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <Block eyebrow={`${na || "Te"} · ${res.aN}`}>{ai.title}. {ai.meaning}</Block>
            <Block eyebrow={`${nb || "Ő"} · ${res.bN}`}>{bi.title}. {bi.meaning}</Block>
            <Block eyebrow={`Köztetek · ${res.rel}`}>{ri.title}. {ri.meaning}</Block>
          </div>
          <Block eyebrow="Miért működhet">{pair.works}</Block>
          <Block eyebrow="Hol lehet nehéz">{pair.tension}</Block>
          {roxyC && (roxyC.communication != null || roxyC.attraction != null || roxyC.longTerm != null) && (
            <div className="grid md:grid-cols-3 gap-3">
              {roxyC.communication != null && (
                <Block eyebrow="Kommunikáció">
                  {roxyC.communication}% — {roxyC.communication >= 70 ? "Természetesen értitek egymást." : roxyC.communication >= 50 ? "Megérthetitek egymást, ha kimondjátok, amit éreztek." : "Ki kell dolgozni a közös nyelvet."}
                </Block>
              )}
              {roxyC.attraction != null && (
                <Block eyebrow="Vonzalom">
                  {roxyC.attraction}% — {roxyC.attraction >= 70 ? "Erős a kettőtök közötti húzás." : roxyC.attraction >= 50 ? "Van vonzás, de táplálni kell." : "Lassabban épülő érzés."}
                </Block>
              )}
              {roxyC.longTerm != null && (
                <Block eyebrow="Hosszú táv">
                  {roxyC.longTerm}% — {roxyC.longTerm >= 70 ? "Olyan kapocs, ami meg tud állni az időben." : roxyC.longTerm >= 50 ? "Hosszan tartható, ha mindketten dolgoztok rajta." : "Inkább egy fejezet, mint egy egész történet."}
                </Block>
              )}
            </div>
          )}
          <Block eyebrow="Egy mondat, amit vigyetek magatokkal"><em>{pair.advice}</em></Block>
          <div className="text-center"><Link to="/osszeillunk" className="btn-ghost-gold" onClick={() => trackEvent("detailed_reading_cta_clicked", { from: "osszeillunk" })}>Bővebb olvasat →</Link></div>
        </div>
      )}
    </div>
  );
}

// ─── Result block ────────────────────────────────────────────

function CardResult({
  card, eyebrow, sections, oneLiner, footer,
}: {
  card: TarotCard;
  eyebrow: string;
  sections: { title: string; text: string }[];
  oneLiner: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid md:grid-cols-[180px,1fr] gap-5 items-start">
        <div className="mx-auto w-full max-w-[180px]">
          <CardFace card={card} />
        </div>
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h3 className="font-display text-2xl md:text-3xl text-ivory mt-1">{card.name}</h3>
          <div className="mt-2 flex flex-wrap gap-x-3 text-sm text-ivory/60">
            {card.keywords.map((k) => <span key={k}>· {k}</span>)}
          </div>
        </div>
      </div>
      {sections.map((s) => <Block key={s.title} eyebrow={s.title}>{s.text}</Block>)}
      <Block eyebrow="Egy mondat, amit vigyél magaddal"><em>{oneLiner}</em></Block>
      {footer}
    </div>
  );
}

const inpCls = "w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none";
const selectCls = "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory focus:border-gold outline-none";
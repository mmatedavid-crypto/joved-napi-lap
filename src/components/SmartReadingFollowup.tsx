import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PaywallDialog } from "@/components/PaywallDialog";
import { trackEvent } from "@/lib/analytics";
import { getGuestReadingContext, type GuestReadingType } from "@/lib/guestReadingMemory";
import { PRODUCTS_BY_SLUG, formatHuf } from "@/lib/products";

type FollowupIntent =
  | "daily"
  | "love"
  | "decision"
  | "compatibility"
  | "dream"
  | "numerology"
  | "horoscope"
  | "angel"
  | "crystal";

type FollowupOption = {
  slug: string;
  label: string;
  reason: string;
};

type Props = {
  intent: FollowupIntent;
  readingType: GuestReadingType;
  topic?: string;
  situation?: string;
  question?: string;
  sourceRoute: string;
  inputPayload?: Record<string, unknown>;
};

export function SmartReadingFollowup({
  intent,
  readingType,
  topic,
  situation,
  question,
  sourceRoute,
  inputPayload,
}: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const memory = useMemo(
    () => getGuestReadingContext({ readingType, topic, situation, limit: 8 }),
    [readingType, situation, topic],
  );
  const options = useMemo(
    () => followupOptions(intent, { question, situation, memory }),
    [intent, memory, question, situation],
  );
  const intro = useMemo(
    () => followupIntro({ intent, question, situation, memory }),
    [intent, memory, question, situation],
  );
  const optionSlugs = options.map((option) => option.slug).join(",");

  useEffect(() => {
    if (!optionSlugs) return;
    trackEvent("smart_followup_shown", {
      intent,
      readingType,
      sourceRoute,
      optionSlugs,
      hasMemory: memory.memories.length > 0,
      memoryCount: memory.memories.length,
    });
  }, [intent, memory.memories.length, optionSlugs, readingType, sourceRoute]);

  if (!options.length) return null;

  const memoryLine = memory.memories.length >= 2 ? memory.insights.gentleNudge : "";
  const selectedProduct = selectedSlug ? PRODUCTS_BY_SLUG[selectedSlug] : null;
  const selectedPayload = {
    ...inputPayload,
    ...(question ? { question } : {}),
    ...(situation ? { situation } : {}),
    ...(intro.context ? { followupContext: intro.context } : {}),
    ...(memory.contextText || memory.themeSummary
      ? { memoryContext: memory.contextText || memory.themeSummary }
      : {}),
  };
  const carryoverItems = [
    question ? `Kérdés: ${shortenContext(question, 120)}` : "",
    situation ? `Helyzet: ${shortenContext(situation, 120)}` : "",
    memoryLine ? "Korábbi mintáid finom jelzésként számítanak" : "",
  ].filter(Boolean);

  return (
    <section className="surface p-5 md:p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">
        Innen hogyan tovább?
      </div>
      <div className="mt-2 grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h2 className="font-display text-2xl text-ivory">Egy jó következő kérdés</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/62">{intro.text}</p>
          {intro.context && (
            <p className="mt-3 rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 px-3 py-2 text-sm leading-relaxed text-ivory/68">
              {intro.context}
            </p>
          )}
          {memoryLine && (
            <p className="mt-3 rounded-md border border-gold/15 bg-gold/[0.055] px-3 py-2 text-sm leading-relaxed text-ivory/68">
              {memoryLine}
            </p>
          )}
          {carryoverItems.length > 0 && (
            <div className="mt-3 rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold/70">
                Ezt visszük tovább
              </div>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ivory/64">
                {carryoverItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-ivory/45">
                A fizetős folytatás nem idegenként indul; ebből a fonalból készül a mélyebb olvasat.
              </p>
            </div>
          )}
        </div>
        <Link
          to="/arak"
          className="rounded-md border border-gold/20 px-3 py-2 text-center text-xs text-gold hover:border-gold/60"
        >
          Összes olvasat
        </Link>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const product = PRODUCTS_BY_SLUG[option.slug];
          if (!product) return null;
          const meta = followupOptionMeta(product);
          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => {
                trackEvent("smart_followup_clicked", {
                  intent,
                  readingType,
                  sourceRoute,
                  productSlug: option.slug,
                  hasMemory: memory.memories.length > 0,
                });
                setSelectedSlug(option.slug);
              }}
              className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/10 p-4 text-left transition-colors hover:border-gold/45"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl leading-tight text-ivory">
                    {option.label}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/62">{option.reason}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-gold">
                  {formatHuf(product.priceHuf)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gold/20 px-2 py-1 text-[11px] text-gold/76">
                  {meta}
                </span>
                <span className="text-xs text-ivory/45">{product.short}</span>
              </div>
            </button>
          );
        })}
      </div>
      {selectedProduct && (
        <PaywallDialog
          open={Boolean(selectedProduct)}
          onOpenChange={(open) => {
            if (!open) setSelectedSlug(null);
          }}
          productSlug={selectedProduct.slug}
          sourceRoute={sourceRoute}
          inputPayload={selectedPayload}
        />
      )}
    </section>
  );
}

function shortenContext(value: string, max = 180): string {
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

function followupOptionMeta(product: (typeof PRODUCTS_BY_SLUG)[string]): string {
  if (product.category === "instant") return "Azonnali olvasat";
  const hours = product.standardHours ?? 24;
  return `${hours} órán belül · részletes elemzés`;
}

function followupIntro({
  intent,
  question,
  situation,
  memory,
}: {
  intent: FollowupIntent;
  question?: string;
  situation?: string;
  memory: ReturnType<typeof getGuestReadingContext>;
}): { text: string; context: string } {
  const q = question?.trim();
  const sit = situation?.trim();
  if (q) {
    return {
      text: "A következő lépés akkor lesz pontosabb, ha ugyanabból a kérdésből indul tovább, nem egy új, általános olvasatból.",
      context: `A kérdés, amiből továbbmegyünk: „${shortenContext(q)}”`,
    };
  }
  if (sit) {
    return {
      text: "A mostani olvasat után nem az a cél, hogy még több választ gyűjts, hanem hogy a konkrét helyzetedhez válassz mélyebb irányt.",
      context: `A helyzet, amit már megadtál: ${shortenContext(sit)}`,
    };
  }
  if (memory.themeSummary) {
    return {
      text: "Mivel már több jelből is körvonalazódik egy minta, érdemes olyan folytatást választani, amely nem idegenként kezeli a kérdéseidet.",
      context: shortenContext(memory.themeSummary, 220),
    };
  }
  const fallbackByIntent: Record<FollowupIntent, string> = {
    daily:
      "Ha ez az olvasat megmozdított valamit, nem biztos, hogy újabb általános választ kell kérned. Válassz inkább ahhoz, ami most tényleg tisztázásra vár.",
    love: "Kapcsolati kérdésnél a mélyebb folytatás nem erősebb jóslatot ad, hanem jobban szétválasztja a vágyat, a tempót és a bizonytalanságot.",
    decision:
      "Döntés előtt a jó folytatás nem helyetted választ, hanem segít szétválasztani, melyik érzés húz és melyik tart vissza.",
    compatibility:
      "Összeillés után a mélyebb érték nem a százalékban van, hanem abban, miért működhet, hol akadhat el, és mit ismételtek.",
    dream:
      "Álom után a jó folytatás azt keresi, milyen érzés maradt veled, és mit tükrözhet önismereti jelként.",
    numerology:
      "Számmisztikánál a mélyebb folytatás józanul ránéz arra, hogyan működhet benned a minta.",
    horoscope: "Horoszkóp után a személyesebb folytatás időszakos fókuszt és saját ritmust ad.",
    angel: "Angyalszámnál a folytatás a számot a mostani helyzeted jelzéseként olvassa.",
    crystal: "Kristálynál a folytatás azt keresi, milyen szimbolikus minőségre van most szükséged.",
  };
  return { text: fallbackByIntent[intent], context: "" };
}

function followupOptions(
  intent: FollowupIntent,
  context: {
    question?: string;
    situation?: string;
    memory: ReturnType<typeof getGuestReadingContext>;
  },
): FollowupOption[] {
  const text =
    `${context.question ?? ""} ${context.situation ?? ""} ${context.memory.themeSummary}`.toLocaleLowerCase(
      "hu-HU",
    );
  const loveIntent = /(szerelem|kapcsolat|randi|ex|visszatér|ismerked|szeret|összeill)/.test(text);
  const decisionIntent = /(dönt|választ|munka|állás|költöz|maradjak|menjek|elfogadjam)/.test(text);
  const recurringIntent = /(újra|megint|visszatérő|ismétlődik|ugyanaz)/.test(text);
  if (intent === "love" || intent === "compatibility") {
    return [
      {
        slug: "parkapcsolat_elemzes",
        label:
          text.includes("ex") || text.includes("visszatér")
            ? "Mi történne, ha újra megjelenne?"
            : "Milyen mintát mutat köztetek?",
        reason:
          "A kapcsolati olvasat nem csak százalékot ad: tempót, kölcsönösséget, kommunikációt és visszatérő mintát is néz.",
      },
      {
        slug: "dontes_komplex",
        label: "Mit lépjek most józanul?",
        reason:
          "Akkor hasznos, ha nem az érzés a kérdés, hanem az, hogyan ne ismételd ugyanazt a kört.",
      },
    ];
  }
  if (intent === "daily" && loveIntent) {
    return [
      {
        slug: "parkapcsolat_elemzes",
        label: recurringIntent
          ? "Mi ismétlődik ebben a kapcsolatban?"
          : "Mit mutat ez kettőtökről?",
        reason:
          "Ha a napi lap kapcsolati kérdést érintett meg, jobb külön nézni a tempót, kölcsönösséget és visszatérő mintát.",
      },
      {
        slug: "harom_lap_mely",
        label: "Mi ennek a története?",
        reason:
          "A három lap segít látni, honnan jön ez az érzés, mi történik most, és merre mozdulhat óvatosan.",
      },
    ];
  }
  if (intent === "daily" && decisionIntent) {
    return [
      {
        slug: "dontes_komplex",
        label: "Hogyan döntsek tisztábban?",
        reason:
          "Ha a napi üzenet mögött valódi választás áll, a döntési elemzés külön kezeli a félelmet, vágyat és józan szempontot.",
      },
      {
        slug: "harom_lap_mely",
        label: "Mi ennek a mélyebb mintája?",
        reason:
          "Akkor hasznos, ha a döntés nem egyszeri kérdés, hanem egy régebbi belső minta folytatása.",
      },
    ];
  }
  if (intent === "decision") {
    return [
      {
        slug: "dontes_komplex",
        label: "Mi húz, és mi tart vissza?",
        reason:
          "A komplex döntési olvasat több nézőpontból bontja ki a helyzetet, döntésparancs nélkül.",
      },
      {
        slug: "harom_lap_mely",
        label: "Mi ennek a története?",
        reason:
          "Ha a döntés mögött régebbi minta van, a három lap segít óvatosan ránézni, honnan jön és merre mozdulhat.",
      },
    ];
  }
  if (intent === "dream") {
    return [
      {
        slug: "alomfejtes_rovid",
        label: "Mit üzen ez az álom nekem?",
        reason:
          "A személyes álomfejtés a saját álomszövegedből és az ébredés utáni érzésből indul ki.",
      },
      {
        slug: "mai_iranytu_ai",
        label: "Mit kezdjek ezzel ma?",
        reason:
          "Ha az álom után inkább napi belső irány kell, a mai iránytű rövidebb és gyakorlatibb.",
      },
    ];
  }
  if (intent === "angel") {
    return [
      {
        slug: loveIntent
          ? "parkapcsolat_elemzes"
          : decisionIntent
            ? "dontes_komplex"
            : "angyalszam_ai",
        label: loveIntent
          ? "Mit mutat ez a kapcsolati jel?"
          : decisionIntent
            ? "Mit kezdjek ezzel a döntésben?"
            : "Mit jelent ez most személyesen?",
        reason: loveIntent
          ? "Ha a szám kapcsolat közben jelent meg, érdemes külön nézni a tempót, a várakozást és a visszatérő mintát."
          : decisionIntent
            ? "Ha a szám döntés előtt tűnt fel, a döntési olvasat jobban szétválasztja a félelmet és a józan belső irányt."
            : "A mélyebb angyalszám-olvasat a számot a saját helyzetedhez köti, nem csak általános jelentést ad.",
      },
      {
        slug: "mai_iranytu_ai",
        label: "Mi legyen a mai fókuszom?",
        reason:
          "Akkor hasznos, ha nem hosszabb magyarázat kell, hanem egy rövid, napi önismereti irány.",
      },
    ];
  }
  if (intent === "crystal") {
    return [
      {
        slug: "kristaly_ai",
        label: "Melyik minőséget érdemes most hordoznom?",
        reason:
          "A személyes kristály-ajánlás nem testi hatást ígér, hanem a mostani helyzetedhez választ szimbolikus fókuszt.",
      },
      {
        slug: decisionIntent ? "dontes_komplex" : "mai_iranytu_ai",
        label: decisionIntent ? "Mit mutat ez a döntésemről?" : "Hogyan vigyem ezt bele a napomba?",
        reason: decisionIntent
          ? "Ha a kristály egy döntés körül érintett meg, a döntési olvasat tisztábban bontja ki a visszatartó és nyitó erőket."
          : "Ha csak egy mai irány kell, a napi iránytű rövidebb, személyesebb folytatás.",
      },
    ];
  }
  if (intent === "numerology") {
    return [
      {
        slug: "szammisztika_eletut",
        label: "Mi az életutam mélyebb mintája?",
        reason:
          "A részletes elemzés a születési dátum mellett a nevet is figyelembe veszi, ha megadod.",
      },
      {
        slug: "personal_30_day",
        label: "Mit mutat a következő 30 nap?",
        reason:
          "Ha most nem önjellemzés kell, hanem időszakos fókusz, a 30 napos térkép jobb folytatás.",
      },
    ];
  }
  if (intent === "horoscope") {
    return [
      {
        slug: "personal_30_day",
        label: "Mire figyeljek a következő hetekben?",
        reason: "A 30 napos térkép személyesebb időszakot és saját ritmust mutat.",
      },
      {
        slug: "transits_personal",
        label: "Miért most történik ez?",
        reason: "A tranzit-elemzés a most ható időzítéseket keresi a saját képleted felől.",
      },
    ];
  }
  return [
    {
      slug: "napi_lap_ai",
      label: "Mit üzen ez nekem személyesen?",
      reason: "Rövid, belépő árú személyes olvasat, ha a napi lapnál konkrétabb választ szeretnél.",
    },
    {
      slug: decisionIntent ? "dontes_komplex" : "harom_lap_mely",
      label: decisionIntent ? "Hogyan döntsek tisztábban?" : "Mi ennek a mélyebb mintája?",
      reason: "Akkor hasznos, ha a rövid napi üzenet után több összefüggést szeretnél látni.",
    },
  ];
}

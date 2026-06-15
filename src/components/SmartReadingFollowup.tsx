import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PaywallDialog } from "@/components/PaywallDialog";
import { getGuestReadingContext, type GuestReadingType } from "@/lib/guestReadingMemory";
import { PRODUCTS_BY_SLUG, formatHuf } from "@/lib/products";

type FollowupIntent =
  | "daily"
  | "love"
  | "decision"
  | "compatibility"
  | "dream"
  | "numerology"
  | "horoscope";

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
  const options = followupOptions(intent, { question, situation, memory });
  if (!options.length) return null;

  const memoryLine = memory.memories.length >= 2 ? memory.insights.gentleNudge : "";
  const selectedProduct = selectedSlug ? PRODUCTS_BY_SLUG[selectedSlug] : null;

  return (
    <section className="surface p-5 md:p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold/75">Innen hogyan tovább?</div>
      <div className="mt-2 grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h2 className="font-display text-2xl text-ivory">Egy jó következő kérdés</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/62">
            Ha ez az olvasat megmozdított valamit, nem biztos, hogy újabb általános választ kell
            kérned. Válassz inkább ahhoz, ami most tényleg tisztázásra vár.
          </p>
          {memoryLine && (
            <p className="mt-3 rounded-md border border-gold/15 bg-gold/[0.055] px-3 py-2 text-sm leading-relaxed text-ivory/68">
              {memoryLine}
            </p>
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
          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => setSelectedSlug(option.slug)}
              className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/10 p-4 text-left transition-colors hover:border-gold/45"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl leading-tight text-ivory">{option.label}</div>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/62">{option.reason}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-gold">
                  {formatHuf(product.priceHuf)}
                </span>
              </div>
              <div className="mt-3 text-xs text-ivory/45">{product.short}</div>
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
          inputPayload={{
            ...inputPayload,
            question,
            situation,
            memoryContext: memory.contextText || memory.themeSummary || undefined,
          }}
        />
      )}
    </section>
  );
}

function followupOptions(
  intent: FollowupIntent,
  context: {
    question?: string;
    situation?: string;
    memory: ReturnType<typeof getGuestReadingContext>;
  },
): FollowupOption[] {
  const text = `${context.question ?? ""} ${context.situation ?? ""} ${context.memory.themeSummary}`.toLocaleLowerCase(
    "hu-HU",
  );
  if (intent === "love" || intent === "compatibility") {
    return [
      {
        slug: "parkapcsolat_elemzes",
        label: text.includes("ex") || text.includes("visszatér")
          ? "Mi történne, ha újra megjelenne?"
          : "Mi történik köztetek valójában?",
        reason:
          "A kapcsolati olvasat nem csak százalékot ad: tempót, vonzalmat, kommunikációt és visszatérő mintát is néz.",
      },
      {
        slug: "dontes_komplex",
        label: "Mit lépjek most józanul?",
        reason:
          "Akkor hasznos, ha nem az érzés a kérdés, hanem az, hogyan ne ismételd ugyanazt a kört.",
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
          "Ha a döntés mögött régebbi minta van, a három lap jobban megmutatja, honnan jön és merre mozdulhat.",
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
  if (intent === "numerology") {
    return [
      {
        slug: "szammisztika_eletut",
        label: "Mi az életutam mélyebb mintája?",
        reason:
          "A teljes elemzés a születési dátum mellett a nevet is figyelembe veszi, ha megadod.",
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
        reason:
          "A 30 napos térkép akkor jó, ha nem általános jegyszöveget, hanem személyesebb időszakot néznél.",
      },
      {
        slug: "transits_personal",
        label: "Miért most történik ez?",
        reason:
          "A tranzit-elemzés a most ható időzítéseket keresi a saját képleted felől.",
      },
    ];
  }
  return [
    {
      slug: "napi_lap_ai",
      label: "Mit üzen ez nekem személyesen?",
      reason: "Rövid, olcsó személyes olvasat, ha a napi lapnál konkrétabb választ szeretnél.",
    },
    {
      slug: /(dönt|választ|munka|állás|költöz)/.test(text) ? "dontes_komplex" : "harom_lap_mely",
      label: /(dönt|választ|munka|állás|költöz)/.test(text)
        ? "Hogyan döntsek tisztábban?"
        : "Mi ennek a mélyebb mintája?",
      reason:
        "Akkor hasznos, ha a rövid napi üzenet után több összefüggést szeretnél látni.",
    },
  ];
}

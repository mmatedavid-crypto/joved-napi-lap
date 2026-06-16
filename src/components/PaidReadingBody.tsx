import { useState } from "react";
import { huTodayKey } from "@/lib/dateKeys";
import { SITE_LEGAL } from "@/lib/legal";

type ReadingBlock = {
  heading?: string;
  text: string;
};

export type PaidReadingGenerationPublic = {
  source?: string;
  fallbackUsed?: boolean;
  qualityRejected?: boolean;
  qualityIssues?: string[];
};

export function PaidReadingBody({
  body,
  title,
  productName,
  orderReference,
  generation,
}: {
  body: string;
  title?: string;
  productName?: string;
  orderReference?: string;
  generation?: PaidReadingGenerationPublic;
}) {
  const blocks = parsePaidReadingBody(body);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "ready" | "failed">("idle");
  const [clarifyState, setClarifyState] = useState<"idle" | "copied" | "failed">("idle");
  const selfCheck = paidReadingSelfCheck({ body, title, productName, orderReference });
  const assurance = paidReadingAssurance(generation);

  async function copyReading() {
    try {
      await navigator.clipboard.writeText(
        formatDownloadedReading(body, { title, productName, orderReference }).trim(),
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    } finally {
      window.setTimeout(() => setCopyState("idle"), 2200);
    }
  }

  function downloadReading() {
    try {
      const file = new Blob(
        [formatDownloadedReading(body, { title, productName, orderReference })],
        {
          type: "text/plain;charset=utf-8",
        },
      );
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `jovod-olvasat-${huTodayKey()}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDownloadState("ready");
    } catch {
      setDownloadState("failed");
    } finally {
      window.setTimeout(() => setDownloadState("idle"), 2200);
    }
  }

  async function copyClarificationDraft() {
    try {
      await navigator.clipboard.writeText(selfCheck.clarificationDraft.trim());
      setClarifyState("copied");
    } catch {
      setClarifyState("failed");
    } finally {
      window.setTimeout(() => setClarifyState("idle"), 2200);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/10 pb-3">
        <div className="space-y-1">
          <p className="text-xs leading-relaxed text-ivory/45">
            Az olvasatot később is visszanézheted; itt gyorsan kimásolhatod vagy letöltheted
            magadnak.
          </p>
          <p className="text-[11px] leading-relaxed text-ivory/38">
            Mentéskor a fájl tartalmazza a címet
            {orderReference ? ` és a rendelésazonosítót (${orderReference})` : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyReading}
            className="inline-flex items-center justify-center rounded-md border border-gold/25 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/60 hover:text-gold/85"
          >
            {copyState === "copied"
              ? "Kimásolva"
              : copyState === "failed"
                ? "Most nem sikerült"
                : "Olvasat másolása"}
          </button>
          <button
            type="button"
            onClick={downloadReading}
            className="inline-flex items-center justify-center rounded-md border border-gold/25 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/60 hover:text-gold/85"
          >
            {downloadState === "ready"
              ? "Letöltés indult"
              : downloadState === "failed"
                ? "Most nem sikerült"
                : "Olvasat letöltése"}
          </button>
        </div>
      </div>
      {assurance && <ReadingAssuranceNotice assurance={assurance} />}
      <ReadingUseGuide />
      <ReadingSelfCheck
        selfCheck={selfCheck}
        clarifyState={clarifyState}
        onCopyClarification={copyClarificationDraft}
      />
      {blocks.map((block, index) => (
        <section key={`${block.heading ?? "block"}-${index}`} className="space-y-2">
          {block.heading && (
            <h3 className="font-display text-xl leading-snug text-ivory">{block.heading}</h3>
          )}
          <div className="space-y-3">
            {block.text.split(/\n+/).map((line, lineIndex) => (
              <p
                key={lineIndex}
                className="font-editorial text-[15px] leading-relaxed text-ivory/76"
              >
                {line}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ReadingAssuranceNotice({ assurance }: { assurance: { heading: string; text: string } }) {
  return (
    <aside className="rounded-md border border-gold/15 bg-gold/[0.045] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">Minőségbiztosítás</div>
      <h3 className="mt-2 font-display text-lg leading-snug text-ivory">{assurance.heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ivory/60">{assurance.text}</p>
    </aside>
  );
}

type PaidReadingSelfCheck = {
  heading: string;
  intro: string;
  checks: string[];
  clarificationDraft: string;
};

function ReadingSelfCheck({
  selfCheck,
  clarifyState,
  onCopyClarification,
}: {
  selfCheck: PaidReadingSelfCheck;
  clarifyState: "idle" | "copied" | "failed";
  onCopyClarification: () => void;
}) {
  return (
    <aside className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/12 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">
        Pontosítás, ha valami kimaradt
      </div>
      <h3 className="mt-2 font-display text-xl leading-snug text-ivory">{selfCheck.heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ivory/60">{selfCheck.intro}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {selfCheck.checks.map((item) => (
          <li
            key={item}
            className="rounded-md border border-gold/10 bg-gold/[0.035] px-3 py-3 text-xs leading-relaxed text-ivory/58"
          >
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gold/10 pt-3">
        <button
          type="button"
          onClick={onCopyClarification}
          className="inline-flex items-center justify-center rounded-md border border-gold/25 px-3 py-2 text-xs text-gold transition-colors hover:border-gold/60 hover:text-gold/85"
        >
          {clarifyState === "copied"
            ? "Vázlat kimásolva"
            : clarifyState === "failed"
              ? "Most nem sikerült"
              : "Pontosítási vázlat másolása"}
        </button>
        <p className="text-xs leading-relaxed text-ivory/45">
          Akkor hasznos, ha az olvasat jó irányba indult, de egy fontos rész kimaradt.
        </p>
      </div>
    </aside>
  );
}

function ReadingUseGuide() {
  const items = [
    {
      label: "Most",
      text: "Először azt a mondatot keresd, amelyiknél megállsz egy pillanatra. Ott van a fő jel.",
    },
    {
      label: "Pár nap múlva",
      text: "Olvasd vissza azt a részt, ami cselekvés helyett figyelmet kér. Ez mutatja, mi mozdult.",
    },
    {
      label: "7 nap múlva",
      text: "Nézd meg, melyik téma tért vissza azóta. Ebből születik a következő jó kérdés.",
    },
    {
      label: "Ha nem pontos",
      text: "Írd meg, melyik rész nem talált, mi maradt ki a helyzetedből, és milyen irányban vársz pontosítást.",
    },
  ] as const;

  return (
    <aside className="rounded-md border border-gold/15 bg-gold/[0.05] p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">Olvasási iránytű</div>
      <p className="mt-2 text-sm leading-relaxed text-ivory/60">
        Ez nem vizsga és nem végleges ítélet. Akkor használható jól, ha a legpontosabb részt
        visszaviszed a saját helyzetedbe.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-md border border-gold/10 bg-black/10 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.16em] text-gold/70">{item.label}</div>
            <p className="mt-2 text-xs leading-relaxed text-ivory/56">{item.text}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-gold/10 pt-3 text-xs leading-relaxed text-ivory/48">
        Ha az olvasat valamelyik része félrement, írhatsz nekünk a{" "}
        <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
          {SITE_LEGAL.supportEmail}
        </a>{" "}
        címre. A rendelésazonosítóval gyorsabban visszanézzük, melyik rész nem talált.
      </p>
    </aside>
  );
}

function paidReadingSelfCheck({
  body,
  title,
  productName,
  orderReference,
}: {
  body: string;
  title?: string;
  productName?: string;
  orderReference?: string;
}): PaidReadingSelfCheck {
  const source = `${title ?? ""} ${productName ?? ""} ${body}`.toLocaleLowerCase("hu-HU");
  const productLabel = productName || title || "Személyes olvasat";
  const readingType = selfCheckReadingType(source);
  const checks = selfCheckItems(readingType);
  const orderLine = orderReference ? `Rendelés: ${orderReference}` : "Rendelés:";
  const clarificationDraft = [
    "Jövőd.hu pontosítási kérés",
    orderLine,
    `Olvasat: ${productLabel}`,
    "",
    "Ami talált:",
    "",
    "Ami túl általános vagy pontatlan volt:",
    "",
    "A helyzetemből ez maradt ki:",
    "",
    "Ebben az irányban kérek pontosítást:",
  ].join("\n");

  return {
    heading: selfCheckHeading(readingType),
    intro:
      "Az olvasat akkor használható igazán, ha felismerhetően a te helyzetedhez kapcsolódik. Ha egy fontos rész kimaradt vagy félrement, innen gyorsan meg tudod írni, mit pontosítsunk.",
    checks,
    clarificationDraft,
  };
}

function paidReadingAssurance(
  generation?: PaidReadingGenerationPublic,
): { heading: string; text: string } | null {
  if (!generation) return null;
  if (generation.qualityRejected) {
    return {
      heading: "Ellenőrzött, óvatosan szerkesztett olvasat",
      text: "A megjelenített szövegnek konkrétan a rendelésedhez és a megadott helyzetedhez kell kapcsolódnia. Ha mégis úgy érzed, hogy egy fontos rész kimaradt, a pontosítási vázlattal gyorsan jelezheted, merre finomítsuk.",
    };
  }
  if (generation.source === "local_premium_draft" || generation.fallbackUsed) {
    return {
      heading: "Rendelés alapján visszanézhető olvasat",
      text: "Az olvasat a megadott adatokból, a kártyákból, számokból vagy horoszkópjelekből indul ki. Ha nem reagál elég pontosan a konkrét kérdésedre, rendelés alapján visszanézzük, melyik részt kell finomítani.",
    };
  }
  return null;
}

function selfCheckReadingType(
  source: string,
): "love" | "decision" | "dream" | "numerology" | "horoscope" | "tarot" | "general" {
  if (/kapcsolat|szerel|randi|ex|visszatér|összeill/.test(source)) return "love";
  if (/döntés|döntsek|választ|munka|állás|költöz/.test(source)) return "decision";
  if (/álom|álomfejt/.test(source)) return "dream";
  if (/számmiszt|sorsszám|életút|személyes év/.test(source)) return "numerology";
  if (/horoszkóp|tranzit|védikus|születési képlet|30 nap/.test(source)) return "horoscope";
  if (/tarot|lap|kelta kereszt|húzás/.test(source)) return "tarot";
  return "general";
}

function selfCheckHeading(readingType: ReturnType<typeof selfCheckReadingType>): string {
  switch (readingType) {
    case "love":
      return "Akkor jó, ha a kapcsolat tempójára is reagál";
    case "decision":
      return "Akkor jó, ha nem dönt helyetted";
    case "dream":
      return "Akkor jó, ha az álomhangulatot is érti";
    case "numerology":
      return "Akkor jó, ha a számokból minta lesz";
    case "horoscope":
      return "Akkor jó, ha nem jegyhoroszkópnak hat";
    case "tarot":
      return "Akkor jó, ha a lap a helyzetedben szólal meg";
    default:
      return "Akkor jó, ha rád szabottan használható";
  }
}

function selfCheckItems(readingType: ReturnType<typeof selfCheckReadingType>): string[] {
  const common = [
    "Van benne legalább egy mondat, ami konkrétan a te kérdésedhez kapcsolódik.",
    "Nem állít biztos jövőt, hanem irányt és mintát mutat.",
  ];
  switch (readingType) {
    case "love":
      return [
        common[0],
        "Külön kezeli a vonzalmat, tempót és azt, mi lenne tartósabb szándék.",
        "Exnél vagy visszatérő történetnél nem ígér visszatérést.",
      ];
    case "decision":
      return [
        common[0],
        "Elválasztja, mi mozdít vágyból, félelemből vagy józan belső irányból.",
        "Nem mondja meg, mit tegyél, hanem tisztább mérlegelést ad.",
      ];
    case "dream":
      return [
        common[0],
        "Figyelembe veszi, milyen érzéssel ébredtél.",
        "Nem diagnosztizál, hanem önismereti jelként kezeli a szimbólumot.",
      ];
    case "numerology":
      return [
        "A születési dátum és név számai nem külön címkék, hanem egy közös mintává állnak össze.",
        "Megmutat erősséget és árnyékoldalt is.",
        "Nem általános személyiségleírás, hanem élethelyzeti tükör.",
      ];
    case "horoscope":
      return [
        "A jegy mintáját a megadott témáddal kapcsolja össze.",
        "Nem használ újságos jóslatnyelvet.",
        "Időszakot, hangsúlyt és figyelmi pontot ad, nem biztos eseményt.",
      ];
    case "tarot":
      return [
        common[0],
        "A lap vagy lapok nem külön magyarázatként állnak, hanem történetté kapcsolódnak.",
        "Van benne következő belső lépés, de nincs benne kényszerítő utasítás.",
      ];
    default:
      return [
        ...common,
        "Ha valami kimaradt, pontosan meg tudod nevezni, melyik rész igényel figyelmet.",
      ];
  }
}

function parsePaidReadingBody(body: string): ReadingBlock[] {
  return body
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const lines = part
        .split(/\n+/)
        .map((line) => cleanReadingMarkdown(line))
        .filter(Boolean);
      if (lines.length >= 2 && isLikelyHeading(lines[0])) {
        return { heading: lines[0], text: lines.slice(1).join("\n") };
      }
      return { text: lines.join("\n") || part };
    });
}

function cleanReadingMarkdown(value: string): string {
  return value
    .trim()
    .replace(/^#{1,6}\s+/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^[-*]\s+/, "• ");
}

function formatDownloadedReading(
  body: string,
  meta: { title?: string; productName?: string; orderReference?: string } = {},
): string {
  const date = new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const title = meta.title || meta.productName || "Személyes olvasat";
  return [
    "Jövőd.hu",
    title,
    meta.productName && meta.productName !== title ? `Termék: ${meta.productName}` : null,
    meta.orderReference ? `Rendelés: ${meta.orderReference}` : null,
    `Letöltve: ${date}`,
    "",
    body.trim(),
    "",
    "Ez az olvasat szimbolikus, önismereti digitális tartalom. Nem orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadás.",
    `Kapcsolat: ${SITE_LEGAL.supportEmail}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function isLikelyHeading(value: string): boolean {
  if (value.length > 80) return false;
  if (/[.!?]$/.test(value)) return false;
  return true;
}

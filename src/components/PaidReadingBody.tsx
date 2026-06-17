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
  const continuation = paidReadingContinuation({ body, title, productName });

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
      <ReadingContinuationGuide continuation={continuation} />
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

type PaidReadingContinuation = {
  heading: string;
  text: string;
  prompt: string;
  actions: Array<{
    label: string;
    href: string;
    note: string;
  }>;
};

function ReadingContinuationGuide({
  continuation,
}: {
  continuation: PaidReadingContinuation;
}) {
  return (
    <aside className="rounded-md border border-gold/15 bg-black/16 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-gold/75">Innen folytathatod</div>
      <h3 className="mt-2 font-display text-xl leading-snug text-ivory">
        {continuation.heading}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ivory/60">{continuation.text}</p>
      <p className="mt-3 rounded-md border border-gold/10 bg-gold/[0.035] px-3 py-3 text-xs leading-relaxed text-ivory/58">
        {continuation.prompt}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {continuation.actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="rounded-md border border-gold/15 bg-gold/[0.04] px-3 py-3 transition-colors hover:border-gold/45 hover:bg-gold/[0.07]"
          >
            <span className="block text-sm text-gold">{action.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-ivory/52">{action.note}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}

function paidReadingContinuation({
  body,
  title,
  productName,
}: {
  body: string;
  title?: string;
  productName?: string;
}): PaidReadingContinuation {
  const source = `${title ?? ""} ${productName ?? ""} ${body}`.toLocaleLowerCase("hu-HU");
  const readingType = selfCheckReadingType(source);
  const basePrompt =
    "Ugyanazt a fő kérdést vidd tovább egy mondatban: mi az, ami az olvasat után még nem tiszta?";

  switch (readingType) {
    case "love":
      return {
        heading: "Ha ezt a kapcsolatot tovább néznéd",
        text: "Ne új, általános kérdésként kezdd újra. Vidd tovább azt a pontot, ahol az olvasat szerint a tempó, a szándék vagy a visszatérés kérdése még nyitva maradt.",
        prompt: `${basePrompt} Például: most az érdekel, tartós közeledés látszik-e, vagy csak egy rövid visszakapcsolódás.`,
        actions: [
          {
            label: "Összeillünk",
            href: "/osszeillunk",
            note: "Kettőtök mintáját, tempóját és hosszabb távú feszültségeit nézi meg.",
          },
          {
            label: "Randi előtt",
            href: "/randi-elott",
            note: "A következő találkozó hangulatára és tanulságára fókuszál.",
          },
        ],
      };
    case "decision":
      return {
        heading: "Ha a döntés még nem zárult le",
        text: "Itt nem az a cél, hogy valaki kimondja helyetted a választ. A következő kérdés akkor jó, ha egyetlen belső akadályra vagy választási pontra szűkül.",
        prompt: `${basePrompt} Például: attól félek, hogy rosszkor lépek, vagy attól, hogy túl sokáig várok?`,
        actions: [
          {
            label: "Döntés előtt",
            href: "/dontes-elott",
            note: "A két irány mögötti félelmet, vágyat és józan belső jelzést választja szét.",
          },
          {
            label: "Három lap",
            href: "/harom-lap",
            note: "Megmutatja, honnan jön a helyzet, hol tart most, és merre mozdulhat.",
          },
        ],
      };
    case "dream":
      return {
        heading: "Ha az álom visszamaradt benned",
        text: "Az álomnál sokszor nem maga a tárgy a legerősebb jel, hanem az érzés, amivel felébredtél. Innen érdemes folytatni.",
        prompt: `${basePrompt} Írd bele azt is, milyen volt az álom hangulata: nyugtalan, ismerős, vágyott vagy idegen.`,
        actions: [
          {
            label: "Álomfejtés",
            href: "/alomfejtes",
            note: "Ugyanazt a szimbólumot pontosabb álomhangulattal lehet újranézni.",
          },
          {
            label: "Mai iránytű",
            href: "/mai-iranytu",
            note: "Ha az álom inkább napi figyelmeztetésnek vagy belső üzenetnek érződik.",
          },
        ],
      };
    case "numerology":
      return {
        heading: "Ha a számokból élethelyzet lett",
        text: "A következő lépésnél ne csak a számot keresd. Azt nézd, melyik minta ismétlődik most a kapcsolataidban, munkádban vagy döntéseidben.",
        prompt: `${basePrompt} Például: hogyan jelenik meg nálam most a szabadság, felelősség vagy elismerés kérdése?`,
        actions: [
          {
            label: "Számmisztika",
            href: "/szammisztika",
            note: "Teljes névvel és születési dátummal mélyebb személyes mintát ad.",
          },
          {
            label: "Összeillünk",
            href: "/osszeillunk",
            note: "Ha a saját mintád valaki más ritmusával ütközik vagy kapcsolódik.",
          },
        ],
      };
    case "horoscope":
      return {
        heading: "Ha az időszak üzenetét vinnéd tovább",
        text: "A jó horoszkóp nem kész eseménylistát ad, hanem időminőséget. A folytatásnál azt érdemes kérdezni, hol érzed ezt most a saját napjaidban.",
        prompt: `${basePrompt} Például: a hónap melyik témája lett nálam valóban érezhető: kapcsolat, munka, visszahúzódás vagy újrakezdés?`,
        actions: [
          {
            label: "Személyes horoszkóp",
            href: "/szemelyes-30-napos-horoszkop",
            note: "A következő hetek hangsúlyait személyesebb ritmusban mutatja meg.",
          },
          {
            label: "Tranzitok",
            href: "/tranzitok",
            note: "Ha inkább azt néznéd, milyen időminőség erősödik most körülötted.",
          },
        ],
      };
    case "tarot":
      return {
        heading: "Ha ugyanarra a történetre húznál tovább",
        text: "A következő húzás akkor lesz erősebb, ha nem az egész élethelyzetet kérdezed újra, hanem azt a pontot, ahol a lap szerint valami még mozdulni akar.",
        prompt: `${basePrompt} Például: mi az, amit most kerülök kimondani vagy meglépni?`,
        actions: [
          {
            label: "Három lap",
            href: "/harom-lap",
            note: "A helyzet múltját, jelenét és lehetséges irányát kapcsolja össze.",
          },
          {
            label: "Mai lap",
            href: "/mai-lap",
            note: "Egyetlen jelre szűkíti, mire figyelj ma ugyanebben a történetben.",
          },
        ],
      };
    default:
      return {
        heading: "Mi maradt még nyitva?",
        text: "Ha az olvasatban volt egy erős mondat, ne engedd el azonnal. Abból lesz a következő jó kérdés, nem egy teljesen újrakezdett történetből.",
        prompt: basePrompt,
        actions: [
          {
            label: "Mai iránytű",
            href: "/mai-iranytu",
            note: "Rövid, napi önismereti fókuszt ad a mostani helyzetedhez.",
          },
          {
            label: "Három lap",
            href: "/harom-lap",
            note: "Ha már látszik, melyik téma kér mélyebb folytatást.",
          },
        ],
      };
  }
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
    "Hogyan olvasd vissza:",
    "- Most: keresd azt a mondatot, amelyiknél megállsz egy pillanatra.",
    "- Pár nap múlva: nézd meg, melyik rész kért figyelmet cselekvés helyett.",
    "- 7 nap múlva: figyeld meg, melyik téma tért vissza; ebből születhet a következő jó kérdés.",
    "",
    "Ez az olvasat régi jelképrendszerekből készült önismereti olvasat. Nem orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadás.",
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

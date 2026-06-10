import { useState } from "react";
import { SITE_LEGAL } from "@/lib/legal";

type ReadingBlock = {
  heading?: string;
  text: string;
};

export function PaidReadingBody({
  body,
  title,
  productName,
  orderReference,
}: {
  body: string;
  title?: string;
  productName?: string;
  orderReference?: string;
}) {
  const blocks = parsePaidReadingBody(body);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [downloadState, setDownloadState] = useState<"idle" | "ready" | "failed">("idle");

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
      link.download = `jovod-olvasat-${new Date().toISOString().slice(0, 10)}.txt`;
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

function parsePaidReadingBody(body: string): ReadingBlock[] {
  return body
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const lines = part
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length >= 2 && isLikelyHeading(lines[0])) {
        return { heading: lines[0], text: lines.slice(1).join("\n") };
      }
      return { text: lines.join("\n") || part };
    });
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

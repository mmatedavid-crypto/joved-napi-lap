import { useState } from "react";
import { CARD_ART } from "./TarotCard";
import type { TarotCard } from "@/data/cards";

type Props = {
  card: TarotCard;
  /** one-line takeaway shown on the share image */
  oneLine?: string;
  /** small heading above the card (e.g. "A mai lapod") */
  eyebrow?: string;
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 5,
) {
  const words = text.split(/\s+/);
  let line = "";
  let lines: string[] = [];
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;:]?$/, "…");
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length * lineHeight;
}

async function buildShareImage(card: TarotCard, oneLine?: string, eyebrow?: string): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background — deep violet → midnight gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#1B1330");
  grad.addColorStop(0.5, "#0F0820");
  grad.addColorStop(1, "#08050F");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // sprinkle stars
  ctx.fillStyle = "rgba(212,175,122,0.55)";
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.6 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // eyebrow
  ctx.fillStyle = "rgba(212,175,122,0.85)";
  ctx.font = "600 28px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText((eyebrow ?? "A MAI LAPOD").toUpperCase().split("").join(" "), W / 2, 180);

  // card image
  const cardArt = CARD_ART[card.id];
  if (cardArt) {
    try {
      const img = await loadImage(cardArt);
      const cw = 620;
      const ch = Math.round(cw * 1.7);
      const cx = (W - cw) / 2;
      const cy = 260;
      // glow
      ctx.shadowColor = "rgba(212,175,122,0.35)";
      ctx.shadowBlur = 40;
      ctx.fillStyle = "#1B1330";
      ctx.fillRect(cx, cy, cw, ch);
      ctx.shadowBlur = 0;
      ctx.drawImage(img, cx, cy, cw, ch);
      // gold frame
      ctx.strokeStyle = "rgba(212,175,122,0.65)";
      ctx.lineWidth = 3;
      ctx.strokeRect(cx, cy, cw, ch);
    } catch {
      /* skip if image fails */
    }
  }

  // card name
  ctx.fillStyle = "#F4EFE6";
  ctx.font = "600 78px 'Playfair Display', serif";
  ctx.textAlign = "center";
  ctx.fillText(card.name, W / 2, 1430);

  // keywords
  ctx.fillStyle = "rgba(244,239,230,0.6)";
  ctx.font = "italic 32px 'Cormorant Garamond', serif";
  ctx.fillText(card.keywords.slice(0, 3).join(" · "), W / 2, 1480);

  // one-line message
  if (oneLine) {
    ctx.fillStyle = "#F4EFE6";
    ctx.font = "italic 40px 'Cormorant Garamond', serif";
    wrap(ctx, `„${oneLine}"`, W / 2, 1580, W - 160, 56, 4);
  }

  // footer
  ctx.fillStyle = "rgba(212,175,122,0.8)";
  ctx.font = "600 28px 'Inter', system-ui, sans-serif";
  ctx.fillText("jövőd.hu", W / 2, H - 90);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png");
  });
}

export function ShareCardButton({ card, oneLine, eyebrow }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handle() {
    setBusy(true);
    setStatus(null);
    try {
      const blob = await buildShareImage(card, oneLine, eyebrow);
      const file = new File([blob], `jovod-${card.id}.png`, { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: card.name, text: oneLine ?? "" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setStatus("Letöltve");
      }
    } catch {
      setStatus("Most nem sikerült.");
    } finally {
      setBusy(false);
      setTimeout(() => setStatus(null), 2500);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className="btn-ghost-gold inline-flex items-center gap-2"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v14" />
      </svg>
      {busy ? "Készítem…" : (status ?? "Megosztás / mentés")}
    </button>
  );
}

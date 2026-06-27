// Lightweight Telegram admin notifier.
// Sends fire-and-forget alerts to the configured admin chat via the
// Lovable connector gateway. Failures are swallowed (logged) so they
// never break the calling request.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

export type TelegramAlertKind = "info" | "success" | "warn" | "error";

function prefix(kind: TelegramAlertKind): string {
  switch (kind) {
    case "success":
      return "✅";
    case "warn":
      return "⚠️";
    case "error":
      return "🚨";
    default:
      return "ℹ️";
  }
}

export async function notifyAdmin(
  kind: TelegramAlertKind,
  title: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (!chatId || !lovableKey || !tgKey) return;

  const lines: string[] = [`${prefix(kind)} <b>${escapeHtml(title)}</b>`];
  if (details) {
    for (const [k, v] of Object.entries(details)) {
      if (v === undefined || v === null) continue;
      const value = typeof v === "string" ? v : JSON.stringify(v);
      lines.push(`<b>${escapeHtml(k)}:</b> ${escapeHtml(value)}`);
    }
  }
  const text = lines.join("\n").slice(0, 3800);

  try {
    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] sendMessage failed", { status: res.status, body: body.slice(0, 200) });
    }
  } catch (err) {
    console.error("[telegram] sendMessage threw", { error: err instanceof Error ? err.message : String(err) });
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
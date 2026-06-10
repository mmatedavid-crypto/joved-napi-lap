import { readFileSync } from "node:fs";

type Check = {
  name: string;
  file: string;
  includes: string[];
  excludes?: string[];
};

const checks: Check[] = [
  {
    name: "support email is centralized through legal config",
    file: "src/components/PaidReadingBody.tsx",
    includes: ["SITE_LEGAL.supportEmail", "`Kapcsolat: ${SITE_LEGAL.supportEmail}`"],
    excludes: ["ugyfelszolgalat@jovod.hu", "preagzrt@gmail.com"],
  },
  {
    name: "login page never displays raw auth provider errors",
    file: "src/routes/bejelentkezes.tsx",
    includes: [
      "safeAuthErrorMessage(e, mode)",
      "function safeAuthErrorMessage",
      "invalid login",
      "email not confirmed",
      "already registered",
      "Túl sok próbálkozás történt",
      "SITE_LEGAL.supportEmail",
      "Segítünk.",
    ],
    excludes: ['setErr(e instanceof Error ? e.message : "Hiba történt.")'],
  },
  {
    name: "thank-you page never displays raw order status errors",
    file: "src/routes/koszonjuk.tsx",
    includes: [
      "safeOrderStatusErrorMessage(e)",
      "function safeOrderStatusErrorMessage",
      "rendelés nem található",
      "A rendelés nem vész el",
      "Ellenőrizd, hogy a fizetés utáni teljes linket nyitottad-e meg",
    ],
    excludes: ['setErr(e instanceof Error ? e.message : "Hiba")'],
  },
  {
    name: "unsubscribe endpoint never logs raw unsubscribe tokens",
    file: "src/routes/email/unsubscribe.ts",
    includes: [
      "function redactToken",
      "token_redacted: redactToken(token)",
      "email_redacted: redactEmail(tokenRecord.email)",
    ],
    excludes: ['console.error("Failed to mark token as used", { error: updateError, token })'],
  },
  {
    name: "SSR fallback logging does not include raw response bodies",
    file: "src/server.ts",
    includes: [
      "function swallowedSsrError",
      "JSON.parse(body)",
      "h3 swallowed SSR error: ${message} (${status})",
      "console.error(consumeLastCapturedError() ?? swallowedSsrError(body))",
    ],
    excludes: ["new Error(`h3 swallowed SSR error: ${body}`)"],
  },
  {
    name: "checkout insert errors redact Stripe session ids",
    file: "src/lib/payments.functions.ts",
    includes: [
      "function redactStripeId",
      "session_id_redacted: redactStripeId(session.id)",
      "createCheckoutSession order insert failed",
    ],
    excludes: ["sessionId: session.id"],
  },
  {
    name: "payment webhooks redact Stripe session ids in operational logs",
    file: "src/routes/api/public/payments/webhook.ts",
    includes: [
      "function redactStripeId",
      "session_id_redacted: redactStripeId(sessionId)",
      "checkout.session.completed for unknown session",
    ],
    excludes: ['console.error("checkout.session.completed for unknown session:", sessionId)'],
  },
  {
    name: "withdrawal page gives clear recovery steps for paid delivery issues",
    file: "src/routes/elallasi-tajekoztato.tsx",
    includes: [
      "Hibás teljesítés vagy technikai gond",
      "vásárláshoz használt email címet",
      "rövid rendelésazonosítót",
      "melyik olvasatnál akadt el",
      "fizetés utáni",
      "köszönőoldalt",
      "profilod rendelési előzményeit",
      "nem csak emailben",
    ],
  },
];

const failed: string[] = [];

for (const check of checks) {
  const body = readFileSync(check.file, "utf8");
  const missing = check.includes.filter((needle) => !body.includes(needle));
  if (missing.length) failed.push(`${check.name}: missing ${missing.join(", ")}`);
  const forbidden = (check.excludes ?? []).filter((needle) => body.includes(needle));
  if (forbidden.length) failed.push(`${check.name}: forbidden ${forbidden.join(", ")}`);
}

if (failed.length) {
  console.error("Trust experience audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Trust experience audit passed: ${checks.length} checks.`);

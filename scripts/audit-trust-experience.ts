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
    excludes: ["hello@jovod.hu", "hello@jovod.hu"],
  },
  {
    name: "homepage explains free entry, paid price floor, and safe access",
    file: "src/routes/index.tsx",
    includes: [
      'const SITE_URL = "https://jovod.hu"',
      'links: [{ rel: "canonical", href: SITE_URL }]',
      "ENTRY_PRICE",
      "formatHuf(ENTRY_PRICE)",
      "Először próbáld ki",
      "Fizetős olvasatok",
      "Biztonságos hozzáférés",
      "A rövid olvasatok ingyen is elindíthatók",
      "rejtett díj nélkül",
      "A kártyaadatot Stripe kezeli",
      "profilban is",
      "Miért nem sablon?",
      "A kérdésedből indul",
      "Konkrét helyzet",
      "Magyar hang",
      "Visszatérő ív",
      "Minőségi korlát",
      "Kipróbálom ingyen",
      "Személyes olvasatok",
    ],
    excludes: ["biztosan", "garantáltan", "mindenképpen"],
  },
  {
    name: "root head does not force homepage canonical onto every route",
    file: "src/routes/__root.tsx",
    includes: ["BRAND_OG_IMAGE_URL", 'rel: "manifest"', "Organization", "WebSite"],
    excludes: ['{ rel: "canonical", href: SITE_URL }'],
  },
  {
    name: "profile access is visible in main and mobile navigation",
    file: "src/components/Layout.tsx",
    includes: ['to="/profil"', "Profil", "Profil és előzmények", "hidden lg:flex", "lg:hidden"],
  },
  {
    name: "private and transactional pages are kept out of search index",
    file: "src/routes/profil.tsx",
    includes: ['{ name: "robots", content: "noindex,nofollow" }'],
  },
  {
    name: "thank-you page with order access is kept out of search index",
    file: "src/routes/koszonjuk.tsx",
    includes: ['{ name: "robots", content: "noindex,nofollow" }'],
  },
  {
    name: "login page does not dilute public search appearance",
    file: "src/routes/bejelentkezes.tsx",
    includes: ['{ name: "robots", content: "noindex,follow" }'],
  },
  {
    name: "global footer exposes support contact from legal config",
    file: "src/components/Layout.tsx",
    includes: [
      "SITE_LEGAL.supportEmail",
      "Rendeléssel vagy hozzáféréssel kapcsolatban",
      "mailto:${SITE_LEGAL.supportEmail}",
    ],
  },
  {
    name: "about page builds trust before paid use",
    file: "src/routes/rolunk.tsx",
    includes: [
      "Egy csendes magyar rituálé",
      "magyar nyelvű digitális önismereti és szórakoztató platform",
      "a tarot, az asztrológia és a számmisztika hagyományaira",
      "természetes magyar nyelven",
      "használható önismereti kapaszkodót",
      "A fizetést Stripe dolgozza fel",
      "bankkártyaadatot nem tárolunk",
      "biztonságos rendelési linken és emailben",
      "hagyományos szimbólumait",
      'to="/arak"',
      "SITE_LEGAL.operator.name",
      "SITE_LEGAL.operator.registeredOffice",
      "SITE_LEGAL.operator.companyRegistrationNumber",
      "SITE_LEGAL.operator.taxNumber",
      "mailto:${SITE_LEGAL.supportEmail}",
      "nem szakmai döntéshelyettesítő",
    ],
    excludes: ["garantáltan", "mindenképpen", "biztosan", "Évtizedes szimbólumismeret"],
  },
  {
    name: "privacy notice explains paid reading feedback data",
    file: "src/routes/adatkezelesi-tajekoztato.tsx",
    includes: [
      "minőségi visszajelzést és opcionális rövid pontosítást",
      "Minőségi visszajelzés fizetős olvasatoknál",
      "az olvasat eltalált",
      "részben",
      "nem volt elég pontos",
      "rész maradt ki",
      "kizárólag ügyfélszolgálati",
      "hibajavítási és szolgáltatásminőségi célra",
      "nem helyettesíti a",
      "panaszt vagy ügyfélszolgálati kérést",
      "rendelési",
      "adatokkal együtt őrizhetjük meg",
    ],
    excludes: ["teljes olvasatot automatikusan"],
  },
  {
    name: "terms explain paid reading feedback expectations",
    file: "src/routes/aszf.tsx",
    includes: [
      "Minőségi visszajelzés",
      "mennyire talált",
      "mi maradt ki a helyzetedből",
      "szolgáltatás javítására",
      "ügyfélszolgálati ellenőrzésre",
      "rendelési azonosítóval együtt",
    ],
    excludes: ["garantált javítás", "automatikus visszatérítés"],
  },
  {
    name: "mobile bottom navigation gives direct profile access",
    file: "src/components/BottomNav.tsx",
    includes: ['to: "/profil"', 'label: "Profil"', "M5 21a7 7 0 0 1 14 0"],
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
    name: "login page explains profile value without implying a new payment",
    file: "src/routes/bejelentkezes.tsx",
    includes: [
      "Miért érdemes belépni?",
      "korábbi fizetős olvasataidat",
      "rendelési állapotaidat",
      "személyes memória",
      "visszatérő témáidra",
      "ingyenes",
      "nem indít új fizetést",
    ],
    excludes: ["kötelező", "bankkártya szükséges"],
  },
  {
    name: "thank-you page never displays raw order status errors",
    file: "src/routes/koszonjuk.tsx",
    includes: [
      "safeOrderStatusErrorMessage(e)",
      "function safeOrderStatusErrorMessage",
      "function OrderPreparationTimeline",
      "Mi történik most?",
      "A fizetés megérkezett, a kérdésedet és a megadott adatokat rögzítettük.",
      "Az azonnali olvasat általában pár percen belül megjelenik ezen az oldalon.",
      "ez a biztonságos rendelési link akkor is a közvetlen hozzáférésed marad",
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
    name: "unsubscribe endpoint returns localized public errors",
    file: "src/routes/email/unsubscribe.ts",
    includes: [
      "PUBLIC_UNSUBSCRIBE_ERROR",
      "MISSING_UNSUBSCRIBE_TOKEN",
      "INVALID_UNSUBSCRIBE_LINK",
      "function unsubscribeError",
      "A leiratkozási kérést most nem tudtuk feldolgozni",
      "Hiányzó leiratkozási azonosító.",
      "Ez a leiratkozási link érvénytelen vagy lejárt.",
    ],
    excludes: [
      'Response.json({ error: "Server configuration error" }',
      'Response.json({ error: "Token is required" }',
      'Response.json({ error: "Invalid or expired token" }',
      'Response.json({ error: "Failed to process unsubscribe" }',
    ],
  },
  {
    name: "Lovable suppression webhook returns localized public errors",
    file: "src/routes/lovable/email/suppression.ts",
    includes: [
      "PUBLIC_EMAIL_WEBHOOK_ERROR",
      "PUBLIC_EMAIL_WEBHOOK_AUTH_ERROR",
      "PUBLIC_EMAIL_WEBHOOK_PAYLOAD_ERROR",
      "function publicEmailWebhookError",
      "Az email eseményt most nem tudtuk feldolgozni",
      "Nincs jogosultság az email esemény feldolgozásához.",
      "Az email esemény adatai hiányosak vagy hibásak.",
    ],
    excludes: [
      'Response.json({ error: "Server configuration error" }',
      'Response.json({ error: "Invalid signature" }',
      'Response.json({ error: "Stale timestamp" }',
      'Response.json({ error: "Invalid payload" }',
      'Response.json({ error: "Verification failed" }',
      'Response.json({ error: "Internal error" }',
      'Response.json({ error: "Failed to write suppression" }',
    ],
  },
  {
    name: "Lovable suppression webhook stores stable email log error codes",
    file: "src/routes/lovable/email/suppression.ts",
    includes: [
      "type SuppressionLogErrorCode",
      "function mapReasonToLogCode",
      '"email_bounced"',
      '"email_complained"',
      '"email_unsubscribed"',
      '"email_suppressed"',
      "const sendLogMessage = mapReasonToLogCode(payload.reason)",
      "error_message: sendLogMessage",
    ],
    excludes: [
      "Permanent bounce",
      "Spam complaint",
      "Recipient unsubscribed",
      "Email suppressed",
      "function mapReasonToMessage",
    ],
  },
  {
    name: "Lovable transactional preview returns localized public errors",
    file: "src/routes/lovable/email/transactional/preview.ts",
    includes: [
      "PUBLIC_EMAIL_PREVIEW_ERROR",
      "PUBLIC_EMAIL_PREVIEW_AUTH_ERROR",
      "function publicEmailPreviewError",
      "Az email előnézetet most nem tudtuk elkészíteni",
      "Nincs jogosultság az email előnézet megnyitásához.",
      "errorMessage: PUBLIC_EMAIL_PREVIEW_ERROR",
    ],
    excludes: [
      'Response.json({ error: "Server configuration error" }',
      'Response.json({ error: "Unauthorized" }',
      "errorMessage: err instanceof Error ? err.message : String(err)",
    ],
  },
  {
    name: "Lovable transactional send returns localized public errors",
    file: "src/routes/lovable/email/transactional/send.ts",
    includes: [
      "PUBLIC_EMAIL_SEND_ERROR",
      "PUBLIC_EMAIL_SEND_AUTH_ERROR",
      "PUBLIC_EMAIL_SEND_PAYLOAD_ERROR",
      "function publicEmailSendError",
      "Az emailt most nem tudtuk előkészíteni",
      "Nincs jogosultság az email küldéséhez.",
      "Az email küldéséhez szükséges adatok hiányosak vagy hibásak.",
    ],
    excludes: [
      'Response.json({ error: "Server configuration error" }',
      'Response.json({ error: "Unauthorized" }',
      'Response.json({ error: "Invalid JSON in request body" }',
      'Response.json({ error: "templateName is required" }',
      'Response.json({ error: "Failed to verify suppression status" }',
      'Response.json({ error: "Failed to prepare email" }',
      'Response.json({ error: "Failed to enqueue email" }',
      "Available: ${Object.keys(TEMPLATES).join",
      "recipientEmail is required (unless the template defines a fixed recipient)",
    ],
  },
  {
    name: "Lovable email queue process returns localized public errors",
    file: "src/routes/lovable/email/queue/process.ts",
    includes: [
      "PUBLIC_EMAIL_QUEUE_ERROR",
      "PUBLIC_EMAIL_QUEUE_AUTH_ERROR",
      "function publicEmailQueueError",
      "Az email sort most nem tudtuk feldolgozni",
      "Nincs jogosultság az email sor feldolgozásához.",
    ],
    excludes: [
      "Response.json(\n            { error: 'Server configuration error' }",
      "Response.json({ error: 'Unauthorized' }",
      "Response.json({ error: 'Forbidden' }",
    ],
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
    name: "catastrophic error page is localized and not indexed",
    file: "src/lib/error-page.ts",
    includes: [
      '<html lang="hu">',
      "Az oldal most nem töltött be | Jövőd.hu",
      '<meta name="robots" content="noindex,nofollow" />',
      "Most nem töltött be az oldal",
      "A rendelésed vagy olvasatod ettől nem vész el",
      "Újrapróbálom",
      "Vissza a főoldalra",
    ],
    excludes: [
      '<html lang="en">',
      "This page didn't load",
      "Something went wrong on our end",
      "Try again",
      "Go home",
    ],
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
    name: "homepage daily briefing never displays raw provider or AI errors",
    file: "src/components/PersonalDailyBriefing.tsx",
    includes: [
      "SAFE_DAILY_BRIEFING_ERROR",
      "setError(SAFE_DAILY_BRIEFING_ERROR)",
      "Most nem tudtam összeállítani a mai olvasatot",
    ],
    excludes: ["setError(\n        res.message ??", "setError(res.message"],
  },
  {
    name: "daily briefing server returns a stable public failure message",
    file: "src/lib/roxy.functions.ts",
    includes: [
      "PERSONAL_DAILY_BRIEFING_ERROR",
      "message: PERSONAL_DAILY_BRIEFING_ERROR",
      "Most nem tudtam összeállítani a mai olvasatot",
    ],
    excludes: ['message: ai.error ?? "AI hiba"', 'message: "AI hiba"'],
  },
  {
    name: "shared tarot AI readings never expose model or guard diagnostics",
    file: "src/lib/roxy.functions.ts",
    includes: [
      "TAROT_AI_READING_ERROR",
      "message: TAROT_AI_READING_ERROR",
      "Most nem sikerült elkészíteni az olvasatot",
    ],
    excludes: ['message: guard.issues.join("; ")'],
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
  {
    name: "numerology SEO pages never expose raw router error messages",
    file: "src/routes/sorsszam.$n.tsx",
    includes: ["SAFE_NUMEROLOGY_PAGE_ERROR", "A számmisztikai tartalom most nem töltődött be"],
    excludes: ["lead={error.message}"],
  },
  {
    name: "numerology type pages never expose raw router error messages",
    file: "src/routes/numerologia.$type.tsx",
    includes: ["SAFE_NUMEROLOGY_PAGE_ERROR", "A számmisztikai tartalom most nem töltődött be"],
    excludes: ["lead={error.message}"],
  },
  {
    name: "natal chart page never displays raw provider or AI errors",
    file: "src/routes/szuletesi-keplet.tsx",
    includes: [
      "SAFE_NATAL_CHART_ERROR",
      "A képletet most nem sikerült elkészíteni",
      "setErr(SAFE_NATAL_CHART_ERROR)",
    ],
    excludes: ['setErr(r.message ?? "A képletet most nem sikerült elkészíteni.")', "setErr(r.message"],
  },
  {
    name: "natal chart translation returns stable public failure copy",
    file: "src/lib/roxyTranslate.functions.ts",
    includes: [
      "A születési képlet magyar olvasata most nem készült el.",
      "reading: null",
    ],
    excludes: ['message: t.error ?? "Magyarítási hiba."', "message: t.error"],
  },
  {
    name: "homepage tarot spread avoids horizontal viewport overflow",
    file: "src/components/SpreadDeck.tsx",
    includes: ["const spreadX = (t - 0.5) * 70"],
    excludes: ["const spreadX = (t - 0.5) * 92"],
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

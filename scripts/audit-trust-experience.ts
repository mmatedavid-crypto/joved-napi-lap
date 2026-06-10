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
      'to="/mai-lap"',
      'to="/arak"',
      "Ingyen húzok egy lapot",
      "Árak megtekintése",
      "Kezdhetsz fizetés nélkül",
      "rejtett díj nélkül",
      "A kártyaadatot Stripe kezeli",
      "profilban is",
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
      "RoxyAPI-forrásból és szerveroldali nyelvi értelmezésből",
      "nem nyers API-válasz",
      "nem gépies fordítás",
      "A fizetést Stripe dolgozza fel",
      "bankkártyaadatot nem tárolunk",
      "biztonságos rendelési linken és emailben",
      'to="/arak"',
      "SITE_LEGAL.operator.name",
      "SITE_LEGAL.operator.registeredOffice",
      "SITE_LEGAL.operator.companyRegistrationNumber",
      "SITE_LEGAL.operator.taxNumber",
      "mailto:${SITE_LEGAL.supportEmail}",
      "nem szakmai döntéshelyettesítő",
    ],
    excludes: ["garantáltan", "mindenképpen", "biztosan"],
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

import { readFileSync } from "node:fs";
import { PRODUCTS } from "../src/lib/products";

const failed: string[] = [];

for (const product of PRODUCTS) {
  const visibleCopy = [
    product.name,
    product.short,
    ...product.includes,
    ...product.depthPromise,
    product.qualityPromise,
  ].join("\n");
  if (!Array.isArray(product.depthPromise) || product.depthPromise.length < 2) {
    failed.push(`${product.slug}: missing at least two depthPromise items`);
  }
  for (const item of product.depthPromise ?? []) {
    if (item.length < 24) failed.push(`${product.slug}: weak depthPromise item: ${item}`);
    if (/\b(ai|gpt|prompt|api|endpoint)\b/i.test(item)) {
      failed.push(`${product.slug}: technical wording in depthPromise: ${item}`);
    }
  }
  if (/gyógy/i.test(visibleCopy)) {
    failed.push(`${product.slug}: health-adjacent crystal wording must be avoided`);
  }
  if (/\b(biztosan|garantáltan|mindenképpen|ez fog történni)\b/i.test(visibleCopy)) {
    failed.push(`${product.slug}: deterministic wording in paywall copy`);
  }
}

const paywall = readFileSync("src/components/PaywallDialog.tsx", "utf8");
const threeCardRoute = readFileSync("src/routes/harom-lap.tsx", "utf8");
const threeCardRouteText = threeCardRoute.replace(/\s+/g, " ");
for (const needle of [
  "Miben lesz személyesebb?",
  "Vásárlás menete",
  'trackEvent("paywall_opened"',
  'trackEvent("checkout_confirmed"',
  "checkoutDeliverySummary(product.category, deliveryLabel, isLoggedIn)",
  "checkoutSteps(product.category, deliveryLabel, isLoggedIn)",
  "Fizetés után azonnal elkészítjük az olvasatot.",
  "ezen az oldalon, emailben és a profilodban",
  "ezen az oldalon és emailben",
  "vendégként a biztonságos linket és az emailt érdemes megtartanod",
  "A rendelés állapotát a köszönőoldali biztonságos linken követheted",
  "az olvasat a köszönőoldali linken is megnyílik, ha az email késik",
  "az olvasat akkor is megjelenik a profilodban, ha az email késik",
  "const accessSummary = deliveryAccessText(isLoggedIn)",
  "Vendégként az olvasatot a köszönőoldali biztonságos linken és emailben éred el",
  "A rendelési linket érdemes megtartanod",
  "a profilodban később is visszanézhető",
  "kimásolható és letölthető",
  "az elkészült olvasat kimásolható és letölthető",
  "paymentsAvailable",
  "canStartPayment",
  "A fizetés előkészítése most nem elérhető",
  "product.depthPromise.map",
  "Minőségi ellenőrzés",
  "qualityReviewPromise(product).map",
  "function qualityReviewPromise(product: ProductDef)",
  "nem jelenítünk meg nyers idegen nyelvű háttérszöveget",
  "nem tartalmazhat biztos jövőígéretet",
  "több, egymásra épülő szakaszban",
  "konkrétan a megadott helyzethez kötöttnek",
  "Teljesítési biztonság",
  "fulfillmentPromise(product.category).map",
  "function fulfillmentPromise(category: ProductDef",
  "nem nyílik meg az olvasat",
  "pótoljuk a hozzáférést",
  "javítjuk vagy újraküldjük",
  "vállalt határidőt",
  "const formatPromise = readingFormatPromise(product)",
  "function readingFormatPromise(product: ProductDef)",
  "Forma:",
  "részletesebb, több szakaszos írásos elemzés",
  "hosszabb, 10 lapos riport",
  "azonnali, rövid írásos olvasat",
  "if (!email && user?.email) setEmail(user.email)",
]) {
  if (!paywall.includes(needle)) failed.push(`PaywallDialog missing: ${needle}`);
}

const checkout = readFileSync("src/components/StripeEmbeddedCheckout.tsx", "utf8");
for (const needle of [
  "checkoutIdentity",
  "clientSecretPromise.current = null",
  "customerEmail",
  "checkoutReturnUrl",
  "safeCheckoutErrorMessage(error)",
  "paymentsAvailable",
  "canLoadStripe",
  "!canLoadStripe",
  "A fizetés előkészítése most nem elérhető",
  "SITE_LEGAL.supportEmail",
  'trackEvent("checkout_started"',
  'trackEvent("checkout_succeeded"',
  'trackEvent("checkout_failed"',
  'trackEvent("checkout_retry_clicked"',
  "safeCheckoutErrorReason(error)",
  "Most nem sikerült elindítani a fizetést. Kérlek próbáld újra pár perc múlva.",
  "vásárlási email címedről",
]) {
  if (!checkout.includes(needle)) failed.push(`StripeEmbeddedCheckout missing: ${needle}`);
}

if (checkout.includes("setCheckoutError(message ||")) {
  failed.push("StripeEmbeddedCheckout must not display raw checkout error messages");
}
if (/trackEvent\("checkout_[^"]+",\s*\{[^}]*customerEmail/s.test(checkout)) {
  failed.push("Stripe checkout analytics must not include customer email");
}

if (paywall.includes("{deliveryLabel} · a profilodban és ezen az oldalon")) {
  failed.push("PaywallDialog must not promise profile access to every guest checkout");
}

for (const needle of [
  "A három lap mély elemzése",
  "24 órán",
  "Kelta kereszt",
  "10 pozícióban",
  "rejtett mintákat",
  "mi tart vissza",
  "mi mozgat belül",
  "merre nyílhat",
]) {
  if (!threeCardRouteText.includes(needle)) {
    failed.push(`Three-card paid CTA missing: ${needle}`);
  }
}

const analytics = readFileSync("src/lib/analytics.ts", "utf8");
for (const eventName of [
  "paywall_opened",
  "checkout_confirmed",
  "checkout_started",
  "checkout_succeeded",
  "checkout_failed",
  "checkout_retry_clicked",
]) {
  if (!analytics.includes(`"${eventName}"`)) {
    failed.push(`analytics EventName missing: ${eventName}`);
  }
}

if (failed.length) {
  console.error("Paywall product audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Paywall product audit passed: ${PRODUCTS.length} products.`);

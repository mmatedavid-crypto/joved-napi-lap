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
for (const needle of [
  "Miben lesz személyesebb?",
  "Vásárlás menete",
  "checkoutSteps(product.category, deliveryLabel)",
  "Fizetés után azonnal elkészítjük az olvasatot.",
  "az olvasat akkor is megjelenik a profilodban, ha az email késik",
  "product.depthPromise.map",
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
  "SITE_LEGAL.supportEmail",
  "Most nem sikerült elindítani a fizetést. Kérlek próbáld újra pár perc múlva.",
  "vásárlási email címedről",
]) {
  if (!checkout.includes(needle)) failed.push(`StripeEmbeddedCheckout missing: ${needle}`);
}

if (checkout.includes("setCheckoutError(message ||")) {
  failed.push("StripeEmbeddedCheckout must not display raw checkout error messages");
}

if (failed.length) {
  console.error("Paywall product audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Paywall product audit passed: ${PRODUCTS.length} products.`);

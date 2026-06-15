import { readFileSync } from "node:fs";
import { PRODUCTS } from "../src/lib/products.ts";

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
const productsSource = readFileSync("src/lib/products.ts", "utf8");
const pricingRoute = readFileSync("src/routes/arak.tsx", "utf8");
const withdrawalRoute = readFileSync("src/routes/elallasi-tajekoztato.tsx", "utf8");
const layout = readFileSync("src/components/Layout.tsx", "utf8");
const homeRoute = readFileSync("src/routes/index.tsx", "utf8");
const sitemap = readFileSync("src/routes/sitemap[.]xml.tsx", "utf8");
const threeCardRoute = readFileSync("src/routes/harom-lap.tsx", "utf8");
const threeCardRouteText = threeCardRoute.replace(/\s+/g, " ");
const delayedAstrologyRouteFiles = [
  "src/routes/szemelyes-30-napos-horoszkop.tsx",
  "src/routes/eves-horoszkop.tsx",
  "src/routes/vedikus-asztrologia.tsx",
  "src/routes/tranzitok.tsx",
] as const;
const delayedAstrologyRouteSources = delayedAstrologyRouteFiles.map((file) => ({
  file,
  source: readFileSync(file, "utf8"),
}));
for (const needle of [
  "Miben lesz személyesebb?",
  "Ebből indulunk ki",
  "A fizetett olvasat fókusza",
  "focusPreview.slice(0, 2).map",
  "A részleteket lejjebb is ellenőrizheted fizetés előtt",
  "const focusPreview = readingFocusPreview(product, inputPayload, inputSummary)",
  "focusPreview.map",
  "function readingFocusPreview(",
  "Ez nem teljes olvasat-előzetes",
  "nem általános sablonból indul",
  "A fő fókusz a saját kérdésed lesz",
  "A szöveg a megadott helyzetből indul ki",
  "A kapcsolat típusát külön kezeljük",
  "A válasz nem dönt helyetted",
  "A lapokat nem külön-külön magyarázzuk",
  "A jegyedet és a mostani témádat",
  "nem általános jellemzést",
  "Az álomszövegedből indulunk ki",
  "szimbolikus önismereti jelként",
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
  "Fontos, hogy pontos címet adj meg",
  "ehhez kötjük az olvasat elküldését és visszakeresését",
  "paymentsAvailable",
  "canStartPayment",
  "A fizetés előkészítése most nem elérhető",
  "product.depthPromise.map",
  "Ez akkor jó választás, ha",
  "choiceFitPromise(product).map",
  "function choiceFitPromise(product: ProductDef)",
  "gyors, olcsó próbaolvasatot",
  "nem csak százalékot szeretnél",
  "nem azt várod, hogy valaki döntsön helyetted",
  "nem egyetlen igen-nem kérdésed van",
  "az általános jegyszöveg helyett",
  "van egy erős álomkép vagy érzés",
  "Minőségi ellenőrzés",
  "qualityReviewPromise(product).map",
  "function qualityReviewPromise(product: ProductDef)",
  "minden olvasat természetes, közérthető magyar nyelven készül",
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
  "kérem a digitális tartalom teljesítésének megkezdését",
  "elkészült digitális olvasatnál az elállási jog korlátozott",
  "Technikai hiba esetén a hozzáférést pótoljuk",
  "const formatPromise = readingFormatPromise(product)",
  "function readingFormatPromise(product: ProductDef)",
  "Forma:",
  "részletesebb, több szakaszos írásos elemzés",
  "hosszabb, 10 lapos riport",
  "azonnali, rövid írásos olvasat",
  "if (!email && user?.email) setEmail(user.email)",
  'add("Név", payload.name ?? payload.fullName',
  'add("Megszólítás", payload.callName ?? payload.preferredName',
  'addPair("Nevek", payload.myName ?? payload.fullNameA',
  'add("Születési dátum", payload.dob ?? payload.birthDate',
  'addPair("Dátumok", payload.myDob ?? payload.birthDateA',
  'add("Lap", payload.cardName',
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
  'createFileRoute("/arak")',
  "Árak és olvasatok",
  "PRODUCTS.filter",
  'product.category === "instant"',
  'product.category === "delayed"',
  "Azonnali olvasatok",
  "Asztrológiai riportok",
  "590 Ft-tól",
  "Stripe fizetés",
  "Menthető olvasat",
  "Pontosítási út",
  "Ha nem elég pontos, rendelés alapján visszanézzük",
  "const CHOICE_GUIDE",
  "Melyiket válasszam?",
  "A kérdésedhez válassz",
  "Csak kipróbálnám",
  "Kapcsolat vagy ex jár a fejemben",
  "Kapcsolati olvasat",
  "Döntés előtt állok",
  "30 napos térképet kérek",
  "parkapcsolat_elemzes",
  "dontes_komplex",
  "personal_30_day",
  "Megnézem",
  "Mit kapsz kézhez?",
  "Azonnali vagy részletes?",
  "function ReadingTypeCard",
  "const instantPriceRange = productRange(instant)",
  "const delayedPriceRange = productRange(delayed)",
  "function productRange(products: typeof PRODUCTS)",
  "Pár percen belül",
  "A terméknél jelzett időn belül",
  "Kézhez kapod",
  "biztonságos rendelési linken",
  "minőségi visszajelzést is tudsz küldeni",
  "const PRICING_FAQ",
  '"@type": "FAQPage"',
  "Gyakori kérdések",
  "Vásárlás előtt jó tudni",
  "Kell fiókot létrehoznom",
  "Nem kötelező",
  "technikai hiba miatt nem nyílik meg",
  "pótoljuk a hozzáférést",
  "Mi van, ha az olvasat nem érződik elég pontosnak?",
  "konkrét pontosítási kérdésekkel",
  "milyen irányban vársz segítséget",
  "Elállhatok a digitális olvasattól?",
  "Fizetés előtt külön kéred a digitális tartalom teljesítésének megkezdését",
  "az elállási jog korlátozott lehet",
  "Ezek jóslatok?",
  "nem ígér biztos jövőt",
]) {
  if (!pricingRoute.includes(needle)) failed.push(`Pricing route missing: ${needle}`);
}

for (const forbiddenNeedle of [
  "30 napos előrejelzést kérek",
  "Ha tudni akarod, mire figyelj",
  "A 30 napos előrejelzés",
]) {
  if (pricingRoute.includes(forbiddenNeedle)) {
    failed.push(`Pricing route must avoid deterministic paid astrology wording: ${forbiddenNeedle}`);
  }
}

for (const forbiddenNeedle of [
  "Személyes 30 napos előrejelzés",
  "Teljes éves előrejelzés",
  "konkrét napokra figyelmeztetés",
]) {
  if (productsSource.includes(forbiddenNeedle)) {
    failed.push(`Product catalog must avoid deterministic paid astrology wording: ${forbiddenNeedle}`);
  }
}

for (const { file, source } of delayedAstrologyRouteSources) {
  if (source.includes("Fizetés után pár percen belül kézhez kapod a riportot")) {
    failed.push(`${file}: delayed astrology route must not promise delivery within minutes`);
  }
  if (/előrejelz(és|ést|ése)/i.test(source)) {
    failed.push(`${file}: delayed astrology route must avoid prediction-style wording`);
  }
  if (!source.includes("Fizetés után a vállalt elkészülési időn belül itt és emailben is eléred")) {
    failed.push(`${file}: delayed astrology route must show accurate delivery timing`);
  }
}

const delayedRouteExpectations = new Map<string, string>([
  ["src/routes/szemelyes-30-napos-horoszkop.tsx", "Személyes 30 napos asztrológiai térkép"],
  ["src/routes/eves-horoszkop.tsx", "12 hónapos időszaki térkép"],
]);

for (const { file, source } of delayedAstrologyRouteSources) {
  const expected = delayedRouteExpectations.get(file);
  if (expected && !source.includes(expected)) {
    failed.push(`${file}: delayed astrology route missing sober map wording: ${expected}`);
  }
}

for (const forbiddenNeedle of ["30 napos előrejelzés"]) {
  if (homeRoute.includes(forbiddenNeedle)) {
    failed.push(`Home route must avoid prediction-style paid astrology link: ${forbiddenNeedle}`);
  }
}

for (const needle of [
  "kifejezetten kéri, hogy a digitális tartalom",
  "az elállási jog a vonatkozó szabályok szerint",
  "korlátozott lehet",
  "technikai hiba miatt az olvasat nem jelenik meg",
  "a hozzáférést pótoljuk",
]) {
  if (!withdrawalRoute.includes(needle)) failed.push(`Withdrawal route missing: ${needle}`);
}

if (!layout.includes('{ to: "/arak", label: "Árak" }')) {
  failed.push("Layout navigation missing pricing link");
}
if (!sitemap.includes('"/arak"')) {
  failed.push("Sitemap missing pricing route");
}

for (const needle of [
  "A három lap mély elemzése",
  "néhány percen belül",
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
  "smart_followup_shown",
  "smart_followup_clicked",
  "paywall_opened",
  "paywall_alternative_clicked",
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

const smartFollowup = readFileSync("src/components/SmartReadingFollowup.tsx", "utf8");
for (const needle of [
  "Innen hogyan tovább?",
  "Egy jó következő kérdés",
  'trackEvent("smart_followup_shown"',
  'trackEvent("smart_followup_clicked"',
  "hasMemory",
  "memoryCount",
  "PaywallDialog",
  "const selectedPayload",
  "...inputPayload",
  "...(question ? { question } : {})",
  "...(situation ? { situation } : {})",
  "memoryContext: memory.contextText || memory.themeSummary",
  "followupOptions(",
  "const loveIntent",
  "const decisionIntent",
  "const recurringIntent",
  'intent === "daily" && loveIntent',
  'intent === "daily" && decisionIntent',
  "Mi ismétlődik ebben a kapcsolatban?",
  "Hogyan döntsek tisztábban?",
]) {
  if (!smartFollowup.includes(needle)) {
    failed.push(`SmartReadingFollowup missing: ${needle}`);
  }
}

if (failed.length) {
  console.error("Paywall product audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Paywall product audit passed: ${PRODUCTS.length} products.`);

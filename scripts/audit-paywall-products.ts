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
  if (product.category === "instant" && product.priceHuf < 900) {
    if (
      !/(tarot|számminta|holdjel|számmisztikai|kristályszimbolikai|álom|asztrológiai)/i.test(
        product.short,
      ) ||
      !/(helyzet|kérdés|érzés|időszak|hangulat)/i.test(product.short)
    ) {
      failed.push(
        `${product.slug}: starter product short copy must name a symbolic tradition and the user situation`,
      );
    }
    if (
      /\b(Személyre szabott elemzés a mai lapodhoz|Mit üzen a mai napod|személyre szabott jelentése|mostani helyzetedhez illő kristály|szimbólumainak rövid értelmezése)\b/i.test(
        product.short,
      )
    ) {
      failed.push(`${product.slug}: starter product short copy is too generic`);
    }
  }
  for (const item of product.depthPromise ?? []) {
    if (item.length < 24) failed.push(`${product.slug}: weak depthPromise item: ${item}`);
    if (/\b(ai|gpt|prompt|api|endpoint)\b/i.test(item)) {
      failed.push(`${product.slug}: technical wording in depthPromise: ${item}`);
    }
    if (/\bnem csak kulcsszavakat\b/i.test(item)) {
      failed.push(`${product.slug}: depthPromise should use positive symbolic value wording`);
    }
  }
  if (
    !product.depthPromise.some((item) =>
      /\b(hagyomány|jelképrendszer|szimbólumhagyomány|rituálé|tarot|asztrológiai|védikus|számmisztikai|kristályszimbolika|álomfejtés|kelta kereszt|bolygótranzit)/i.test(
        item,
      ),
    )
  ) {
    failed.push(
      `${product.slug}: paywall promise must frame the reading through tradition/symbols`,
    );
  }
  if (/gyógy/i.test(visibleCopy)) {
    failed.push(`${product.slug}: health-adjacent crystal wording must be avoided`);
  }
  if (/\b(biztosan|garantáltan|mindenképpen|ez fog történni)\b/i.test(visibleCopy)) {
    failed.push(`${product.slug}: deterministic wording in paywall copy`);
  }
  if (/\b(napi limit|limit feloldása)\b/i.test(visibleCopy)) {
    failed.push(
      `${product.slug}: paywall copy must frame extra readings as a separate perspective, not a quota unlock`,
    );
  }
  if (/\b(magazinos jóslat|bulvárjóslat|újságos jegyhoroszkóp)\b/i.test(visibleCopy)) {
    failed.push(
      `${product.slug}: paywall copy should state the positive product voice instead of tabloid/magazine contrast`,
    );
  }
  if (
    /\b(Nem általános horoszkópszöveg|nem egészségügyi állítás|diagnózis és ijesztgetés nélkül|Nem mondja meg, mit tegyél|Nem ígéri, hogy valaki visszajön|Nem napi horoszkóp|nem általános horoszkóp|nem általános éves jegyhoroszkóp|nem általános napi horoszkóp|nem általános tanácsot ad|nem ígér visszatérést)\b/i.test(
      visibleCopy,
    )
  ) {
    failed.push(
      `${product.slug}: paywall copy should use tradition/symbol framing instead of defensive contrast wording`,
    );
  }
}

const paywall = readFileSync("src/components/PaywallDialog.tsx", "utf8");
const productsSource = readFileSync("src/lib/products.ts", "utf8");
const pricingRoute = readFileSync("src/routes/arak.tsx", "utf8");
const withdrawalRoute = readFileSync("src/routes/elallasi-tajekoztato.tsx", "utf8");
const termsRoute = readFileSync("src/routes/aszf.tsx", "utf8");
const layout = readFileSync("src/components/Layout.tsx", "utf8");
const homeRoute = readFileSync("src/routes/index.tsx", "utf8");
const profileRoute = readFileSync("src/routes/profil.tsx", "utf8");
const smartFollowupSource = readFileSync("src/components/SmartReadingFollowup.tsx", "utf8");
const sitemap = readFileSync("src/routes/sitemap[.]xml.tsx", "utf8");
const threeCardRoute = readFileSync("src/routes/harom-lap.tsx", "utf8");
const stylesSource = readFileSync("src/styles.css", "utf8");
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
const indexedAstrologyLandingPaths = new Map<string, string>([
  ["src/routes/szemelyes-30-napos-horoszkop.tsx", "/szemelyes-30-napos-horoszkop"],
  ["src/routes/eves-horoszkop.tsx", "/eves-horoszkop"],
  ["src/routes/vedikus-asztrologia.tsx", "/vedikus-asztrologia"],
  ["src/routes/tranzitok.tsx", "/tranzitok"],
]);
const natalChartRouteSource = readFileSync("src/routes/szuletesi-keplet.tsx", "utf8");
for (const needle of [
  "Miben lesz személyesebb?",
  "Ebből indulunk ki",
  "A fizetett olvasat fókusza",
  "focusPreview.slice(0, 2).map",
  "A részleteket lejjebb is ellenőrizheted fizetés előtt",
  "priceFitNudge(product)",
  "function priceFitNudge(product: ProductDef)",
  "Ha első személyes irányt keresel",
  "belépő árú azonnali olvasat",
  "Ez részletesebb azonnali olvasat",
  "belépő árú olvasatok kisebb első lépést jelentenek",
  "több szempontot adhat",
  "Minőségi visszajelzés",
  "jelezheted, mennyire volt hasznos",
  "helyzetedhez. Rendelés alapján",
  "visszanézhető, melyik részt szeretnéd finomítani",
  "melyik részt szeretnéd finomítani",
  "pontosítási vázlat",
  "mi maradt ki",
  "Részletek: miből készül az olvasat, hogyan kapod meg",
  "const focusPreview = readingFocusPreview(product, inputPayload, inputSummary)",
  "focusPreview.map",
  "function readingFocusPreview(",
  "Ez nem teljes olvasat-előzetes",
  "kérdésből, adatokból és szimbólumokból indul",
  "A fő fókusz a saját kérdésed lesz",
  "A szöveg a megadott helyzetből indul ki",
  "A kapcsolat típusát külön kezeljük",
  "A válasz a belső mérleget tisztázza",
  "A lapokat nem külön-külön magyarázzuk",
  "A jegyedet és a mostani témádat",
  "személyesebb életút-mintát állítunk össze",
  "Az álomszövegedből indulunk ki",
  "szimbolikus önismereti jelként",
  'const birthTime = payloadText(payload, "birthTime")',
  'const birthPlace = payloadText(payload, "birthPlace")',
  "születési idő nélkül, közelített képlettel",
  "hely: ${birthPlace}",
  'add("Születési hely", payload.birthPlace',
  "Ha nem adtál meg pontos születési időt",
  "óvatosabban kezeli az időhöz kötött részeket",
  "Vásárlás menete",
  'trackEvent("paywall_opened"',
  'trackEvent("checkout_confirmed"',
  'product.category === "instant"',
  ' ? "általában pár percen belül"',
  "checkoutDeliverySummary(product.category, deliveryLabel, isLoggedIn)",
  "checkoutSteps(product.category, deliveryLabel, isLoggedIn)",
  "Fizetés után elindítjuk az olvasat elkészítését; az azonnali termékek általában pár percen belül megjelennek.",
  "A köszönőoldalon megjelenik, és a profilodban is visszanézhető.",
  "A köszönőoldalon megjelenik; vendégként a biztonságos linket és az emailt érdemes megtartanod.",
  "ezen az oldalon, emailben és a profilodban",
  "ezen az oldalon és emailben",
  "vendégként a biztonságos linket és az emailt érdemes megtartanod",
  "A rendelés állapotát a köszönőoldali biztonságos linken követheted",
  "az olvasat a köszönőoldali linken is megnyílik, ha az email késik",
  "az olvasat akkor is megjelenik a profilodban, ha az email késik",
  "const accessSummary = deliveryAccessText(isLoggedIn)",
  "const supportMailto = paywallSupportMailto({",
  "isLoggedIn,",
  "href={supportMailto}",
  "function paywallSupportMailto(",
  "Az azonnali olvasat általában pár percen belül megjelenik a köszönőoldalon",
  "Fizetési próbálkozás:",
  "bejelentkezve",
  "vendégként",
  "Jövőd.hu rendelési segítség",
  "Segítséget szeretnék kérni a rendeléshez vagy a fizetés előkészítéséhez.",
  "A vásárlási email címem:",
  "Mi történt röviden:",
  "Vendégként az olvasatot a köszönőoldali biztonságos linken és emailben éred el",
  "A rendelési linket érdemes megtartanod",
  "a profilodban később is visszanézhető",
  "kimásolható és letölthető",
  "az elkészült olvasat kimásolható és letölthető",
  "Fontos, hogy pontos címet adj meg",
  "kötjük az olvasat elküldését és visszakeresését",
  "Fizetés előtt még egyszer nézd át",
  "erre az email címre küldjük az értesítést",
  "vendégként ezzel tudunk gyorsan segíteni",
  "ha később vissza kell keresni az",
  "Javítsd az email címet fizetés előtt",
  "elgépelésnél nehezebb lesz eljuttatni vagy",
  "visszakeresni az olvasatot",
  "paymentsAvailable",
  "canStartPayment",
  "A fizetés előkészítése most nem elérhető",
  "Kártyaadat ilyenkor nem jut el hozzánk",
  "írj nekünk a vásárlási email címedről, és a választott olvasatot",
  "rendelés előtt segítünk rendezni",
  "const checkoutBlocker = checkoutBlockerText({",
  "function checkoutBlockerText(",
  "A fizetéshez először add meg azt az email címet",
  "A fizetéshez javítsd az email címet",
  "A fizetés előtt fogadd el a feltételeket",
  "A fizetés indításához most segítség kell",
  "Ha az express vállalás csúszna",
  "nem kell új rendelést indítanod",
  "a gyorsítás",
  "díját külön rendezzük",
  "product.depthPromise.map",
  "Ez akkor jó választás, ha",
  "choiceFitPromise(product).map",
  "function choiceFitPromise(product: ProductDef)",
  "Másik olvasat jobb lehet, ha",
  "wrongFitPromise(product).map",
  "function wrongFitPromise(product: ProductDef)",
  "biztos eseményválaszt keresel arra, hogy valaki visszajön-e",
  "inkább saját döntési fókuszt kérnél",
  "kész külső választ szeretnél két út között",
  "keresel szakmai tanácsot",
  "testi vagy lelki hatásígéretet keresel, nem szimbolikus fókuszt",
  "diagnózist, traumamagyarázatot vagy biztos lelki okot szeretnél tisztázni",
  "biztos eseményjóslatot keresel a mai napra",
  "megváltozhatatlan jövőt keresel",
  "rövid, belépő árú személyes irányt",
  "a százalék mellé érthető kapcsolati dinamikát is szeretnél",
  "tisztábban szeretnéd látni a döntés mögötti mintát",
  "több egymásba kapaszkodó szálat szeretnél",
  "az általános jegyszöveg helyett",
  "van egy erős álomkép vagy érzés",
  "Minőségi ellenőrzés",
  "qualityReviewPromise(product).map",
  "function qualityReviewPromise(product: ProductDef)",
  "minden olvasat a választott hagyomány jelképeit a megadott helyzethez köti",
  "nem tartalmazhat biztos jövőígéretet",
  "az elkészült olvasat mellett pontosítási vázlat",
  "ha egy fontos rész kimaradt",
  "több, egymásra épülő szakaszban",
  "konkrétan a megadott helyzethez kötöttnek",
  "Teljesítési biztonság",
  "fulfillmentPromise(product.category).map",
  "function fulfillmentPromise(category: ProductDef",
  "ha a hozzáférés megakad",
  "rendelés alapján utánanézünk és segítünk",
  "javítjuk vagy újraküldjük",
  "vállalt határidőt",
  "kérem a digitális tartalom teljesítésének megkezdését",
  "elkészült digitális olvasatnál az elállási jog korlátozott",
  "Ha a hozzáférés megakad, rendelés alapján utánanézünk és segítünk",
  "Régi jelképrendszerekből készült önismereti olvasat",
  "Olvasat határai",
  "Nem mond biztos jövőt, visszatérést vagy másik ember döntését kész tényként",
  "Nem választ helyetted; a mintát, tempót és belső fókuszt",
  "Nem orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadás",
  "Nem orvosi, jogi vagy",
  "pénzügyi",
  "tanácsadás.",
  "const formatPromise = readingFormatPromise(product)",
  "function readingFormatPromise(product: ProductDef)",
  "Forma:",
  "részletesebb, több szakaszos írásos elemzés",
  "hosszabb, 10 lapos riport",
  "azonnali, rövid írásos olvasat",
  "if (!email && user?.email) setEmail(user.email)",
  "const normalizedEmail = normalizeCheckoutEmailInput(email)",
  "const emailValid = isCheckoutEmailValid(normalizedEmail)",
  "onBlur={() => setEmail(normalizedEmail)}",
  "setEmail(normalizedEmail);",
  "customerEmail={normalizedEmail}",
  "function normalizeCheckoutEmailInput",
  'value.trim().toLocaleLowerCase("hu-HU")',
  "function isCheckoutEmailValid",
  'add("Név", payload.name ?? payload.fullName',
  'add("Megszólítás", payload.callName ?? payload.preferredName',
  'addPair("Nevek", payload.myName ?? payload.fullNameA',
  'add("Születési dátum", payload.dob ?? payload.birthDate',
  'addPair("Dátumok", payload.myDob ?? payload.birthDateA',
  'add("Lap", payload.cardName',
  "A kapcsolat mintáját százalék, kommunikáció, vonzalom és hosszabb táv szerint bontjuk ki",
  "A válasz a belső mérleget tisztázza",
]) {
  if (!paywall.includes(needle)) failed.push(`PaywallDialog missing: ${needle}`);
}

for (const forbidden of [
  "nem csak százalékot szeretnél",
  "nem azt várod, hogy valaki döntsön helyetted",
  "nem azonnali impulzust",
  "nem hosszú asztrológiai riportot keresel",
  "nem diagnózist vársz",
  "nem hosszú írásos riportot",
  "nem csak százalékként",
  "A válasz nem dönt helyetted",
  "nem egyetlen igen-nem kérdésed van",
]) {
  if (paywall.includes(forbidden)) {
    failed.push(
      `PaywallDialog choice-fit copy should use positive tradition/product framing: ${forbidden}`,
    );
  }
}

for (const forbidden of [
  "azonnal, fizetés után",
  "Fizetés után azonnal elkészítjük az olvasatot.",
  "A köszönőoldalon rögtön megnyílik",
  "Az olvasat a köszönőoldalon azonnal megnyílik",
]) {
  if (paywall.includes(forbidden))
    failed.push(`PaywallDialog overpromises instant delivery: ${forbidden}`);
}

for (const utility of ["btn-gold", "btn-ghost-gold"]) {
  const block =
    stylesSource.match(new RegExp(`@utility ${utility} \\{[\\s\\S]*?\\n\\}`))?.[0] ?? "";
  for (const needle of [
    "text-align: center;",
    "line-height: 1.25;",
    "white-space: normal;",
    "overflow-wrap: anywhere;",
  ]) {
    if (!block.includes(needle))
      failed.push(`styles.css ${utility} missing mobile CTA wrapping guard: ${needle}`);
  }
}

const checkout = readFileSync("src/components/StripeEmbeddedCheckout.tsx", "utf8");
for (const needle of [
  "checkoutIdentity",
  "clientSecretPromise.current = null",
  "customerEmail",
  "checkoutReturnUrl",
  "defaultCheckoutReturnUrl(environment)",
  'environment === "live" ? SITE_LEGAL.siteUrl : window.location.origin',
  "safeCheckoutErrorMessage(error)",
  "paymentsAvailable",
  "canLoadStripe",
  "!canLoadStripe",
  "A fizetés előkészítése most nem elérhető",
  "Kártyaadat ilyenkor nem jut el hozzánk",
  "SITE_LEGAL.supportEmail",
  'trackEvent("checkout_started"',
  'trackEvent("checkout_succeeded"',
  'trackEvent("checkout_failed"',
  'trackEvent("checkout_retry_clicked"',
  "safeCheckoutErrorReason(error)",
  "CheckoutStartError",
  "checkoutErrorMessageByCode",
  "checkoutSupportMailto",
  "PRODUCTS_BY_SLUG",
  "const productName = PRODUCTS_BY_SLUG[input.productSlug]?.name ?? input.productSlug",
  "`Termék: ${productName}`",
  "isLoggedIn: Boolean(userId)",
  "Fizetési próbálkozás:",
  "Jövőd.hu fizetési segítség",
  'aria-live="polite"',
  'role="status"',
  '"invalid_return_url"',
  "A fizetés visszaigazoló oldala most nem állítható be biztonságosan",
  "A vásárlási email címem:",
  "Mi történt röviden:",
  "invalid_user_id",
  'message === "Érvénytelen visszatérési cím"',
  'return "invalid_return_url"',
  'checkoutErrorMessageByCode("invalid_return_url")',
  "A fizetés most nem nyílt meg. Kártyaadat ilyenkor nem jut el hozzánk",
  "indítsd újra nyugodtan",
  "a választott olvasatot és a hozzáférést rendelés előtt is segítünk rendezni",
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

const paymentsServer = readFileSync("src/lib/payments.functions.ts", "utf8");
for (const needle of [
  "type CheckoutErrorCode",
  "CheckoutSessionResult = { clientSecret: string } | { error: CheckoutErrorCode }",
  "safeCheckoutErrorCode(error)",
  "normalizeCheckoutEmail(data.customerEmail)",
  "function normalizeCheckoutEmail",
  'value.trim().toLocaleLowerCase("hu-HU")',
  'return "invalid_email"',
  'return "unknown_product"',
  'return "invalid_user_id"',
  'return "invalid_return_url"',
  'return "order_insert_failed"',
  'return "checkout_start_failed"',
  "normalizeCheckoutReturnUrl(data.returnUrl, data.environment)",
  "normalizeSourceRoute(data.sourceRoute)",
  "function normalizeCheckoutReturnUrl",
  "SITE_LEGAL.siteUrl",
  'environment === "live" && url.protocol !== "https:"',
  'url.pathname !== "/koszonjuk"',
  'clean.includes("{CHECKOUT_SESSION_ID}")',
  "function normalizeSourceRoute",
  'sourceRoute.startsWith("//")',
  "sourceRoute.slice(0, 180)",
]) {
  if (!paymentsServer.includes(needle))
    failed.push(`payments.functions checkout missing: ${needle}`);
}
if (
  /return_url:\s*data\.returnUrl/.test(paymentsServer) &&
  !paymentsServer.includes("normalizeCheckoutReturnUrl(data.returnUrl, data.environment)")
) {
  failed.push("payments.functions must not trust a raw client returnUrl");
}
for (const forbidden of [
  "return { error: safeCheckoutErrorMessage(error) }",
  "type CheckoutSessionResult = { clientSecret: string } | { error: string }",
  "return_url: data.returnUrl,",
]) {
  if (paymentsServer.includes(forbidden)) {
    failed.push(`payments.functions checkout must not use raw text errors: ${forbidden}`);
  }
}

if (paywall.includes("{deliveryLabel} · a profilodban és ezen az oldalon")) {
  failed.push("PaywallDialog must not promise profile access to every guest checkout");
}
for (const forbidden of [
  "Technikai hiba esetén",
  "technikai hiba miatt nem nyílik meg az olvasat",
  "technikai hiba miatt nem nyílik meg",
  "Kérlek próbáld újra később, vagy írj",
  "kézzel is segítünk elindítani a rendelést",
]) {
  if (paywall.includes(forbidden)) {
    failed.push(`PaywallDialog must use customer-friendly access wording: ${forbidden}`);
  }
  if (pricingRoute.includes(forbidden)) {
    failed.push(`Pricing route must use customer-friendly access wording: ${forbidden}`);
  }
}

const stripeClient = readFileSync("src/lib/stripe.ts", "utf8");
const paymentBanner = readFileSync("src/components/PaymentTestModeBanner.tsx", "utf8");
for (const [file, body] of [
  ["src/lib/stripe.ts", stripeClient],
  ["src/components/PaymentTestModeBanner.tsx", paymentBanner],
] as const) {
  if (
    /Payments fül|Stripe verifikáció|fizetés még nincs élesítve|Fejlesztői környezet|publikus kulcs|Tesztkártya|4242 4242/i.test(
      body,
    )
  ) {
    failed.push(`${file} must not expose Lovable/admin payment setup wording`);
  }
}
for (const required of [
  "A fizetés ezen a környezeten most nem indítható",
  "Kártyaadat ilyenkor nem jut el hozzánk",
  "Próba fizetési mód",
  "itt nem indul valódi terhelés",
]) {
  if (!paymentBanner.includes(required)) {
    failed.push(`PaymentTestModeBanner must use customer-safe payment mode wording: ${required}`);
  }
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
  "belépő árú olvasatok alacsony kockázatú első személyes irányt",
  "Rendelés alapján visszanézhető, melyik részt szeretnéd finomítani",
  "Mennyi elég most?",
  "A jó első lépés a kérdés méretéhez igazodik",
  "Belépő olvasat",
  "tarot-lap, számminta, kristályszimbólum vagy álomkép helyzethez kötött olvasatához",
  "Részletesebb azonnali elemzés",
  "Asztrológiai riport",
  "function BudgetFitCard",
  "const entryPriceRange = productRange(entry)",
  "const focusedPriceRange = productRange(focused)",
  'href="#azonnali-olvasatok"',
  'id={category === "instant" ? "azonnali-olvasatok" : "asztrologiai-riportok"}',
  "Belépő olvasat indítása",
  "Helyzethez választok",
  "const CHOICE_GUIDE",
  "Melyiket válasszam?",
  "A kérdésedhez válassz",
  "Válassz abból, mekkora most a kérdésed",
  "Ha ugyanaz a téma tér vissza",
  "továbbviszi az előző kérdésed ívét",
  "const NOT_FOR_GUIDE",
  "Elvárások tisztázása",
  "Mikor ne ezt válaszd?",
  "régi jelképrendszerekből induló önismereti szövegek",
  "egy helyzet mintájára, belső tempójára vagy visszatérő jelére",
  "Ha biztos eseményválaszt vársz",
  "Nem mondjuk ki kész tényként",
  "hogy valaki visszajön-e",
  "Ha döntést kell helyetted meghozni",
  "nem választ helyetted munkában",
  "Ha krízisben vagy szakmai segítség kell",
  "Orvosi, jogi, pénzügyi, pszichológiai vagy sürgős krízishelyzetben",
  "Ha hosszú riportot vársz pár perc alatt",
  "Születési képletre épülő, többoldalas riportnál",
  "Első személyes irányt kérek",
  "Kapcsolat vagy ex jár a fejemben",
  "a százalék mellé tempót, vonzalmat és visszatérő mintát is ad",
  "Kapcsolati olvasat",
  "Döntés előtt állok",
  "30 napos térképet kérek",
  "parkapcsolat_elemzes",
  "dontes_komplex",
  "personal_30_day",
  "function productCardCta(product: (typeof PRODUCTS)[number])",
  'if (product.category === "delayed") return "Riport részletei"',
  'if (product.priceHuf < 900) return "Belépő olvasat indítása"',
  'return "Személyes olvasat indítása"',
  "Mit kapsz kézhez?",
  "Azonnali vagy részletes?",
  "function ReadingTypeCard",
  "const instantPriceRange = productRange(instant)",
  "const delayedPriceRange = productRange(delayed)",
  "function productRange(products: typeof PRODUCTS)",
  "Pár percen belül",
  "Normál esetben 24 órán belül, expresszel 6 órán belül",
  "Kézhez kapod",
  "biztonságos rendelési linken",
  "minőségi visszajelzést is tudsz küldeni",
  "normál esetben 24",
  "expressz gyorsítással 6 órán belül",
  "Ha az express határidő",
  "utánanézünk, és a gyorsítás díját külön rendezzük",
  "const PRE_PURCHASE_CHECKS",
  "Fizetés előtt átnézhető",
  "A döntés nem rejtett feltételeken múlik",
  "Fizetés előtt látod",
  "A választott olvasat nevét, árát, elkészülési módját",
  "Digitális teljesítés",
  "A fizetési folyamatban külön jelzed",
  "Segítség, ha elakadsz",
  "vásárlási email és a rendelési link alapján utánanézünk",
  'to="/aszf"',
  'to="/elallasi-tajekoztato"',
  'to="/adatkezelesi-tajekoztato"',
  "Kérdés vásárlás előtt",
  "function productDeliveryBadge",
  "Pár percen belül elkészül",
  "órán belül készül el",
  "Akkor jó, ha",
  "function productFitHint",
  "egy rövid mai jel megállított",
  "randi, ex, visszatérő kötődés",
  "a húzó és visszatartó belső szempontokat szeretnéd tisztábban látni",
  "összefüggő háromlapos tarot-olvasatot",
  "saját születési képletedhez kapcsolva",
  "egy hosszabb időszak fő témáit szeretnéd áttekinteni",
  "const PRICING_FAQ",
  '"@type": "FAQPage"',
  'import { SITE_LEGAL } from "@/lib/legal"',
  '"@type": "ItemList"',
  "Jövőd.hu fizetős olvasatok",
  "PRODUCTS.map((product, index)",
  '"@type": "Product"',
  'product.category === "instant"',
  "Azonnali önismereti olvasat",
  "Részletes önismereti olvasat",
  '"@type": "Offer"',
  "price: product.priceHuf",
  'priceCurrency: "HUF"',
  'availability: "https://schema.org/InStock"',
  'url: `${SITE_LEGAL.siteUrl}${product.sourceRoute ?? "/arak"}`',
  "name: SITE_LEGAL.operator.name",
  "Gyakori kérdések",
  "Vásárlás előtt jó tudni",
  "Kell fiókot létrehoznom",
  "Nem kötelező",
  "Mi történik, ha nem nyílik meg az olvasat?",
  "segítünk a hozzáférésben",
  "Mi van, ha az olvasat nem érződik elég pontosnak?",
  "rövid pontosítási vázlat",
  "melyik részt szeretnéd finomítani",
  "milyen irányban vársz segítséget",
  "Elállhatok a digitális olvasattól?",
  "Fizetés előtt külön kéred a digitális tartalom teljesítésének megkezdését",
  "az elállási jog korlátozott lehet",
  "Ezek jóslatok?",
  "régi jelképrendszerekből indul",
  "önismereti olvasatként kezeljük",
]) {
  if (!pricingRoute.includes(needle)) failed.push(`Pricing route missing: ${needle}`);
}

for (const forbidden of [
  "Nem mindig a legnagyobb olvasat a jó első lépés",
  "általában nem újabb gyors húzás kell",
  "nem kész választ vársz",
  "nem napi választ keresel",
  "döntést vársz tőlük",
]) {
  if (pricingRoute.includes(forbidden)) {
    failed.push(`Pricing route should avoid defensive choice framing: ${forbidden}`);
  }
}

for (const [file, source] of [
  ["src/components/PaywallDialog.tsx", paywall],
  ["src/routes/arak.tsx", pricingRoute],
  ["src/routes/profil.tsx", profileRoute],
  ["src/components/SmartReadingFollowup.tsx", smartFollowupSource],
] as const) {
  if (/\bolcsó(bb|k)?\b/i.test(source)) {
    failed.push(
      `${file}: conversion copy should use belépő árú / alacsony kockázatú wording instead of olcsó`,
    );
  }
}

for (const forbidden of [
  "melyik rész csúszott félre",
  "melyik rész nem talált",
  "mi nem talált",
  "nem volt elég pontos",
  "nem kapcsolódott eléggé",
  "Nem ezt keresed, ha",
  "biztos választ vársz arra, hogy visszajön-e",
  "egy másik ember döntését szeretnéd kész tényként kimondatni",
  "azt várod, hogy az olvasat helyetted válasszon",
  "megváltozhatatlan jövőt vársz",
]) {
  if (pricingRoute.includes(forbidden)) {
    failed.push(`Pricing copy should use situation-linked clarification wording: ${forbidden}`);
  }
  if (paywall.includes(forbidden)) {
    failed.push(`Paywall copy should use situation-linked clarification wording: ${forbidden}`);
  }
}

if (!profileRoute.includes("belépő") || !profileRoute.includes("árú személyes olvasatot")) {
  failed.push("Profile empty order state must frame starter paid readings as belépő árú");
}
if (!smartFollowupSource.includes("Rövid, belépő árú személyes olvasat")) {
  failed.push("SmartReadingFollowup must frame starter paid reading as belépő árú");
}

if (productsSource.includes("A legmélyebb tarot-riport: lassabb")) {
  failed.push("Kelta kereszt is instant; product copy must not imply delayed delivery");
}
for (const forbidden of [
  "Részletesebb, prémium olvasat",
  "A legmélyebb azonnali tarot-olvasat",
  "Ez mélyebb azonnali olvasat",
  "többet ad egy napi lapnál",
  "ad több kapaszkodót",
]) {
  if (productsSource.includes(forbidden))
    failed.push(`Product copy should avoid ranking/superlative promise: ${forbidden}`);
  if (paywall.includes(forbidden))
    failed.push(`Paywall copy should avoid ranking/superlative promise: ${forbidden}`);
  if (pricingRoute.includes(forbidden))
    failed.push(`Pricing copy should avoid ranking/superlative promise: ${forbidden}`);
}
if (paywall.includes("ráérsz megvárni a részletesebb, hosszabb írásos riportot")) {
  failed.push("Kelta kereszt paywall copy must not imply delayed delivery");
}
if (paywall.includes("Szimbolikus, önismereti digitális tartalom")) {
  failed.push(
    "Paywall CTA trust note must use tradition-based wording, not cold digital-content copy",
  );
}
if (
  !productsSource.includes("10 lapos, több pozíciós tarot-olvasat") ||
  !productsSource.includes("Részletesebb, összefüggő olvasat") ||
  !paywall.includes("azonnali választ szeretnél, de nagyobb szerkezetben")
) {
  failed.push(
    "Kelta kereszt copy must present the concrete instant tarot structure without ranking claims",
  );
}

if (
  !productsSource.includes("rövid belső irányt ad a lap jelképeiből és a megadott helyzetedből")
) {
  failed.push("Napi lap product promise must use positive symbolic value wording");
}

for (const needle of [
  "export function productDeliveryShortLabel",
  'if (product.category === "instant") return "pár perc"',
  "return `${product.standardHours ?? 24} órán belül`",
  "const delivery = productDeliveryShortLabel(slug)",
  "`${label} · ${price} · ${delivery}`",
]) {
  if (!productsSource.includes(needle)) {
    failed.push(`Product CTA labels must include price and delivery timing: ${needle}`);
  }
}

for (const forbiddenNeedle of [
  "30 napos előrejelzést kérek",
  "Ha tudni akarod, mire figyelj",
  "A 30 napos előrejelzés",
  "teljes védikus elemzést",
]) {
  if (pricingRoute.includes(forbiddenNeedle)) {
    failed.push(
      `Pricing route must avoid deterministic paid astrology wording: ${forbiddenNeedle}`,
    );
  }
}

for (const forbiddenNeedle of [
  "Személyes 30 napos előrejelzés",
  "Teljes éves előrejelzés",
  "Teljes éves időszaki térkép",
  "konkrét napokra figyelmeztetés",
  "konkrét napokra szóló",
  "natalchart",
]) {
  if (productsSource.includes(forbiddenNeedle)) {
    failed.push(
      `Product catalog must avoid deterministic paid astrology wording: ${forbiddenNeedle}`,
    );
  }
}

for (const slug of ["personal_30_day", "vedic_full", "personal_yearly", "transits_personal"]) {
  const pattern = new RegExp(
    `slug: "${slug}"[\\s\\S]*?category: "delayed"[\\s\\S]*?standardHours: 24`,
  );
  if (!pattern.test(productsSource)) {
    failed.push(
      `${slug}: delayed astrology product must use a realistic 24 hour standard delivery window`,
    );
  }
}

for (const { file, source } of delayedAstrologyRouteSources) {
  const indexedPath = indexedAstrologyLandingPaths.get(file);
  const expectedCanonical = `href: \`\${SITE_LEGAL.siteUrl}${indexedPath}\``;
  if (source.includes('content: "noindex,follow"')) {
    failed.push(`${file}: paid astrology landing must be indexable`);
  }
  if (!source.includes('{ name: "robots", content: "index,follow" }')) {
    failed.push(`${file}: paid astrology landing must explicitly allow indexing`);
  }
  if (!source.includes("SITE_LEGAL.siteUrl") || !source.includes(expectedCanonical)) {
    failed.push(`${file}: paid astrology landing must use the production canonical URL`);
  }
  if (/\bbefektetés\b/i.test(source)) {
    failed.push(`${file}: paid astrology route must avoid investment wording`);
  }
  if (source.includes("Fizetés után pár percen belül kézhez kapod a riportot")) {
    failed.push(`${file}: delayed astrology route must not promise delivery within minutes`);
  }
  if (/előrejelz(és|ést|ése)/i.test(source)) {
    failed.push(`${file}: delayed astrology route must avoid prediction-style wording`);
  }
  if (source.includes("Fizetés után a vállalt elkészülési időn belül itt és emailben is eléred")) {
    failed.push(
      `${file}: delayed astrology route must mention the secure order link before payment`,
    );
  }
  if (
    !source.includes(
      "Fizetés után a vállalt elkészülési időn belül ezen a biztonságos rendelési linken",
    ) ||
    !source.includes(
      "emailben is eléred a riportot; ha elakadna, a vásárlási email címedről segítünk",
    )
  ) {
    failed.push(`${file}: delayed astrology route must show accurate delivery timing`);
  }
  if (
    !source.includes("A város a születési képlet hely szerinti pontosításához kell") ||
    !source.includes("elég a település neve")
  ) {
    failed.push(`${file}: delayed astrology route must explain why birth place is required`);
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

for (const needle of ["A napi lap mellé más hagyományos jelekből is választhatsz mai fókuszt"]) {
  if (!homeRoute.includes(needle)) {
    failed.push(`Home route missing positive tradition-based cross-link copy: ${needle}`);
  }
}

for (const forbiddenNeedle of ["Ha nem csak lapot húznál"]) {
  if (homeRoute.includes(forbiddenNeedle)) {
    failed.push(`Home route must avoid defensive cross-link copy: ${forbiddenNeedle}`);
  }
}

for (const forbiddenNeedle of ["teljesebb képet", "nem nagy előrejelzést", "nem csak választ"]) {
  if (threeCardRoute.includes(forbiddenNeedle) || productsSource.includes(forbiddenNeedle)) {
    failed.push(`Visible product copy must avoid overpromising wording: ${forbiddenNeedle}`);
  }
}

for (const forbiddenNeedle of ["nem csak százalékot", "Ha nem csak rövid napi választ keresel"]) {
  if (pricingRoute.includes(forbiddenNeedle) || paywall.includes(forbiddenNeedle)) {
    failed.push(`Choice guide copy must use positive product-fit wording: ${forbiddenNeedle}`);
  }
}

for (const needle of [
  "a százalék mellé tempót, vonzalmat és visszatérő mintát is ad",
  "a 30 napos térkép jobb illeszkedés a rövid napi iránynál",
]) {
  if (!pricingRoute.includes(needle) && !paywall.includes(needle)) {
    failed.push(`Choice guide missing positive product-fit wording: ${needle}`);
  }
}

for (const needle of [
  "kifejezetten kéri, hogy a digitális tartalom",
  "az elállási jog a vonatkozó szabályok szerint",
  "korlátozott lehet",
  "hozzáférési vagy teljesítési gond miatt az olvasat",
  "a hozzáférést pótoljuk",
  "SYMBOLIC_TRADITION_DISCLAIMER",
  "önmagában nem minősül",
  "hozzáférési hibának",
]) {
  if (!withdrawalRoute.includes(needle)) failed.push(`Withdrawal route missing: ${needle}`);
}
if (withdrawalRoute.includes("szimbolikus, önismereti és szórakoztató tartalmak")) {
  failed.push("Withdrawal route must frame readings through tradition, not cold content wording");
}

for (const needle of [
  "Express gyorsítás választásakor",
  "külön gyorsított határidőt",
  "Ha ez a határidő csúszna",
  "a gyorsítás díját külön rendezzük",
]) {
  if (!termsRoute.includes(needle))
    failed.push(`Terms route missing express remedy wording: ${needle}`);
}

if (!layout.includes('{ to: "/arak", label: "Árak" }')) {
  failed.push("Layout navigation missing pricing link");
}
for (const needle of [
  'to="/szemelyes-30-napos-horoszkop"',
  'to="/eves-horoszkop"',
  'to="/tranzitok"',
  'to="/vedikus-asztrologia"',
  'to="/szuletesi-keplet"',
  "30 napos térkép",
  "Éves horoszkóp",
  "Tranzitelemzés",
  "Védikus elemzés",
]) {
  if (!layout.includes(needle)) {
    failed.push(`Layout footer missing paid astrology/natal internal link: ${needle}`);
  }
}
if (!sitemap.includes('"/arak"')) {
  failed.push("Sitemap missing pricing route");
}
if (natalChartRouteSource.includes('content: "noindex,follow"')) {
  failed.push("Natal chart route must be indexable");
}
if (
  !natalChartRouteSource.includes('{ name: "robots", content: "index,follow" }') ||
  !natalChartRouteSource.includes("href: `${SITE_LEGAL.siteUrl}/szuletesi-keplet`")
) {
  failed.push("Natal chart route must use explicit indexing and a production canonical URL");
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
  "function threeCardPaidPayload",
  "cardSpread: slots.map",
  "position: LABELS[index]",
  'orientation: slot.roxy.reversed ? "fordított" : "álló"',
  "freeSynthesis",
  "...threeCardPaidPayload(slots, question, category)",
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
  "followupIntro(",
  "shortenContext(",
  "followupContext: intro.context",
  "const carryoverItems",
  "Ezt visszük tovább",
  "Korábbi mintáid finom jelzésként számítanak",
  "A fizetős folytatás nem idegenként indul",
  "ebből a fonalból készül",
  "ugyanabból a kérdésből indul tovább",
  "célzottabb olvasatot választasz hozzá",
  "válassz olyan célzott folytatást",
  "const meta = followupOptionMeta(product)",
  "function followupOptionMeta(",
  "Azonnali olvasat",
  "órán belül · részletes elemzés",
  "A kérdés, amiből továbbmegyünk",
  "A helyzet, amit már megadtál",
  "nem idegenként kezeli a kérdéseidet",
  "memoryContext: memory.contextText || memory.themeSummary",
  "followupOptions(",
  "const loveIntent",
  "const decisionIntent",
  "const recurringIntent",
  "A kapcsolati olvasat tempót, kölcsönösséget, kommunikációt és visszatérő mintát is ad a százalék mellé.",
  'intent === "daily" && loveIntent',
  'intent === "daily" && decisionIntent',
  'intent === "angel"',
  'intent === "crystal"',
  "Mi ismétlődik ebben a kapcsolatban?",
  "Hogyan döntsek tisztábban?",
  "Mit jelent ez most személyesen?",
  "Melyik minőséget érdemes most hordoznom?",
]) {
  if (!smartFollowup.includes(needle)) {
    failed.push(`SmartReadingFollowup missing: ${needle}`);
  }
}
for (const forbidden of [
  "új, általános olvasatból",
  "újabb általános választ",
  "nem csak százalékot ad",
]) {
  if (smartFollowup.includes(forbidden)) {
    failed.push(
      `SmartReadingFollowup should avoid defensive generic-reading contrast: ${forbidden}`,
    );
  }
}

const followupRoutes = [
  {
    file: "src/routes/angyalszam.index.tsx",
    needles: [
      'intent="angel"',
      'readingType="angel"',
      'sourceRoute="/angyalszam"',
      "number: m.number",
    ],
  },
  {
    file: "src/routes/kristaly.tsx",
    needles: [
      'intent="crystal"',
      'readingType="crystal"',
      'sourceRoute="/kristaly"',
      "crystal: r.name",
    ],
  },
  {
    file: "src/routes/mai-iranytu.tsx",
    needles: [
      'intent="daily"',
      'readingType="daily_compass"',
      'sourceRoute="/mai-iranytu"',
      "question: focus.trim() || undefined",
    ],
  },
];

for (const route of followupRoutes) {
  const body = readFileSync(route.file, "utf8");
  for (const needle of ["SmartReadingFollowup", ...route.needles]) {
    if (!body.includes(needle)) failed.push(`${route.file} missing followup bridge: ${needle}`);
  }
}

if (failed.length) {
  console.error("Paywall product audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Paywall product audit passed: ${PRODUCTS.length} products.`);

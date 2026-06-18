import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { StripeEmbeddedCheckoutForm } from "@/components/StripeEmbeddedCheckout";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { MONTH_HU } from "@/lib/crystal.hu";
import { SITE_LEGAL } from "@/lib/legal";
import { EXPRESS_PRICE_HUF, PRODUCTS_BY_SLUG, formatHuf, type ProductDef } from "@/lib/products";
import { SIGN_HU } from "@/lib/roxyNormalize";
import { paymentsAvailable } from "@/lib/stripe";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productSlug: string;
  sourceRoute?: string;
  inputPayload?: Record<string, unknown>;
}

export function PaywallDialog({
  open,
  onOpenChange,
  productSlug,
  sourceRoute,
  inputPayload,
}: PaywallDialogProps) {
  const product = PRODUCTS_BY_SLUG[productSlug];
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [express, setExpress] = useState(false);
  const trackedOpenKey = useRef<string | null>(null);

  useEffect(() => {
    if (!email && user?.email) setEmail(user.email);
  }, [email, user?.email]);

  useEffect(() => {
    if (!open || !product) {
      trackedOpenKey.current = null;
      return;
    }
    const openKey = `${product.slug}:${sourceRoute ?? ""}`;
    if (trackedOpenKey.current === openKey) return;
    trackedOpenKey.current = openKey;
    trackEvent("paywall_opened", {
      productSlug: product.slug,
      category: product.category,
      sourceRoute,
      hasInput: Boolean(inputPayload && Object.keys(inputPayload).length > 0),
    });
  }, [inputPayload, open, product, sourceRoute]);

  if (!product) return null;

  const canExpress = product.category === "delayed";
  const canStartPayment = paymentsAvailable();
  const normalizedEmail = normalizeCheckoutEmailInput(email);
  const emailValid = isCheckoutEmailValid(normalizedEmail);
  const total = product.priceHuf + (express && canExpress ? EXPRESS_PRICE_HUF : 0);
  const inputSummary = summarizeInputPayload(inputPayload);
  const focusPreview = readingFocusPreview(product, inputPayload, inputSummary);
  const contextualAlternative = contextualProductAlternative(product, inputPayload, sourceRoute);
  const deliveryLabel =
    product.category === "instant"
      ? "azonnal, fizetés után"
      : express
        ? "6 órán belül"
        : `${product.standardHours ?? 24} órán belül`;
  const isLoggedIn = Boolean(user);
  const deliverySummary = checkoutDeliverySummary(product.category, deliveryLabel, isLoggedIn);
  const accessSummary = deliveryAccessText(isLoggedIn);
  const formatPromise = readingFormatPromise(product);
  const priceFit = priceFitNudge(product);
  const checkoutBlocker = checkoutBlockerText({
    email: normalizedEmail,
    emailValid,
    termsAccepted,
    canStartPayment,
  });
  const supportMailto = paywallSupportMailto({
    product,
    sourceRoute,
    inputSummary,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setConfirmed(false);
          setTermsAccepted(false);
          setExpress(false);
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[oklch(0.12_0.03_290)] border-[oklch(0.78_0.10_80/0.25)] text-ivory">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-ivory">{product.name}</DialogTitle>
          <DialogDescription className="text-ivory/65">{product.short}</DialogDescription>
        </DialogHeader>

        {!confirmed ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="font-display text-4xl text-gold-gradient">{formatHuf(total)}</div>
              <div className="text-xs text-ivory/55 mt-1">{deliverySummary}</div>
              {priceFit && (
                <p className="mx-auto mt-2 max-w-sm rounded-md border border-gold/15 bg-black/12 px-3 py-2 text-xs leading-relaxed text-ivory/58">
                  {priceFit}
                </p>
              )}
              {product.category === "delayed" && (
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ivory/50">
                  A részletes elemzést gondosabb szövegezéssel készítjük. Elkészüléskor ezen a
                  rendelési oldalon nyílik meg, emailben is jelzünk, bejelentkezve pedig a
                  profilodban is visszanézhető.
                </p>
              )}
            </div>

            {contextualAlternative && (
              <div className="rounded-md border border-gold/20 bg-[oklch(0.78_0.10_80/0.06)] p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-gold/75">
                  Lehet, hogy ehhez jobban illik
                </div>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-display text-xl leading-tight text-ivory">
                      {contextualAlternative.product.name}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ivory/62">
                      {contextualAlternative.reason}
                    </p>
                  </div>
                  {contextualAlternative.product.sourceRoute && (
                    <Link
                      to={contextualAlternative.product.sourceRoute}
                      onClick={() => {
                        trackEvent("paywall_alternative_clicked", {
                          productSlug: product.slug,
                          alternativeSlug: contextualAlternative.product.slug,
                          sourceRoute,
                        });
                        onOpenChange(false);
                      }}
                      className="shrink-0 rounded-md border border-gold/30 px-3 py-2 text-center text-xs text-gold transition-colors hover:border-gold/70 hover:text-gold"
                    >
                      Megnézem · {formatHuf(contextualAlternative.product.priceHuf)}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {focusPreview.length > 0 && (
              <div className="rounded-md border border-gold/20 bg-gold/[0.055] p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-gold/75">
                  A fizetett olvasat fókusza
                </div>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ivory/70">
                  {focusPreview.slice(0, 2).map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/75" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs leading-relaxed text-ivory/48">
                  A részleteket lejjebb is ellenőrizheted fizetés előtt.
                </p>
              </div>
            )}

            <div className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/12 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-gold/75">
                Pontossági visszajelzés
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ivory/66">
                Ha az elkészült olvasat részben talál, vagy fontos helyzet kimarad belőle,
                rendelés alapján visszanézzük. Adunk egy rövid pontosítási vázlatot is, hogy
                egyszerűen meg tudd írni, melyik rész csúszott félre és mi maradt ki.
              </p>
            </div>

            <div>
              <label htmlFor="checkout-email" className="block text-sm text-ivory/80 mb-1">
                Email cím a vásárláshoz
              </label>
              <input
                id="checkout-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmail(normalizedEmail)}
                placeholder="te@pelda.hu"
                className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
              />
              {!user && (
                <p className="text-xs text-ivory/45 mt-1">
                  Vendégvásárlás — fiók nem kötelező. Fontos, hogy pontos címet adj meg, mert
                  ehhez kötjük az olvasat elküldését és visszakeresését.
                </p>
              )}
              {email && !emailValid && (
                <p className="mt-1 text-xs text-gold/75">
                  Kérlek ellenőrizd az email címet, ide küldjük az olvasatot is.
                </p>
              )}
            </div>

            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-md border border-[oklch(0.78_0.10_80/0.18)] bg-black/10 px-4 py-3 text-left text-sm text-ivory/80 hover:text-ivory">
                <span>Részletek: miből készül az olvasat, hogyan kapod meg</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4">
                {focusPreview.length > 0 && (
                  <div className="rounded-md border border-gold/20 bg-[oklch(0.78_0.10_80/0.07)] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gold/75">
                      Ebből indulunk ki
                    </div>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ivory/70">
                      {focusPreview.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/75" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 border-t border-gold/10 pt-3 text-xs leading-relaxed text-ivory/52">
                      Ez nem teljes olvasat-előzetes, hanem annak tiszta összefoglalása, milyen
                      kérdésből, adatokból és szimbólumokból indul a fizetett olvasat.
                    </p>
                  </div>
                )}

                <div className="rounded-md border border-[oklch(0.78_0.10_80/0.18)] bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-gold/75">Mit kapsz?</div>
                  <ul className="mt-3 space-y-2 text-sm text-ivory/72">
                    {product.includes.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-md border border-[oklch(0.78_0.10_80/0.12)] bg-black/15 px-3 py-2 text-xs leading-relaxed text-ivory/58">
                    <span className="font-medium text-ivory/75">Forma:</span> {formatPromise}
                  </div>
                  <p className="mt-3 border-t border-[oklch(0.78_0.10_80/0.14)] pt-3 text-xs leading-relaxed text-ivory/55">
                    {product.qualityPromise}
                  </p>
                </div>

                <div className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-gold/75">
                    Ez akkor jó választás, ha
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-ivory/68">
                    {choiceFitPromise(product).map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full border border-gold/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-ivory/48">
                    Nem ezt keresed, ha
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-ivory/58">
                    {wrongFitPromise(product).map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full border border-ivory/35" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-gold/75">
                    Miben lesz személyesebb?
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-ivory/68">
                    {product.depthPromise.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full border border-gold/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md border border-gold/15 bg-[oklch(0.78_0.10_80/0.055)] p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-gold/75">
                    Minőségi ellenőrzés
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-ivory/68">
                    {qualityReviewPromise(product).map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/10 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-gold/75">
                    Teljesítési biztonság
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-ivory/68">
                    {fulfillmentPromise(product.category).map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full border border-gold/70" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {inputSummary.length > 0 && (
                  <div className="rounded-md border border-[oklch(0.78_0.10_80/0.16)] bg-black/10 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-gold/75">
                      Amit figyelembe veszünk
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-ivory/68">
                      {inputSummary.map((item) => (
                        <li
                          key={`${item.label}:${item.value}`}
                          className="grid gap-1 sm:grid-cols-[7rem_1fr]"
                        >
                          <span className="text-ivory/45">{item.label}</span>
                          <span>{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3 rounded-md border border-gold/15 bg-gold/[0.06] p-4 text-xs leading-relaxed text-ivory/62">
                  <div>
                    <div className="mb-2 font-medium text-ivory/82">Vásárlás menete</div>
                    <ol className="space-y-1.5">
                      {checkoutSteps(product.category, deliveryLabel, isLoggedIn).map((step) => (
                        <li key={step} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="mb-1 font-medium text-ivory/82">Kézbesítés</div>
                    <p>{accessSummary}</p>
                  </div>
                  <div>
                    <div className="mb-1 font-medium text-ivory/82">Biztonság</div>
                    <p>A kártyaadatot nem tároljuk; a fizetést Stripe dolgozza fel.</p>
                  </div>
                  {!canStartPayment && (
                    <div className="rounded-md border border-gold/20 bg-black/20 px-3 py-2 text-ivory/68">
                      A fizetés előkészítése most nem elérhető. Kártyaadat ilyenkor nem jut el
                      hozzánk; írj nekünk a vásárlási email címedről, és a választott olvasatot
                      rendelés előtt segítünk rendezni.
                    </div>
                  )}
                  <div>
                    <div className="mb-1 font-medium text-ivory/82">Segítség</div>
                    <p>
                      Ha a hozzáférés megakad, rendelés alapján utánanézünk és segítünk:{" "}
                      <a
                        className="text-gold hover:text-gold/80"
                        href={supportMailto}
                      >
                        {SITE_LEGAL.supportEmail}
                      </a>
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {canExpress && (
              <label className="flex items-start gap-3 p-3 rounded-md border border-[oklch(0.78_0.10_80/0.18)] cursor-pointer text-sm text-ivory/75">
                <input
                  type="checkbox"
                  checked={express}
                  onChange={(e) => setExpress(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Express gyorsítás 6 órán belül · +{formatHuf(EXPRESS_PRICE_HUF)}
                  <span className="block text-xs text-ivory/45 mt-1">
                    Ha nem sürgős, a normál kézbesítés kedvezőbb.
                  </span>
                </span>
              </label>
            )}

            <div className="rounded-md border border-[oklch(0.78_0.10_80/0.14)] bg-black/10 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
                Olvasat határai
              </div>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ivory/56">
                <li>Nem mond biztos jövőt, visszatérést vagy másik ember döntését kész tényként.</li>
                <li>Nem választ helyetted; a mintát, tempót és belső fókuszt segít tisztábban látni.</li>
                <li>Nem orvosi, jogi, pénzügyi, pszichológiai vagy krízistanácsadás.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-md border border-[oklch(0.78_0.10_80/0.18)] cursor-pointer text-sm text-ivory/75">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1"
              />
              <span>
                Elfogadom az{" "}
                <Link to="/aszf" className="text-gold hover:text-gold/80">
                  ÁSZF-et
                </Link>
                , az{" "}
                <Link to="/adatkezelesi-tajekoztato" className="text-gold hover:text-gold/80">
                  adatkezelési tájékoztatót
                </Link>{" "}
                valamint az{" "}
                <Link to="/elallasi-tajekoztato" className="text-gold hover:text-gold/80">
                  elállási tájékoztatót
                </Link>
                ; kérem a digitális tartalom teljesítésének megkezdését a fizetés után, és
                tudomásul veszem, hogy az elkészült digitális olvasatnál az elállási jog korlátozott
                lehet. Ha a hozzáférés megakad, rendelés alapján utánanézünk és segítünk.
              </span>
            </label>

            <button
              disabled={!email || !emailValid || !termsAccepted || !canStartPayment}
              onClick={() => {
                if (!canStartPayment) return;
                setEmail(normalizedEmail);
                trackEvent("checkout_confirmed", {
                  productSlug: product.slug,
                  category: product.category,
                  express: express && canExpress,
                  sourceRoute,
                });
                setConfirmed(true);
              }}
              className="w-full btn-gold disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50 disabled:shadow-none"
            >
              Tovább a fizetéshez · {formatHuf(total)}
            </button>
            {checkoutBlocker && (
              <p className="text-center text-xs leading-relaxed text-ivory/50">
                {checkoutBlocker}
              </p>
            )}
            <p className="text-[10px] text-ivory/40 text-center">
              Régi jelképrendszerekből készült önismereti olvasat. Nem orvosi, jogi vagy
              pénzügyi tanácsadás.
            </p>
          </div>
        ) : (
          <StripeEmbeddedCheckoutForm
            productSlug={productSlug}
            express={express && canExpress}
            customerEmail={normalizedEmail}
            userId={user?.id}
            inputPayload={inputPayload}
            sourceRoute={sourceRoute}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function normalizeCheckoutEmailInput(value: string): string {
  return value.trim().toLocaleLowerCase("hu-HU");
}

function isCheckoutEmailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function checkoutBlockerText({
  email,
  emailValid,
  termsAccepted,
  canStartPayment,
}: {
  email: string;
  emailValid: boolean;
  termsAccepted: boolean;
  canStartPayment: boolean;
}): string | null {
  if (!canStartPayment) {
    return "A fizetés indításához most segítség kell. Kártyaadat ilyenkor nem jut el hozzánk; írj nekünk a vásárlási email címedről, és a választott olvasatot rendelés előtt segítünk rendezni.";
  }
  if (!email) {
    return "A fizetéshez először add meg azt az email címet, ahol később is eléred az olvasatot.";
  }
  if (!emailValid) {
    return "A fizetéshez javítsd az email címet; erre küldjük az olvasathoz tartozó értesítést.";
  }
  if (!termsAccepted) {
    return "A fizetés előtt fogadd el a feltételeket; utána indítható a bankkártyás fizetés.";
  }
  return null;
}

function checkoutDeliverySummary(
  category: ProductDef["category"],
  deliveryLabel: string,
  isLoggedIn: boolean,
): string {
  const access = isLoggedIn
    ? "ezen az oldalon, emailben és a profilodban"
    : "ezen az oldalon és emailben";
  if (category === "instant") return `${deliveryLabel} · ${access}`;
  return `${deliveryLabel} · ${access}`;
}

function checkoutSteps(
  category: ProductDef["category"],
  deliveryLabel: string,
  isLoggedIn: boolean,
): string[] {
  if (category === "instant") {
    return [
      "Fizetés után azonnal elkészítjük az olvasatot.",
      isLoggedIn
        ? "A köszönőoldalon rögtön megnyílik, és a profilodban is visszanézhető."
        : "A köszönőoldalon rögtön megnyílik; vendégként a biztonságos linket és az emailt érdemes megtartanod.",
      "Emailben is jelzünk, ezért fontos a pontos email cím.",
    ];
  }

  return [
    `Fizetés után rögzítjük a kérdésedet és a megadott adatokat; az olvasat ${deliveryLabel} készül el.`,
    isLoggedIn
      ? "A rendelés állapotát a köszönőoldalon és a profilodban is követheted."
      : "A rendelés állapotát a köszönőoldali biztonságos linken követheted.",
    isLoggedIn
      ? "Elkészüléskor emailt küldünk, de az olvasat akkor is megjelenik a profilodban, ha az email késik."
      : "Elkészüléskor emailt küldünk, de az olvasat a köszönőoldali linken is megnyílik, ha az email késik.",
  ];
}

function deliveryAccessText(isLoggedIn: boolean): string {
  if (isLoggedIn) {
    return "Az olvasat a köszönőoldalon azonnal megnyílik, a profilodban később is visszanézhető, kimásolható és letölthető, emailben pedig értesítést küldünk.";
  }
  return "Vendégként az olvasatot a köszönőoldali biztonságos linken és emailben éred el. A rendelési linket érdemes megtartanod; az elkészült olvasat kimásolható és letölthető.";
}

function readingFormatPromise(product: ProductDef): string {
  if (product.slug === "kelta_kereszt") {
    return "hosszabb, 10 lapos riport több szakaszban, összefüggő lezáró résszel.";
  }
  if (product.category === "delayed") {
    return "részletesebb, több szakaszos írásos elemzés összefüggő lezáró résszel.";
  }
  if (product.slug === "horoszkop_szemelyre" || product.slug === "alomfejtes_rovid") {
    return "rövid, személyes írásos olvasat 3-5 jól olvasható résszel.";
  }
  return "azonnali, rövid írásos olvasat néhány fókuszált bekezdésben.";
}

function priceFitNudge(product: ProductDef): string | null {
  if (product.category === "delayed") {
    return "Ezt akkor válaszd, ha tényleg többoldalas, születési adatokra épülő időszaki elemzést szeretnél. Ha csak kipróbálnád a hangot, elég lehet egy olcsóbb azonnali olvasat.";
  }
  if (product.priceHuf >= 900) {
    return "Ez mélyebb azonnali olvasat. Ha most csak rövid próbát szeretnél, a belépő olvasatok olcsóbbak; ha viszont visszatérő kérdésed van, ez ad több kapaszkodót.";
  }
  return null;
}

function choiceFitPromise(product: ProductDef): string[] {
  if (product.slug === "kelta_kereszt") {
    return [
      "nem egyetlen igen-nem kérdésed van, hanem több egymásba kapaszkodó szál",
      "szeretnéd látni, mi tart vissza, mi mozgat belül és merre nyílhat tovább a helyzet",
      "azonnali választ szeretnél, de nagyobb szerkezetben, több tarot-pozícióval",
    ];
  }
  if (product.slug === "parkapcsolat_elemzes") {
    return [
      "nem csak százalékot szeretnél, hanem érteni akarod kettőtök dinamikáját",
      "ex, visszatérő történet vagy új ismeretség esetén különösen fontos a helyzet típusa",
      "a vonzalom mellett a kommunikáció és hosszabb távú minta is érdekel",
    ];
  }
  if (product.slug === "dontes_komplex") {
    return [
      "nem azt várod, hogy valaki döntsön helyetted, hanem tisztábban szeretnéd látni a mintát",
      "a kérdés mögött egyszerre van félelem, vágy és gyakorlati következmény",
      "részletesebb, több nézőpontú választ szeretnél egy rövid lapjelentésnél",
    ];
  }
  if (product.category === "delayed") {
    return [
      "a kérdésed napok óta visszatér, és egy rövid válasz kevés lenne",
      "fontos, hogy a megadott adataid és a helyzeted több szakaszban jelenjen meg",
      "nem azonnali impulzust, hanem átgondoltabb írásos elemzést szeretnél",
    ];
  }
  if (product.slug === "horoszkop_szemelyre") {
    return [
      "az általános jegyszöveg helyett a saját mostani témádra kérsz rövid választ",
      "elég egy gyors, személyes napi irány, nem hosszú asztrológiai riportot keresel",
      "fontos, hogy a szöveg józan maradjon és ne ígérjen biztos jövőt",
    ];
  }
  if (product.slug === "alomfejtes_rovid") {
    return [
      "van egy erős álomkép vagy érzés, amit önismereti jelként szeretnél kibontani",
      "nem diagnózist vársz, hanem rövid, érthető szimbolikus értelmezést",
      "a konkrét álomszövegedre reagáló választ szeretnél",
    ];
  }
  return [
    "gyors, olcsó próbaolvasatot szeretnél, mielőtt mélyebb elemzést kérsz",
    "egy konkrét kérdésre vagy napi helyzetre elég néhány fókuszált bekezdés",
    "azonnali visszajelzést keresel, nem hosszú írásos riportot",
  ];
}

function wrongFitPromise(product: ProductDef): string[] {
  if (product.slug === "parkapcsolat_elemzes") {
    return [
      "biztos választ vársz arra, hogy visszajön-e, szeret-e vagy írni fog-e",
      "egy másik ember döntését szeretnéd kész tényként kimondatni",
    ];
  }
  if (product.slug === "dontes_komplex") {
    return [
      "azt várod, hogy az olvasat helyetted válasszon két út között",
      "jogi, pénzügyi vagy egészségügyi döntéshez kérsz szakmai tanácsot",
    ];
  }
  if (product.slug === "kristaly_ai") {
    return [
      "testi vagy lelki hatásígéretet keresel",
      "orvosi vagy terápiás tanács helyett próbálnád használni",
    ];
  }
  if (product.slug === "alomfejtes_rovid") {
    return [
      "diagnózist, traumamagyarázatot vagy biztos lelki okot vársz",
      "az álmot szó szerinti jóslatként szeretnéd kezelni",
    ];
  }
  if (product.slug === "horoszkop_szemelyre") {
    return [
      "részletes születési képletet vagy hosszú tranzitriportot keresel",
      "biztos eseményjóslatot vársz a mai napra",
    ];
  }
  if (product.category === "delayed") {
    return [
      "azonnali, pár perces választ szeretnél",
      "biztos dátumot, eredményt vagy megváltozhatatlan jövőt vársz",
    ];
  }
  return [
    "biztos jövőállítást vagy kész döntést vársz",
    "orvosi, jogi vagy pénzügyi tanács helyett használnád",
  ];
}

function qualityReviewPromise(product: ProductDef): string[] {
  const base = [
    "minden olvasat a választott hagyomány jelképeit a megadott helyzethez köti",
    "a válasz nem tartalmazhat biztos jövőígéretet vagy ijesztgető állítást",
  ];
  if (product.category === "delayed") {
    return [...base, "a részletes olvasatnak több, egymásra épülő szakaszban kell választ adnia"];
  }
  return [
    ...base,
    "az azonnali olvasatnak rövidnek, de konkrétan a megadott helyzethez kötöttnek kell lennie",
  ];
}

function fulfillmentPromise(category: ProductDef["category"]): string[] {
  const base = [
    "ha a hozzáférés megakad, rendelés alapján utánanézünk és segítünk",
    "ha a szöveg hibásan jelenik meg, javítjuk vagy újraküldjük a vásárlási email címed alapján",
  ];
  if (category === "delayed") {
    return [
      ...base,
      "a részletes olvasatoknál a vállalt határidőt és az elkészült állapotot a rendelési linken követheted",
    ];
  }
  return [...base, "az azonnali olvasatoknál pár perces feldolgozási késés még normális lehet"];
}

function readingFocusPreview(
  product: ProductDef,
  payload: Record<string, unknown> | undefined,
  summary: Array<{ label: string; value: string }>,
): string[] {
  if (!payload || summary.length === 0) return [];
  const get = (label: string) => summary.find((item) => item.label === label)?.value;
  const lines: string[] = [];
  const question = get("Kérdés");
  const situation = get("Helyzet") ?? get("Téma");
  const cards = get("Lapok") ?? get("Lap");
  const sign = get("Jegy");
  const dates = get("Dátumok") ?? get("Születési dátum");
  const names = get("Nevek") ?? get("Név") ?? get("Megszólítás");
  const dream = get("Álom");
  const crystal = get("Kristály");
  const number = get("Szám") ?? get("Gyökérszám") ?? get("Személyes év");

  if (question) {
    lines.push(`A fő fókusz a saját kérdésed lesz: „${question}”.`);
  } else if (situation) {
    lines.push(`A szöveg a megadott helyzetből indul ki: „${situation}”.`);
  }

  if (product.slug === "parkapcsolat_elemzes") {
    lines.push(
      situation
        ? `A kapcsolat típusát külön kezeljük, ezért más hangot kap egy új ismeretség, egy ex vagy egy visszatérő történet.`
        : "A kapcsolat mintáját nem csak százalékként, hanem kommunikáció, vonzalom és hosszabb táv szerint bontjuk ki.",
    );
  } else if (product.slug === "dontes_komplex") {
    lines.push(
      "A válasz nem dönt helyetted; azt keresi, mi húz, mi tart vissza, és hol tisztulhat a következő lépés.",
    );
  } else if (product.slug === "harom_lap_mely" || product.slug === "kelta_kereszt") {
    lines.push("A lapokat nem külön-külön magyarázzuk, hanem egy összefüggő történetté rendezzük.");
  } else if (product.slug === "horoszkop_szemelyre") {
    lines.push("A jegyedet és a mostani témádat rövid, személyes napi iránnyá kapcsoljuk össze.");
  } else if (product.slug === "szammisztika_eletut") {
    lines.push(
      "A születési adatokból és a névből személyesebb életút-mintát állítunk össze.",
    );
  }

  if (cards) lines.push(`A húzott lapok is bekerülnek a fókuszba: ${cards}.`);
  if (dates) lines.push(`A számolási alap: ${dates}${names ? ` · ${names}` : ""}.`);
  if (sign) lines.push(`A horoszkóp fókusza: ${sign}.`);
  if (dream) lines.push(`Az álomszövegedből indulunk ki, nem előre írt álomszótár-szövegből.`);
  if (crystal) lines.push(`A kristályt szimbolikus önismereti jelként kezeljük: ${crystal}.`);
  if (number) lines.push(`A megadott számot személyesebb jelentésréteggé bontjuk: ${number}.`);

  if (!lines.length) {
    lines.push("A fizetett olvasat a megadott adataidból és a választott olvasattípusból indul.");
  }

  return lines.slice(0, 3);
}

function contextualProductAlternative(
  product: ProductDef,
  payload: Record<string, unknown> | undefined,
  sourceRoute: string | undefined,
): { product: ProductDef; reason: string } | null {
  if (product.category === "delayed") return null;
  const text = [
    sourceRoute,
    payloadText(payload, "question"),
    payloadText(payload, "q"),
    payloadText(payload, "situation"),
    payloadText(payload, "sit"),
    payloadText(payload, "status"),
    payloadText(payload, "category"),
    payloadText(payload, "cat"),
    payloadText(payload, "memoryContext"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const pick = (slug: string, reason: string) => {
    const candidate = PRODUCTS_BY_SLUG[slug];
    if (!candidate || candidate.slug === product.slug) return null;
    return { product: candidate, reason };
  };

  if (product.slug === "horoszkop_szemelyre" || sourceRoute?.startsWith("/horoszkop")) {
    if (/(éves|12 hónap|következő év|egész év|egy év)/.test(text)) {
      return pick(
        "personal_yearly",
        "Ha nem mai irányt, hanem hosszabb éves ívet kérsz, az éves riport természetesebb választ ad.",
      );
    }
    if (/(tranzit|most ható|bolygó|időzítés|fordulópont)/.test(text)) {
      return pick(
        "transits_personal",
        "Ha az érdekel, milyen időzítésben mozog most a helyzeted, a tranzit-elemzés pontosabb keret.",
      );
    }
    if (/(30 nap|következő hónap|hónap|hetek|időszak|előrejelzés)/.test(text)) {
      return pick(
        "personal_30_day",
        "Ha nem csak rövid napi választ keresel, hanem a következő hetek ívét, a 30 napos térkép jobb illeszkedés.",
      );
    }
  }

  if (
    (product.slug === "napi_lap_ai" || product.slug === "extra_huzas") &&
    /(dönt|válassz|munkahely|állás|költöz|szakíts|maradjak|menjek|elfogadjam)/.test(text)
  ) {
    return pick(
      "dontes_komplex",
      "Ha valódi döntési helyzet van mögötte, a komplex döntés-elemzés többet ad egy napi lapnál.",
    );
  }

  if (
    product.slug !== "parkapcsolat_elemzes" &&
    /(ex|visszatér|kapcsolat|randi|szeret|összeill|ismerked)/.test(text)
  ) {
    return pick(
      "parkapcsolat_elemzes",
      "Kapcsolati kérdésnél jobb, ha a válasz külön kezeli a tempót, a vonzalmat és a visszatérő mintát.",
    );
  }

  return null;
}

function payloadText(payload: Record<string, unknown> | undefined, key: string): string {
  const value = payload?.[key];
  return typeof value === "string" ? value : "";
}

function paywallSupportMailto(input: {
  product: ProductDef;
  sourceRoute?: string;
  inputSummary: Array<{ label: string; value: string }>;
}): string {
  const subject = `Jövőd.hu rendelési segítség - ${input.product.name}`;
  const body = [
    "Segítséget szeretnék kérni a rendeléshez vagy a fizetés előkészítéséhez.",
    "",
    `Termék: ${input.product.name}`,
    `Ár: ${formatHuf(input.product.priceHuf)}`,
    input.sourceRoute ? `Oldal: ${input.sourceRoute}` : null,
    ...input.inputSummary.map((item) => `${item.label}: ${item.value}`),
    "",
    "A vásárlási email címem:",
    "Mi történt röviden:",
    "",
    "Köszönöm.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function summarizeInputPayload(
  payload: Record<string, unknown> | undefined,
): Array<{ label: string; value: string }> {
  if (!payload) return [];
  const items: Array<{ label: string; value: string }> = [];
  const add = (label: string, value: unknown, max = 140) => {
    if (items.length >= 4 || typeof value !== "string" || !value.trim()) return;
    const clean = value.trim().replace(/\s+/g, " ");
    items.push({ label, value: clean.length > max ? `${clean.slice(0, max - 1)}…` : clean });
  };
  const addNumber = (label: string, value: unknown) => {
    if (items.length >= 4) return;
    if (typeof value === "number" && Number.isFinite(value)) {
      items.push({ label, value: String(value) });
    } else if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      items.push({ label, value: value.trim() });
    }
  };
  const addMonth = (value: unknown) => {
    if (items.length >= 4) return;
    const month = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(month) || month < 1 || month > 12) return;
    items.push({ label: "Hónap", value: MONTH_HU[month - 1] });
  };
  const addSign = (value: unknown) => {
    if (items.length >= 4 || typeof value !== "string" || !value.trim()) return;
    const clean = value.trim();
    items.push({ label: "Jegy", value: SIGN_HU[clean] ?? clean });
  };
  const addPair = (label: string, a: unknown, b: unknown, max = 120) => {
    if (items.length >= 4) return;
    const values = [a, b]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim().replace(/\s+/g, " "));
    if (!values.length) return;
    const clean = values.join(" · ");
    items.push({ label, value: clean.length > max ? `${clean.slice(0, max - 1)}…` : clean });
  };

  add("Név", payload.name ?? payload.fullName, 80);
  add("Megszólítás", payload.callName ?? payload.preferredName, 60);
  addPair("Nevek", payload.myName ?? payload.fullNameA, payload.hisName ?? payload.fullNameB);
  add("Születési dátum", payload.dob ?? payload.birthDate, 30);
  addPair("Dátumok", payload.myDob ?? payload.birthDateA, payload.hisDob ?? payload.birthDateB, 80);
  add("Kérdés", payload.question ?? payload.q);
  add("Helyzet", payload.sit ?? payload.status ?? payload.category ?? payload.cat, 90);
  add("Téma", payload.title ?? payload.situation, 100);
  add("Lap", payload.cardName, 80);
  addSign(payload.sign);
  addNumber("Szám", payload.number);
  addNumber("Gyökérszám", payload.root);
  addNumber("Személyes év", payload.personalYear);
  addMonth(payload.month);
  add("Kristály", payload.crystal, 60);
  add("Álom", payload.text, 120);
  add("Hangulat", payload.emotion, 60);

  const cards = payload.cards;
  if (items.length < 4 && Array.isArray(cards) && cards.length > 0) {
    const names = cards.filter((card): card is string => typeof card === "string").slice(0, 4);
    if (names.length) items.push({ label: "Lapok", value: names.join(", ") });
  }

  return items.slice(0, 4);
}

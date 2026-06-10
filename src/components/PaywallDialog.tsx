import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const total = product.priceHuf + (express && canExpress ? EXPRESS_PRICE_HUF : 0);
  const inputSummary = summarizeInputPayload(inputPayload);
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
      <DialogContent className="max-w-lg bg-[oklch(0.12_0.03_290)] border-[oklch(0.78_0.10_80/0.25)] text-ivory">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-ivory">{product.name}</DialogTitle>
          <DialogDescription className="text-ivory/65">{product.short}</DialogDescription>
        </DialogHeader>

        {!confirmed ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="font-display text-4xl text-gold-gradient">{formatHuf(total)}</div>
              <div className="text-xs text-ivory/55 mt-1">{deliverySummary}</div>
              {product.category === "delayed" && (
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ivory/50">
                  A részletes elemzést gondosabb szövegezéssel készítjük. Elkészüléskor ezen a
                  rendelési oldalon nyílik meg, emailben is jelzünk, bejelentkezve pedig a
                  profilodban is visszanézhető.
                </p>
              )}
            </div>

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
                  A fizetés előkészítése most nem elérhető. Kérlek próbáld újra később, vagy írj
                  nekünk, és segítünk a rendelésben.
                </div>
              )}
              <div>
                <div className="mb-1 font-medium text-ivory/82">Segítség</div>
                <p>
                  Technikai hiba esetén pótoljuk a teljesítést vagy utánanézünk:{" "}
                  <a
                    className="text-gold hover:text-gold/80"
                    href={`mailto:${SITE_LEGAL.supportEmail}`}
                  >
                    {SITE_LEGAL.supportEmail}
                  </a>
                </p>
              </div>
            </div>

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
                placeholder="te@pelda.hu"
                className="w-full bg-transparent border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-4 py-3 text-ivory placeholder:text-ivory/40 focus:border-gold outline-none"
              />
              {!user && (
                <p className="text-xs text-ivory/45 mt-1">Vendég vásárlás — fiók nem kötelező.</p>
              )}
              {email && !emailValid && (
                <p className="mt-1 text-xs text-gold/75">
                  Kérlek ellenőrizd az email címet, ide küldjük az olvasatot is.
                </p>
              )}
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
                ; kérem a digitális tartalom teljesítésének megkezdését a fizetés után.
              </span>
            </label>

            <button
              disabled={!email || !emailValid || !termsAccepted || !canStartPayment}
              onClick={() => {
                if (!canStartPayment) return;
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
            <p className="text-[10px] text-ivory/40 text-center">
              Szimbolikus, önismereti digitális tartalom. Nem orvosi, jogi vagy pénzügyi tanácsadás.
            </p>
          </div>
        ) : (
          <StripeEmbeddedCheckoutForm
            productSlug={productSlug}
            express={express && canExpress}
            customerEmail={email}
            userId={user?.id}
            inputPayload={inputPayload}
            sourceRoute={sourceRoute}
          />
        )}
      </DialogContent>
    </Dialog>
  );
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
    return "részletesebb, több szakaszos írásos elemzés, nem automatikus sablonválasz.";
  }
  if (product.slug === "horoszkop_szemelyre" || product.slug === "alomfejtes_rovid") {
    return "rövid, személyes írásos olvasat 3-5 jól olvasható résszel.";
  }
  return "azonnali, rövid írásos olvasat néhány fókuszált bekezdésben.";
}

function choiceFitPromise(product: ProductDef): string[] {
  if (product.slug === "kelta_kereszt") {
    return [
      "nem egyetlen igen-nem kérdésed van, hanem több egymásba kapaszkodó szál",
      "szeretnéd látni, mi tart vissza, mi mozgat belül és merre nyílhat tovább a helyzet",
      "ráérsz megvárni a részletesebb, hosszabb írásos riportot",
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

function qualityReviewPromise(product: ProductDef): string[] {
  const base = [
    "nem jelenítünk meg nyers idegen nyelvű háttérszöveget",
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
    "ha technikai hiba miatt nem nyílik meg az olvasat, utánanézünk és pótoljuk a hozzáférést",
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

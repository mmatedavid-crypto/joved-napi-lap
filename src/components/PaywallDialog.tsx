import { useState } from "react";
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
import { MONTH_HU } from "@/lib/crystal.hu";
import { SITE_LEGAL } from "@/lib/legal";
import { EXPRESS_PRICE_HUF, PRODUCTS_BY_SLUG, formatHuf } from "@/lib/products";
import { SIGN_HU } from "@/lib/roxyNormalize";

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

  if (!product) return null;

  const canExpress = product.category === "delayed";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const total = product.priceHuf + (express && canExpress ? EXPRESS_PRICE_HUF : 0);
  const inputSummary = summarizeInputPayload(inputPayload);
  const deliveryLabel =
    product.category === "instant"
      ? "azonnal, fizetés után"
      : express
        ? "6 órán belül"
        : `${product.standardHours ?? 24} órán belül`;

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
              <div className="text-xs text-ivory/55 mt-1">
                {deliveryLabel} · a profilodban és ezen az oldalon
              </div>
              {product.category === "delayed" && (
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ivory/50">
                  A részletes elemzést gondosabb szövegezéssel készítjük. Elkészüléskor ezen a
                  rendelési oldalon nyílik meg, és emailben is jelzünk.
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
              <p className="mt-3 border-t border-[oklch(0.78_0.10_80/0.14)] pt-3 text-xs leading-relaxed text-ivory/55">
                {product.qualityPromise}
              </p>
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
                <div className="mb-1 font-medium text-ivory/82">Kézbesítés</div>
                <p>
                  Az olvasat a köszönőoldalon, bejelentkezve a profilban, és emailben is elérhető.
                </p>
              </div>
              <div>
                <div className="mb-1 font-medium text-ivory/82">Biztonság</div>
                <p>A kártyaadatot nem tároljuk; a fizetést Stripe dolgozza fel.</p>
              </div>
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
              disabled={!email || !emailValid || !termsAccepted}
              onClick={() => setConfirmed(true)}
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

  const dates = [payload.myDob, payload.hisDob, payload.birthDateA, payload.birthDateB].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  if (items.length < 4 && dates.length >= 2) {
    items.push({ label: "Dátumok", value: `${dates[0]} · ${dates[1]}` });
  }

  return items.slice(0, 4);
}

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
import { EXPRESS_PRICE_HUF, PRODUCTS_BY_SLUG, formatHuf } from "@/lib/products";

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
  const total = product.priceHuf + (express && canExpress ? EXPRESS_PRICE_HUF : 0);
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
                és kérem a digitális tartalom teljesítésének megkezdését a fizetés után.
              </span>
            </label>

            <button
              disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !termsAccepted}
              onClick={() => setConfirmed(true)}
              className="w-full btn-gold disabled:cursor-not-allowed disabled:opacity-45 disabled:saturate-50 disabled:shadow-none"
            >
              Tovább a fizetéshez · {formatHuf(total)}
            </button>
            <p className="text-[10px] text-ivory/40 text-center">
              Biztonságos kártyás fizetés. Bankkártya, Apple Pay, Google Pay.
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

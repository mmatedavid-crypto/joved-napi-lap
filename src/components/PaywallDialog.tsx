import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StripeEmbeddedCheckoutForm } from "@/components/StripeEmbeddedCheckout";
import { useAuth } from "@/hooks/useAuth";
import { PRODUCTS_BY_SLUG, formatHuf, EXPRESS_PRICE_HUF, EXPRESS_HOURS } from "@/lib/products";

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
  const [express, setExpress] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!product) return null;

  const total =
    product.priceHuf + (express && product.category === "delayed" ? EXPRESS_PRICE_HUF : 0);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setConfirmed(false);
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
                {product.category === "instant"
                  ? "azonnali olvasat"
                  : `kiszállítás emailben ${express ? EXPRESS_HOURS + " órán" : "12–24 órán"} belül`}
              </div>
            </div>

            <div>
              <label className="block text-sm text-ivory/80 mb-1">Email cím (ide küldjük)</label>
              <input
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

            {product.category === "delayed" && (
              <label className="flex items-start gap-3 p-3 rounded-md border border-[oklch(0.78_0.10_80/0.2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={express}
                  onChange={(e) => setExpress(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="text-ivory">
                    Express — 6 órán belül{" "}
                    <span className="text-gold">+{formatHuf(EXPRESS_PRICE_HUF)}</span>
                  </div>
                  <div className="text-xs text-ivory/55">Soron kívül készítjük el.</div>
                </div>
              </label>
            )}

            <button
              disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
              onClick={() => setConfirmed(true)}
              className="w-full btn-gold"
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
            express={express}
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

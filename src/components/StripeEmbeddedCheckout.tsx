import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";
import { SITE_LEGAL } from "@/lib/legal";

export interface StripeEmbeddedCheckoutProps {
  productSlug: string;
  express: boolean;
  customerEmail: string;
  userId?: string;
  inputPayload?: Record<string, unknown>;
  sourceRoute?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckoutForm(props: StripeEmbeddedCheckoutProps) {
  const { productSlug, express, customerEmail, userId, inputPayload, sourceRoute, returnUrl } =
    props;
  const clientSecretPromise = useRef<Promise<string> | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const checkoutIdentity = JSON.stringify({
    productSlug,
    express,
    customerEmail,
    userId,
    inputPayload,
    sourceRoute,
    returnUrl,
  });

  useEffect(() => {
    clientSecretPromise.current = null;
    setCheckoutError(null);
  }, [checkoutIdentity]);

  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        if (clientSecretPromise.current) return clientSecretPromise.current;

        setCheckoutError(null);
        clientSecretPromise.current = (async () => {
          try {
            const checkoutReturnUrl =
              returnUrl || `${window.location.origin}/koszonjuk?session_id={CHECKOUT_SESSION_ID}`;
            const result = await createCheckoutSession({
              data: {
                productSlug,
                express,
                customerEmail,
                userId,
                inputPayload,
                sourceRoute,
                returnUrl: checkoutReturnUrl,
                environment: getStripeEnvironment(),
              },
            });

            if ("error" in result) throw new Error(result.error);
            if (!result.clientSecret) throw new Error("Nem jött vissza checkout azonosító");
            return result.clientSecret;
          } catch (error) {
            clientSecretPromise.current = null;
            setCheckoutError(safeCheckoutErrorMessage(error));
            throw error;
          }
        })();

        return clientSecretPromise.current;
      },
    }),
    [customerEmail, express, inputPayload, productSlug, returnUrl, sourceRoute, userId],
  );

  return (
    <div id="checkout" className="overflow-hidden rounded-lg bg-white">
      {checkoutError ? (
        <div className="bg-[oklch(0.12_0.03_290)] p-5 text-center text-ivory">
          <div className="font-display text-xl">Nem indult el a fizetés</div>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ivory/65">
            {checkoutError}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ivory/50">
            Ha már próbáltad újra, írj nekünk a vásárlási email címedről:{" "}
            <a className="text-gold hover:text-gold/80" href={`mailto:${SITE_LEGAL.supportEmail}`}>
              {SITE_LEGAL.supportEmail}
            </a>
            .
          </p>
          <button
            type="button"
            className="btn-gold mt-4"
            onClick={() => {
              clientSecretPromise.current = null;
              setCheckoutError(null);
              setRetryKey((value) => value + 1);
            }}
          >
            Újrapróbálom
          </button>
        </div>
      ) : (
        <EmbeddedCheckoutProvider key={retryKey} stripe={getStripe()} options={options}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  );
}

function safeCheckoutErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "Érvénytelen email cím") {
    return "Kérlek ellenőrizd az email címet, mert erre küldjük az olvasat értesítését is.";
  }
  if (message === "Ismeretlen termék") {
    return "Ezt az olvasatot most nem tudjuk fizetésre előkészíteni. Kérlek válassz újra a termékek közül.";
  }
  return "Most nem sikerült elindítani a fizetést. Kérlek próbáld újra pár perc múlva.";
}

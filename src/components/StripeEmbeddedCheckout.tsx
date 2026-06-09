import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useMemo, useRef, useState } from "react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";

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
  const clientSecretPromise = useRef<Promise<string> | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        if (clientSecretPromise.current) return clientSecretPromise.current;

        setCheckoutError(null);
        clientSecretPromise.current = (async () => {
          try {
            const returnUrl =
              props.returnUrl ||
              `${window.location.origin}/koszonjuk?session_id={CHECKOUT_SESSION_ID}`;
            const result = await createCheckoutSession({
              data: {
                productSlug: props.productSlug,
                express: props.express,
                customerEmail: props.customerEmail,
                userId: props.userId,
                inputPayload: props.inputPayload,
                sourceRoute: props.sourceRoute,
                returnUrl,
                environment: getStripeEnvironment(),
              },
            });

            if ("error" in result) throw new Error(result.error);
            if (!result.clientSecret) throw new Error("Nem jött vissza checkout azonosító");
            return result.clientSecret;
          } catch (error) {
            clientSecretPromise.current = null;
            const message = error instanceof Error ? error.message : "";
            setCheckoutError(
              message || "Most nem sikerült elindítani a fizetést. Kérlek próbáld újra később.",
            );
            throw error;
          }
        })();

        return clientSecretPromise.current;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [retryKey],
  );

  return (
    <div id="checkout" className="overflow-hidden rounded-lg bg-white">
      {checkoutError ? (
        <div className="bg-[oklch(0.12_0.03_290)] p-5 text-center text-ivory">
          <div className="font-display text-xl">Nem indult el a fizetés</div>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ivory/65">
            {checkoutError}
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

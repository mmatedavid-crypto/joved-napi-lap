import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useMemo, useRef } from "react";
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
  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        if (clientSecretPromise.current) return clientSecretPromise.current;

        const returnUrl =
          props.returnUrl || `${window.location.origin}/koszonjuk?session_id={CHECKOUT_SESSION_ID}`;
        clientSecretPromise.current = createCheckoutSession({
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
        })
          .then((result) => {
            if ("error" in result) throw new Error(result.error);
            if (!result.clientSecret) throw new Error("Nem jött vissza checkout azonosító");
            return result.clientSecret;
          })
          .catch((error) => {
            clientSecretPromise.current = null;
            throw error;
          });

        return clientSecretPromise.current;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div id="checkout" className="bg-white rounded-lg overflow-hidden">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useMemo } from "react";
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
  const options = useMemo(
    () => ({
      fetchClientSecret: async (): Promise<string> => {
        const returnUrl =
          props.returnUrl || `${window.location.origin}/koszonjuk?session_id={CHECKOUT_SESSION_ID}`;
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

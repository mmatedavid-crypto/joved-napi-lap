import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnvClient = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

function paymentsEnvironment(): StripeEnvClient {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "A fizetés még nincs élesítve. Fejezd be a Stripe verifikációt a Payments fülön.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnvClient {
  return paymentsEnvironment();
}

export function paymentsAvailable(): boolean {
  return !!(
    clientToken &&
    (clientToken.startsWith("pk_test_") || clientToken.startsWith("pk_live_"))
  );
}

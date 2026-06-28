import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnvClient = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
const CLIENT_PAYMENTS_UNAVAILABLE_ERROR =
  "A fizetés előkészítése most nem elérhető. Kártyaadat ilyenkor nem jut el hozzánk; indítsd újra nyugodtan, vagy írj nekünk a vásárlási email címedről.";

function paymentsEnvironment(): StripeEnvClient {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(CLIENT_PAYMENTS_UNAVAILABLE_ERROR);
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

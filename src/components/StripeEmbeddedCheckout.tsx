import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { getStripe, getStripeEnvironment, paymentsAvailable } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";
import { SITE_LEGAL } from "@/lib/legal";
import { trackEvent } from "@/lib/analytics";
import { PRODUCTS_BY_SLUG } from "@/lib/products";

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
  const canLoadStripe = paymentsAvailable();
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
            const environment = getStripeEnvironment();
            const checkoutReturnUrl =
              returnUrl || defaultCheckoutReturnUrl(environment);
            trackEvent("checkout_started", {
              productSlug,
              express,
              sourceRoute,
              environment,
            });
            const result = await createCheckoutSession({
              data: {
                productSlug,
                express,
                customerEmail,
                userId,
                inputPayload,
                sourceRoute,
                returnUrl: checkoutReturnUrl,
                environment,
              },
            });

            if ("error" in result) throw new CheckoutStartError(result.error);
            if (!result.clientSecret) throw new CheckoutStartError("checkout_start_failed");
            trackEvent("checkout_succeeded", { productSlug, express, sourceRoute, environment });
            return result.clientSecret;
          } catch (error) {
            clientSecretPromise.current = null;
            setCheckoutError(safeCheckoutErrorMessage(error));
            trackEvent("checkout_failed", {
              productSlug,
              express,
              sourceRoute,
              reason: safeCheckoutErrorReason(error),
            });
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
      {checkoutError || !canLoadStripe ? (
        <div className="bg-[oklch(0.12_0.03_290)] p-5 text-center text-ivory">
          <div className="font-display text-xl">Nem indult el a fizetés</div>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ivory/65">
            {checkoutError ??
              "A fizetés előkészítése most nem elérhető. Kártyaadat ilyenkor nem jut el hozzánk; próbáld újra, vagy írj nekünk a vásárlási email címedről."}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ivory/50">
            Ha már próbáltad újra, a választott olvasatot és a hozzáférést kézzel is segítünk rendezni:{" "}
            <a
              className="text-gold hover:text-gold/80"
              href={checkoutSupportMailto({ productSlug, sourceRoute })}
            >
              {SITE_LEGAL.supportEmail}
            </a>
            .
          </p>
          <button
            type="button"
            className="btn-gold mt-4"
            disabled={!canLoadStripe}
            onClick={() => {
              if (!canLoadStripe) return;
              clientSecretPromise.current = null;
              setCheckoutError(null);
              trackEvent("checkout_retry_clicked", { productSlug, express, sourceRoute });
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

function defaultCheckoutReturnUrl(environment: "sandbox" | "live"): string {
  const origin = environment === "live" ? SITE_LEGAL.siteUrl : window.location.origin;
  return `${origin}/koszonjuk?session_id={CHECKOUT_SESSION_ID}`;
}

function checkoutSupportMailto(input: { productSlug: string; sourceRoute?: string }): string {
  const productName = PRODUCTS_BY_SLUG[input.productSlug]?.name ?? input.productSlug;
  const subject = `Jövőd.hu fizetési segítség - ${productName}`;
  const body = [
    "Segítséget szeretnék kérni, mert nem indult el a fizetés.",
    "",
    `Termék: ${productName}`,
    input.sourceRoute ? `Oldal: ${input.sourceRoute}` : null,
    "A vásárlási email címem:",
    "Mi történt röviden:",
    "",
    "Köszönöm.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return `mailto:${SITE_LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function safeCheckoutErrorReason(error: unknown): string {
  if (error instanceof CheckoutStartError) return error.code;
  const message = error instanceof Error ? error.message : "";
  if (message === "Érvénytelen email cím") return "invalid_email";
  if (message === "Ismeretlen termék") return "unknown_product";
  if (message === "Érvénytelen felhasználói azonosító") return "invalid_user_id";
  if (message === "Érvénytelen visszatérési cím") return "invalid_return_url";
  return "checkout_start_failed";
}

function safeCheckoutErrorMessage(error: unknown): string {
  if (error instanceof CheckoutStartError) return checkoutErrorMessageByCode(error.code);
  const message = error instanceof Error ? error.message : "";
  if (message === "Érvénytelen email cím") {
    return checkoutErrorMessageByCode("invalid_email");
  }
  if (message === "Ismeretlen termék") {
    return checkoutErrorMessageByCode("unknown_product");
  }
  if (message === "Érvénytelen felhasználói azonosító") {
    return checkoutErrorMessageByCode("invalid_user_id");
  }
  if (message === "Érvénytelen visszatérési cím") {
    return checkoutErrorMessageByCode("invalid_return_url");
  }
  return checkoutErrorMessageByCode("checkout_start_failed");
}

type CheckoutErrorCode =
  | "invalid_email"
  | "unknown_product"
  | "invalid_user_id"
  | "missing_product_price"
  | "missing_express_price"
  | "invalid_return_url"
  | "checkout_session_unavailable"
  | "order_insert_failed"
  | "checkout_start_failed";

class CheckoutStartError extends Error {
  constructor(readonly code: CheckoutErrorCode) {
    super(code);
    this.name = "CheckoutStartError";
  }
}

function checkoutErrorMessageByCode(code: CheckoutErrorCode): string {
  if (code === "invalid_email") {
    return "Kérlek ellenőrizd az email címet, mert erre küldjük az olvasat értesítését is.";
  }
  if (code === "unknown_product") {
    return "Ezt az olvasatot most nem tudjuk fizetésre előkészíteni. Kérlek válassz újra a termékek közül.";
  }
  if (code === "invalid_user_id") {
    return "A bejelentkezésedet most nem tudtuk összekötni a fizetéssel. Frissítsd az oldalt, majd próbáld újra.";
  }
  if (code === "invalid_return_url") {
    return "A fizetés visszaigazoló oldala most nem állítható be biztonságosan. Frissítsd az oldalt, majd próbáld újra.";
  }
  return "Most nem sikerült elindítani a fizetést. Kártyaadat ilyenkor nem jut el hozzánk; próbáld újra pár perc múlva, vagy írj nekünk a vásárlási email címedről.";
}

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken && !import.meta.env.PROD) {
    return (
      <div className="w-full bg-red-950/60 border-b border-red-500/40 px-4 py-2 text-center text-xs text-red-200">
        A fizetés még nincs élesítve — fejezd be a Stripe verifikációt a Payments fülön.
      </div>
    );
  }
  if (!clientToken) return null;

  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-amber-900/40 border-b border-amber-500/30 px-4 py-1.5 text-center text-[11px] text-amber-200">
        Teszt mód: a fizetések most még nem valódiak. Tesztkártya:{" "}
        <code className="font-mono">4242 4242 4242 4242</code>.
      </div>
    );
  }
  return null;
}

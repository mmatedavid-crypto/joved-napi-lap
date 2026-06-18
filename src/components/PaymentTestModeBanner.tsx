const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken && !import.meta.env.PROD) {
    return (
      <div className="w-full bg-red-950/60 border-b border-red-500/40 px-4 py-2 text-center text-xs text-red-200">
        A fizetés ezen a környezeten most nem indítható. Kártyaadat ilyenkor nem jut el hozzánk.
      </div>
    );
  }
  if (!clientToken) return null;

  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full bg-amber-900/40 border-b border-amber-500/30 px-4 py-1.5 text-center text-[11px] text-amber-200">
        Próba fizetési mód: itt nem indul valódi terhelés.
      </div>
    );
  }
  return null;
}

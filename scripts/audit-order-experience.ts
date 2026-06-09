import { readFileSync } from "node:fs";

type Check = {
  name: string;
  file: string;
  includes: string[];
};

const checks: Check[] = [
  {
    name: "checkout stores source route",
    file: "src/lib/payments.functions.ts",
    includes: ["source_route: data.sourceRoute ?? null", "stripe_environment: data.environment"],
  },
  {
    name: "checkout survives pending migration",
    file: "src/lib/payments.functions.ts",
    includes: [
      "insertOrderWithMigrationFallback",
      "isMissingColumnError",
      "inserting order without fallback fields",
    ],
  },
  {
    name: "pending payment can be reconciled server-side",
    file: "src/lib/payments.functions.ts",
    includes: [
      "PAYMENT_RECHECK_INTERVAL_MS",
      "reconcilePendingPayment",
      "ORDER_SELECT_BASE",
      "stripe.checkout.sessions.retrieve(sessionId)",
      "session.payment_status",
    ],
  },
  {
    name: "webhook marks payment recheck state",
    file: "src/routes/api/public/payments/webhook.ts",
    includes: ["payment_rechecked_at: new Date().toISOString()"],
  },
  {
    name: "thank-you page can read source route",
    file: "src/lib/payments.functions.ts",
    includes: ["guest_email, source_route", "created_at, source_route"],
  },
  {
    name: "paid memory keeps source route",
    file: "src/lib/orderProcessing.server.ts",
    includes: ["source_route, response_payload", "source_route: order.source_route"],
  },
  {
    name: "thank-you page exposes continuation CTA",
    file: "src/routes/koszonjuk.tsx",
    includes: ["Innen folytathatod", "Vissza az olvasathoz"],
  },
  {
    name: "thank-you page exposes support contact",
    file: "src/routes/koszonjuk.tsx",
    includes: ["SupportContact", "SITE_LEGAL.supportEmail", "Ügyfélszolgálat"],
  },
  {
    name: "profile prefers stored source route",
    file: "src/routes/profil.tsx",
    includes: ["source_route?: string | null", "o.source_route ?? PRODUCTS_BY_SLUG"],
  },
  {
    name: "profile explains paid order status",
    file: "src/routes/profil.tsx",
    includes: [
      "OrderStatusNote",
      "A fizetés állapotát még egyeztetjük",
      "Az olvasat készül",
      "A feldolgozás elakadt",
      "SITE_LEGAL.supportEmail",
    ],
  },
  {
    name: "order reconciliation migration exists",
    file: "supabase/migrations/20260609143000_order_payment_reconciliation.sql",
    includes: ["stripe_environment TEXT", "payment_rechecked_at TIMESTAMPTZ"],
  },
];

const failed: string[] = [];

for (const check of checks) {
  const body = readFileSync(check.file, "utf8");
  const missing = check.includes.filter((needle) => !body.includes(needle));
  if (missing.length) failed.push(`${check.name}: missing ${missing.join(", ")}`);
}

if (failed.length) {
  console.error("Order experience audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Order experience audit passed: ${checks.length} checks.`);

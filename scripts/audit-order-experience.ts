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
    name: "webhook survives pending reconciliation migration",
    file: "src/routes/api/public/payments/webhook.ts",
    includes: [
      "isMissingColumnError",
      "orders reconciliation columns unavailable in webhook",
      "fallbackPaidUpdate",
      "_stripePaymentIntent",
      "_paymentRecheckedAt",
    ],
  },
  {
    name: "thank-you page can read source route",
    file: "src/lib/payments.functions.ts",
    includes: ["ORDER_SELECT_BASE", "created_at", "guest_email", "source_route"],
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
    name: "thank-you page distinguishes instant and detailed paid preparation",
    file: "src/routes/koszonjuk.tsx",
    includes: [
      "orderPreparationLead",
      "orderPreparationDetail",
      "nem egy rövid automata választ",
      "több szakaszban dolgozzuk össze",
      "pár percig hagyd nyitva",
      "biztonságos rendelési linket érdemes megtartanod",
    ],
  },
  {
    name: "thank-you page exposes a short order reference",
    file: "src/routes/koszonjuk.tsx",
    includes: [
      "function shortOrderId",
      "Rendelés:",
      "shortOrderId(order.id)",
      "add meg ezt",
      "rövid rendelésazonosítót",
    ],
  },
  {
    name: "profile prefers stored source route",
    file: "src/routes/profil.tsx",
    includes: ["source_route?: string | null", "o.source_route ?? PRODUCTS_BY_SLUG"],
  },
  {
    name: "profile can wake paid or processing orders without exposing session ids",
    file: "src/routes/profil.tsx",
    includes: [
      "processMyOrder",
      "const wakeOrder = useServerFn(processMyOrder)",
      "awakenedOrders",
      'order.status === "paid" || order.status === "processing"',
      "wakeOrder({ data: { orderId: order.id } })",
      "const refreshed = await call({})",
    ],
  },
  {
    name: "profile order wakeup is server-side and strips private payment fields",
    file: "src/lib/payments.functions.ts",
    includes: [
      "ORDER_SELECT_PROFILE_WITH_RECONCILIATION",
      "stripe_session_id",
      "reconcilePendingPayment(order, sessionId)",
      "export const processMyOrder",
      '.eq("user_id", context.userId)',
      "processPaidOrderBySession(order.stripe_session_id)",
      "function stripPrivateOrderFields",
      "_stripeSessionId",
      "reconciled.map(stripPrivateOrderFields)",
    ],
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
    name: "profile distinguishes instant and detailed paid preparation",
    file: "src/routes/profil.tsx",
    includes: [
      "profileOrderPreparationLead",
      "profileOrderPreparationDetail",
      "nem azonnali sablonválasz",
      "több szakaszos elemzés",
      "Az azonnali termékek általában pár percen belül",
      "ha az email késik, a profilban akkor is",
    ],
  },
  {
    name: "profile exposes support contact for stuck orders",
    file: "src/routes/profil.tsx",
    includes: [
      "function shortOrderId",
      "Rendelés:",
      "shortOrderId(o.id)",
      "ProfileSupportContact",
      "Ha továbbra is így marad",
      "vásárlási email címedről",
      "Add meg ezt is",
      "Az olvasat elkészült, de itt nem tudjuk teljes szövegként megjeleníteni",
      "SITE_LEGAL.supportEmail",
    ],
  },
  {
    name: "paid reading body can be copied or downloaded for later use",
    file: "src/components/PaidReadingBody.tsx",
    includes: [
      "navigator.clipboard.writeText",
      "URL.createObjectURL",
      "URL.revokeObjectURL",
      'type: "text/plain;charset=utf-8"',
      "formatDownloadedReading(body)",
      "function formatDownloadedReading",
      "Jövőd.hu",
      "Személyes olvasat",
      "Letöltve:",
      "szimbolikus, önismereti digitális tartalom",
      "ugyfelszolgalat@jovod.hu",
      "link.download",
      "jovod-olvasat-",
      "Olvasat másolása",
      "Kimásolva",
      "Olvasat letöltése",
      "Letöltés indult",
      "később is visszanézheted",
      "kimásolhatod vagy letöltheted",
    ],
  },
  {
    name: "delivered email exposes recovery path",
    file: "src/lib/email-templates/order-delivered.tsx",
    includes: [
      "isGuest?: boolean",
      "isGuest = false",
      "missingBodyText",
      "SITE_LEGAL.supportEmail",
      "Ha a gomb nem nyílik meg",
      "Rendelés rövid azonosítója",
      "orderId.slice(0, 8)",
      "Vendég vásárlásnál",
      "linket érdemes megtartanod",
      "biztonságos rendelési link a legfontosabb hozzáférés",
      "létrehozása nem kötelező",
      "ezen a biztonságos rendelési linken éred el",
      "ki is másolhatod",
      "letöltheted magadnak",
      "szöveges fájlként",
      "A részletes olvasatot ezen a linken és a profilodban is eléred",
      "isGuest: true",
    ],
  },
  {
    name: "order processing passes guest state into delivered email",
    file: "src/lib/orderProcessing.server.ts",
    includes: [
      'templateName: "order-delivered"',
      "guestEmail: string | null",
      "isGuest: Boolean(order.guestEmail)",
      "accessUrl: order.stripeSessionId",
    ],
  },
  {
    name: "order delivered email is essential transactional",
    file: "src/lib/email-templates/registry.ts",
    includes: ["essentialTransactional?: boolean", "essentialTransactional: true"],
  },
  {
    name: "internal order delivery bypasses unsubscribe suppression only",
    file: "src/lib/email/sendTransactional.server.ts",
    includes: [
      "const essentialTransactional = Boolean(template.essentialTransactional)",
      'suppressed.reason !== "unsubscribe"',
      "if (!essentialTransactional)",
      "...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {})",
    ],
  },
  {
    name: "lovable send route preserves essential order email delivery",
    file: "src/routes/lovable/email/transactional/send.ts",
    includes: [
      "const essentialTransactional = Boolean(template.essentialTransactional)",
      'suppressed.reason !== "unsubscribe"',
      "if (!essentialTransactional)",
      "...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {})",
    ],
  },
  {
    name: "unsubscribe page clarifies transactional order notices",
    file: "src/routes/unsubscribe.tsx",
    includes: [
      "nem kötelező emailekről",
      "Rendeléshez kapcsolódó",
      "kézbesítési vagy ügyfélszolgálati értesítés",
      "rendelési értesítéseket",
      "továbbra",
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

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
    includes: ["source_route: data.sourceRoute ?? null"],
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
    name: "profile prefers stored source route",
    file: "src/routes/profil.tsx",
    includes: ["source_route?: string | null", "o.source_route ?? PRODUCTS_BY_SLUG"],
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

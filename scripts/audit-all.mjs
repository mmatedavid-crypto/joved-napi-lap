import { spawnSync } from "node:child_process";

const AUDITS = [
  "scripts/audit-client-secrets.ts",
  "scripts/audit-supabase-migrations.ts",
  "scripts/audit-memory-experience.ts",
  "scripts/audit-trust-experience.ts",
  "scripts/audit-paywall-products.ts",
  "scripts/audit-reading-products.ts",
  "scripts/audit-order-experience.ts",
  "scripts/audit-seo-news.ts",
];

const runtime = process.versions.bun
  ? process.execPath
  : process.env.npm_execpath?.includes("bun")
    ? process.env.npm_execpath
    : "bun";

for (const audit of AUDITS) {
  console.log(`\n=== ${audit} ===`);
  const result = spawnSync(runtime, [audit], { stdio: "inherit" });
  if (result.error) {
    console.error(`Audit runner failed before ${audit}:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Audit failed: ${audit}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\nAll product audits passed: ${AUDITS.length} checks.`);

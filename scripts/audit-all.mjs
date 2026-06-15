import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const AUDITS = [
  "scripts/audit-client-secrets.ts",
  "scripts/audit-supabase-migrations.ts",
  "scripts/audit-memory-experience.ts",
  "scripts/audit-trust-experience.ts",
  "scripts/audit-paywall-products.ts",
  "scripts/audit-reading-products.ts",
  "scripts/audit-static-content-safety.ts",
  "scripts/audit-order-experience.ts",
  "scripts/audit-seo-news.ts",
];

const tsxPackage = "node_modules/tsx/dist/loader.mjs";
const runtime = process.versions.bun
  ? { command: process.execPath, args: [] }
  : process.env.npm_execpath?.includes("bun")
    ? { command: process.env.npm_execpath, args: [] }
    : existsSync(tsxPackage)
      ? { command: process.execPath, args: ["--import", "tsx"] }
      : { command: "bun", args: [] };

for (const audit of AUDITS) {
  console.log(`\n=== ${audit} ===`);
  const result = spawnSync(runtime.command, [...runtime.args, audit], { stdio: "inherit" });
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

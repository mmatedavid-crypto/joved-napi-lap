import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const CLIENT_DIR = "dist/client";

const SECRET_VALUE_PATTERNS = [
  /\bsk_(test|live)_[A-Za-z0-9]{16,}\b/g,
  /\brk_(test|live)_[A-Za-z0-9]{16,}\b/g,
  /\bwhsec_[A-Za-z0-9]{16,}\b/g,
  /\bsb_secret_[A-Za-z0-9_-]{16,}\b/g,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
];

const SERVER_IMPORT_PATTERN = /import\s+(?!type\s)(?:[^;]*from\s+)?["'][^"']+\.server["']/;

const ALLOWED_SERVER_IMPORT_SOURCES = [
  "src/routes/api/public/payments/webhook.ts",
  "src/routes/email/unsubscribe.ts",
  "src/routes/lovable/email/",
  "src/integrations/supabase/client.server.ts",
  "src/integrations/supabase/auth-middleware.ts",
  "src/lib/ai.server.ts",
  "src/lib/config.server.ts",
  "src/lib/email/sendTransactional.server.ts",
  "src/lib/horoscopeNews.server.ts",
  "src/lib/orderProcessing.server.ts",
  "src/lib/paidReadings.server.ts",
  "src/lib/readingQuality/readingCache.server.ts",
  "src/lib/roxy.server.ts",
  "src/lib/stripe.server.ts",
];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function sourceFiles(): string[] {
  return walk("src").filter((file) => /\.(ts|tsx)$/.test(file));
}

const issues: string[] = [];

for (const file of walk(CLIENT_DIR)) {
  if (!/\.(js|css|html|json|txt|xml)$/.test(file)) continue;
  const body = readFileSync(file, "utf8");
  for (const pattern of SECRET_VALUE_PATTERNS) {
    const matches = body.match(pattern);
    if (matches?.length)
      issues.push(`${file}: secret-looking value (${matches[0].slice(0, 10)}...)`);
  }
}

for (const file of sourceFiles()) {
  const body = readFileSync(file, "utf8");
  if (!SERVER_IMPORT_PATTERN.test(body)) continue;
  if (ALLOWED_SERVER_IMPORT_SOURCES.some((allowed) => file.startsWith(allowed))) continue;
  issues.push(`${file}: module-level .server import`);
}

if (issues.length) {
  console.error("Client/server boundary audit failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(
  "Client/server boundary audit passed: no built client secret values or unexpected module-level .server imports.",
);

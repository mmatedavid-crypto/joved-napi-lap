import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "supabase/migrations";

type Occurrence = {
  file: string;
  statement: string;
  idempotent: boolean;
};

const files = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith(".sql"))
  .sort();

const tableCreates = new Map<string, Occurrence[]>();
const failed: string[] = [];

for (const file of files) {
  const body = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  const statements = body
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    const tableMatch = statement.match(
      /\bCREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-z0-9_]+)/i,
    );
    if (tableMatch) {
      const table = tableMatch[2].toLowerCase();
      const occurrence: Occurrence = {
        file,
        statement,
        idempotent: Boolean(tableMatch[1]),
      };
      tableCreates.set(table, [...(tableCreates.get(table) ?? []), occurrence]);
    }

    const indexMatch = statement.match(/\bCREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS)([a-z0-9_]+)/i);
    if (indexMatch) {
      const indexName = indexMatch[1];
      const earlier = files
        .filter((candidate) => candidate < file)
        .some((candidate) =>
          readFileSync(join(MIGRATIONS_DIR, candidate), "utf8")
            .toLowerCase()
            .includes(`create index ${indexName.toLowerCase()}`),
        );
      if (earlier) failed.push(`${file}: duplicate index ${indexName} must use IF NOT EXISTS`);
    }
  }
}

for (const [table, occurrences] of tableCreates) {
  if (occurrences.length <= 1) continue;

  const unsafe = occurrences.slice(1).filter((item) => !item.idempotent);
  for (const item of unsafe) {
    failed.push(`${item.file}: duplicate CREATE TABLE ${table} must use IF NOT EXISTS`);
  }
}

if (failed.length) {
  console.error("Supabase migration audit failed:");
  for (const item of failed) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Supabase migration audit passed: ${files.length} files.`);

const FORBIDDEN_PATTERNS = [
  /\bas an ai\b/i,
  /\bimportant to note\b/i,
  /\bconsult (a|your) (doctor|lawyer|financial advisor)\b/i,
  /\bguaranteed\b/i,
  /\bwill definitely\b/i,
  /\bbiztosan\b/i,
  /\bgarantáltan\b/i,
  /\bmindenképpen\b/i,
  /\bez fog történni\b/i,
  /\borvosi diagnó/i,
  /\bjogi tanács/i,
  /\bpénzügyi tanács/i,
  /\bgyógyít/i,
];

const ENGLISH_REPORT_WORDS = [
  "relationship",
  "career",
  "money",
  "health",
  "forecast",
  "transit",
  "planet",
  "house",
  "aspect",
  "opportunity",
  "challenge",
  "summary",
  "conclusion",
];

export function inspectPaidAstrologyReport(
  markdown: string,
  opts: {
    requiredHeadings: string[];
    minChars: number;
  },
): { ok: boolean; issues: string[] } {
  const text = markdown.trim();
  const issues: string[] = [];

  if (text.length < opts.minChars) issues.push("too_short");
  if (!text.includes("## ")) issues.push("missing_markdown_sections");

  for (const heading of opts.requiredHeadings) {
    if (!text.includes(heading)) issues.push(`missing_heading:${heading}`);
  }

  const forbidden = FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(text));
  if (forbidden.length) issues.push("forbidden_claim_or_phrase");

  const englishHits = ENGLISH_REPORT_WORDS.filter((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(text),
  );
  if (englishHits.length >= 4) issues.push("too_much_raw_english");

  const noSourceSignals =
    text.match(/nincs (külön )?jelzés|nem érkezett részletes|nem ad külön jelzést/gi) ?? [];
  if (noSourceSignals.length >= 3) issues.push("repetitive_missing_source_copy");

  const hungarianSignal = ["hogy", "mert", "érdemes", "figyelj", "kapcsolat", "döntés"].filter(
    (word) => text.toLocaleLowerCase("hu-HU").includes(word),
  );
  if (hungarianSignal.length < 3) issues.push("weak_hungarian_signal");

  return { ok: issues.length === 0, issues };
}

export function usablePaidAstrologyReport(
  markdown: string,
  opts: {
    productSlug: string;
    requiredHeadings: string[];
    minChars: number;
  },
): string {
  const clean = markdown.trim();
  const quality = inspectPaidAstrologyReport(clean, opts);
  if (quality.ok) return clean;
  if (clean) {
    console.warn("[paid_astrology_report_rejected]", {
      productSlug: opts.productSlug,
      issues: quality.issues,
      chars: clean.length,
    });
  }
  return "";
}

export class PaidAstrologyReportUnavailableError extends Error {
  constructor(
    message: string,
    public readonly productSlug: string,
    public readonly issues: string[],
  ) {
    super(message);
    this.name = "PaidAstrologyReportUnavailableError";
  }
}

export function assertPaidAstrologySource(opts: {
  productSlug: string;
  available: Record<string, boolean>;
  required: string[];
}): void {
  const missing = opts.required.filter((key) => !opts.available[key]);
  if (!missing.length) return;

  console.warn("[paid_astrology_source_unavailable]", {
    productSlug: opts.productSlug,
    missing,
  });
  throw new PaidAstrologyReportUnavailableError(
    "paid_astrology_source_unavailable",
    opts.productSlug,
    missing.map((key) => `missing_source:${key}`),
  );
}

export function requireUsablePaidAstrologyReport(
  markdown: string,
  opts: {
    productSlug: string;
    requiredHeadings: string[];
    minChars: number;
  },
): string {
  const report = usablePaidAstrologyReport(markdown, opts);
  if (report) return report;

  const issues = markdown.trim()
    ? inspectPaidAstrologyReport(markdown, opts).issues
    : ["missing_ai_report"];
  throw new PaidAstrologyReportUnavailableError(
    "paid_astrology_report_unusable",
    opts.productSlug,
    issues,
  );
}

const HU_VOWELS = "aáeéiíoóöőuúüű";

export function withHungarianArticle(label: string): string {
  const trimmed = label.trim();
  if (/^(a|az)\s/i.test(trimmed)) return trimmed;
  const article = HU_VOWELS.includes(trimmed[0]?.toLowerCase() ?? "") ? "az" : "a";
  return `${article} ${trimmed}`;
}

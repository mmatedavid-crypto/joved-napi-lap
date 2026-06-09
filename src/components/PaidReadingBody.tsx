type ReadingBlock = {
  heading?: string;
  text: string;
};

export function PaidReadingBody({ body }: { body: string }) {
  const blocks = parsePaidReadingBody(body);
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => (
        <section key={`${block.heading ?? "block"}-${index}`} className="space-y-2">
          {block.heading && (
            <h3 className="font-display text-xl leading-snug text-ivory">{block.heading}</h3>
          )}
          <div className="space-y-3">
            {block.text.split(/\n+/).map((line, lineIndex) => (
              <p
                key={lineIndex}
                className="font-editorial text-[15px] leading-relaxed text-ivory/76"
              >
                {line}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function parsePaidReadingBody(body: string): ReadingBlock[] {
  return body
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const lines = part
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length >= 2 && isLikelyHeading(lines[0])) {
        return { heading: lines[0], text: lines.slice(1).join("\n") };
      }
      return { text: lines.join("\n") || part };
    });
}

function isLikelyHeading(value: string): boolean {
  if (value.length > 80) return false;
  if (/[.!?]$/.test(value)) return false;
  return true;
}

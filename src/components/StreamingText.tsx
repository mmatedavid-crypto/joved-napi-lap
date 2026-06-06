import { useEffect, useRef, useState } from "react";

type Props = {
  text: string | undefined | null;
  /** chars per tick — higher = faster */
  speed?: number;
  /** ms per tick */
  interval?: number;
  className?: string;
  as?: "p" | "div" | "span" | "em";
  /** disable typewriter and just render the full string */
  instant?: boolean;
};

/**
 * Typewriter renderer for AI-generated copy. The full text already arrives
 * from the server function — we only stream it visually so the user gets
 * an "alive" feeling instead of a blank wait.
 */
export function StreamingText({
  text,
  speed = 2,
  interval = 18,
  className,
  as = "div",
  instant = false,
}: Props) {
  const [shown, setShown] = useState(instant ? (text ?? "") : "");
  const lastText = useRef<string | undefined | null>(null);

  useEffect(() => {
    if (text == null) {
      setShown("");
      return;
    }
    if (instant) {
      setShown(text);
      return;
    }
    // restart only when the source text actually changes
    if (lastText.current === text) return;
    lastText.current = text;
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(i + speed, text.length);
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }, [text, instant, speed, interval]);

  const isStreaming = !instant && text != null && shown.length < text.length;
  const caret = isStreaming ? (
    <span
      className="inline-block w-[2px] h-[1em] -mb-[2px] ml-[2px] bg-gold/80 align-middle animate-pulse"
      aria-hidden="true"
    />
  ) : null;
  if (as === "p")
    return (
      <p className={className}>
        {shown}
        {caret}
      </p>
    );
  if (as === "span")
    return (
      <span className={className}>
        {shown}
        {caret}
      </span>
    );
  if (as === "em")
    return (
      <em className={className}>
        {shown}
        {caret}
      </em>
    );
  return (
    <div className={className}>
      {shown}
      {caret}
    </div>
  );
}

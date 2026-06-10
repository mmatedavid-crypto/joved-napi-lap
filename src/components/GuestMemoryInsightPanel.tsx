import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  clearGuestPersonalization,
  getGuestReadingContext,
  setGuestPersonalizationEnabled,
  type GuestReadingContext,
  type GuestReadingType,
} from "@/lib/guestReadingMemory";

type Props = {
  readingType?: GuestReadingType;
  topic?: string;
  situation?: string;
  className?: string;
};

export function GuestMemoryInsightPanel({ readingType, topic, situation, className = "" }: Props) {
  const [context, setContext] = useState<GuestReadingContext | null>(null);
  const [cleared, setCleared] = useState(false);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setContext(getGuestReadingContext({ readingType, topic, situation, limit: 8 }));
    setCleared(false);
    setDisabled(false);
  }, [readingType, situation, topic]);

  if (cleared || disabled) {
    return (
      <div
        className={`rounded-md border border-gold/15 bg-[oklch(0.78_0.10_80/0.045)] px-4 py-3 text-sm leading-relaxed text-ivory/62 ${className}`}
      >
        {disabled
          ? "Kikapcsoltuk a helyi személyesítést ebben a böngészőben. Új vendégmintát nem mentünk, amíg vissza nem kapcsolod az adatkezelési oldalon."
          : "Töröltük a helyi olvasati mintát ebből a böngészőből."}
      </div>
    );
  }

  if (!context || context.memories.length < 2) return null;

  const { insights } = context;
  const lines = [
    insights.recurringQuestion,
    insights.changeSinceLast,
    context.distinctCompatibilityCount >= 3
      ? "Több összeillést is néztél mostanában; érdemes lehet azt is figyelni, milyen mintát keresel több emberben."
      : insights.gentleNudge,
  ].filter(Boolean);

  function clear() {
    clearGuestPersonalization();
    setCleared(true);
  }

  function disable() {
    setGuestPersonalizationEnabled(false);
    setDisabled(true);
  }

  return (
    <div
      className={`rounded-md border border-gold/15 bg-[oklch(0.78_0.10_80/0.055)] px-4 py-3 ${className}`}
    >
      <div className="text-[10px] tracking-[0.28em] uppercase text-gold/75">Ismétlődő mintád</div>
      <div className="mt-2 grid gap-2 text-sm leading-relaxed text-ivory/66">
        {lines.slice(0, 3).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="text-ivory/42">
          Csak ebben a böngészőben tárolt, rövid olvasati mintákból.
        </span>
        <Link to="/adatkezelesi-tajekoztato" className="text-ivory/55 hover:text-gold">
          Beállítások
        </Link>
        <button type="button" onClick={clear} className="text-ivory/55 hover:text-gold">
          Helyi minta törlése
        </button>
        <button type="button" onClick={disable} className="text-ivory/55 hover:text-gold">
          Személyesítés kikapcsolása
        </button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";

type ReadingLoadingKind =
  | "tarot"
  | "horoscope"
  | "compatibility"
  | "dream"
  | "crystal"
  | "angel"
  | "numerology"
  | "daily";

const STEPS: Record<ReadingLoadingKind, readonly string[]> = {
  tarot: [
    "A húzott lapokat a kérdésedhez igazítjuk.",
    "Nem sablonjelentést mutatunk: a lap helyzetét és a témádat együtt olvassuk.",
    "A választ rövidre, de személyesre csiszoljuk.",
  ],
  horoscope: [
    "Nem előre megírt horoszkópot veszünk le a polcról.",
    "A mostani időszak háttéradatait rendezzük olvasható magyar üzenetté.",
    "A szerelem, munka és belső fókusz részeit külön igazítjuk.",
    "A csillagállás jelzéseit óvatos, józan nyelvre fordítjuk.",
  ],
  compatibility: [
    "A két születési mintát egymás mellé tesszük.",
    "Megnézzük, hol erősítitek és hol fáraszthatjátok egymást.",
    "A kapcsolat típusát is beleszőjük, nem csak százalékot számolunk.",
  ],
  dream: [
    "Kiemeljük az álom legerősebb szimbólumait.",
    "Az érzést és a képet együtt olvassuk, nem diagnózist készítünk.",
    "A jelentést önismereti jelként fogalmazzuk meg.",
  ],
  crystal: [
    "A kristály hagyományos jelentését keressük elő.",
    "Csak szimbolikus minőségeket használunk, gyógyító ígéret nélkül.",
    "A választ a megadott helyzetedhez igazítjuk.",
  ],
  angel: [
    "A szám ismétlődő mintáját bontjuk ki.",
    "A jelentést rövid, magyar önismereti üzenetté rendezzük.",
    "Nem jóslatot adunk, hanem figyelmi pontot.",
  ],
  numerology: [
    "A születési dátum számait bontjuk rétegekre.",
    "Ha nevet is adtál meg, a belső vágy és a külső kép mintáját is számoljuk.",
    "A számokat nem címkének, hanem élethelyzeti ritmusnak olvassuk.",
  ],
  daily: [
    "A napi lapot, a jegyhangulatot és a belső ritmust egymás mellé tesszük.",
    "Nem hosszú szöveget írunk, hanem használható napi fókuszt.",
    "A választ úgy fogalmazzuk, hogy ma is lehessen vele dolgozni.",
  ],
};

type Props = {
  kind: ReadingLoadingKind;
  title?: string;
  className?: string;
  steps?: readonly string[];
};

export function ReadingLoadingState({
  kind,
  title = "Készül az olvasatod",
  className = "",
  steps: customSteps,
}: Props) {
  const steps = useMemo(
    () => (customSteps?.length ? customSteps : STEPS[kind]),
    [customSteps, kind],
  );
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
    const id = window.setInterval(
      () => setStepIndex((current) => (current + 1) % steps.length),
      2100,
    );
    return () => window.clearInterval(id);
  }, [steps]);

  return (
    <div
      className={`rounded-md border border-gold/15 bg-[oklch(0.13_0.03_292/0.68)] px-4 py-3 ${className}`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/35" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
        </span>
        <div>
          <div className="text-[10px] tracking-[0.28em] uppercase text-gold/75">{title}</div>
          <div className="mt-1 text-sm text-ivory/68 font-editorial italic">{steps[stepIndex]}</div>
        </div>
      </div>
    </div>
  );
}

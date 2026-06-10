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
    "Megkeverjük a paklit, és kihúzzuk a lapjaidat.",
    "Megnézzük, melyik lap milyen pozícióban érkezett.",
    "Összevetjük a lapok jelentését a Major és Minor Arcana hagyományával.",
    "A lapok közötti kapcsolatot, az ívet is olvassuk — nem csak a darabokat.",
    "A kérdésedhez igazítjuk a lap üzenetét, nem sablonjelentést írunk.",
    "Az utolsó simítások: a válasz rövid, személyes, használható legyen.",
  ],
  horoscope: [
    "Lekérdezzük a Nap, a Hold és a bolygók aktuális állását.",
    "Megnézzük, milyen tranzitok érintik most a jegyedet.",
    "Összevetjük a holdfázist és a jegyuralkodókat a mai konstellációval.",
    "A nyers asztrológiai adatokat olvasható magyar üzenetté rendezzük.",
    "A szerelem, munka és belső fókusz részeit külön igazítjuk.",
    "Ha érkezik szerencseszám vagy szín, azt is hozzátesszük.",
  ],
  compatibility: [
    "Kiszámoljuk mindkettőtök sorsszámát a születési dátumból.",
    "Egymás mellé tesszük a két numerológiai mintát.",
    "Megnézzük, milyen a kommunikációs, a vonzalmi és a hosszú távú illeszkedés.",
    "Hol erősítitek, és hol fáraszthatjátok egymást — mindkettőt megnézzük.",
    "A kapcsolat típusát is beleszőjük, nem csak százalékot számolunk.",
  ],
  dream: [
    "Kiemeljük az álom legerősebb szimbólumait.",
    "Megnézzük, mit jelent a kép a hagyományos álomfejtésben.",
    "Az érzést és a képet együtt olvassuk, nem diagnózist készítünk.",
    "A jelentést önismereti jelként, nem jóslatként fogalmazzuk meg.",
  ],
  crystal: [
    "Előhívjuk a kristály hagyományos jelentését és csakrakapcsolódását.",
    "Megnézzük, milyen szándékhoz illik a kő szimbolikája.",
    "Csak szimbolikus minőségeket használunk, gyógyító ígéret nélkül.",
    "A választ a megadott helyzetedhez igazítjuk.",
  ],
  angel: [
    "Megnézzük az ismétlődő szám numerológiai gyökerét.",
    "Összevetjük a számot az angyali számtan hagyományos jelentésével.",
    "A jelentést rövid, magyar önismereti üzenetté rendezzük.",
    "Nem jóslatot adunk, hanem figyelmi pontot.",
  ],
  numerology: [
    "Kiszámoljuk a sorsszámodat a születési dátumból.",
    "Levezetjük az idei személyes évedet.",
    "Ha nevet is adtál meg, a belső vágy és a külső kép számát is számoljuk.",
    "Megnézzük, hol erősítik és hol fékezik egymást a számok rétegei.",
    "A számokat nem címkének, hanem élethelyzeti ritmusnak olvassuk.",
  ],
  daily: [
    "Kihúzzuk a mai napi lapodat.",
    "Megnézzük a Hold állását és a mai jegyhangulatot.",
    "Egymás mellé tesszük a lapot, a bolygóhatást és a belső ritmust.",
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

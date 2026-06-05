import { useEffect, useMemo, useRef, useState } from "react";

export type HUDateValue = string; // YYYY-MM-DD or ""

const MONTHS_HU = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

function daysInMonth(y: number, m: number) {
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

export function HUDateInput({
  value,
  onChange,
  label,
  required,
  minYear = 1920,
  maxYear = new Date().getFullYear(),
  helper = "Példa: 1985.06.04",
}: {
  value: HUDateValue;
  onChange: (v: HUDateValue) => void;
  label?: string;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
  helper?: string;
}) {
  const parsed = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return m ? { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) } : { y: 0, mo: 0, d: 0 };
  }, [value]);

  const [y, setY] = useState(parsed.y || 0);
  const [mo, setMo] = useState(parsed.mo || 0);
  const [d, setD] = useState(parsed.d || 0);

  const moRef = useRef<HTMLSelectElement>(null);
  const dRef = useRef<HTMLSelectElement>(null);

  // keep internal in sync if value changes externally
  useEffect(() => {
    setY(parsed.y || 0); setMo(parsed.mo || 0); setD(parsed.d || 0);
  }, [parsed.y, parsed.mo, parsed.d]);

  const dim = daysInMonth(y, mo);

  useEffect(() => {
    if (y && mo && d) {
      const safeDay = Math.min(d, dim);
      const v = `${y}-${String(mo).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
      if (v !== value) onChange(v);
    } else if (value) {
      onChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, mo, d, dim]);

  const years: number[] = [];
  for (let i = maxYear; i >= minYear; i--) years.push(i);

  const sel = "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-3 py-3 text-ivory focus:border-gold outline-none appearance-none";

  return (
    <div>
      {label && (
        <label className="block text-sm text-ivory/80 mb-2">
          {label}{required && <span className="text-gold/80"> *</span>}
        </label>
      )}
      <div className="grid grid-cols-[1.2fr_1.4fr_1fr] gap-2">
        <select
          aria-label="Év"
          required={required}
          value={y || ""}
          onChange={(e) => {
            const v = Number(e.target.value);
            setY(v);
            if (v && !mo) moRef.current?.focus();
          }}
          className={sel}
        >
          <option value="">Év</option>
          {years.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
        </select>
        <select
          ref={moRef}
          aria-label="Hónap"
          required={required}
          value={mo || ""}
          onChange={(e) => {
            const v = Number(e.target.value);
            setMo(v);
            if (v && !d) dRef.current?.focus();
          }}
          className={sel}
        >
          <option value="">Hónap</option>
          {MONTHS_HU.map((name, i) => (
            <option key={i + 1} value={i + 1}>
              {String(i + 1).padStart(2, "0")} — {name}
            </option>
          ))}
        </select>
        <select
          ref={dRef}
          aria-label="Nap"
          required={required}
          value={d || ""}
          onChange={(e) => setD(Number(e.target.value))}
          className={sel}
        >
          <option value="">Nap</option>
          {Array.from({ length: dim }).map((_, i) => (
            <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>
          ))}
        </select>
      </div>
      {helper && <p className="text-xs text-ivory/45 mt-1.5 font-editorial">{helper}</p>}
    </div>
  );
}
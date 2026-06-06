import { useEffect, useMemo, useRef, useState } from "react";

export type HUDateValue = string; // YYYY-MM-DD or ""

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

  const [yStr, setYStr] = useState(parsed.y ? String(parsed.y) : "");
  const [moStr, setMoStr] = useState(parsed.mo ? String(parsed.mo) : "");
  const [dStr, setDStr] = useState(parsed.d ? String(parsed.d) : "");

  const moRef = useRef<HTMLInputElement>(null);
  const dRef = useRef<HTMLInputElement>(null);

  // keep internal in sync if value changes externally
  useEffect(() => {
    setYStr(parsed.y ? String(parsed.y) : "");
    setMoStr(parsed.mo ? String(parsed.mo) : "");
    setDStr(parsed.d ? String(parsed.d) : "");
  }, [parsed.y, parsed.mo, parsed.d]);

  const y = Number(yStr) || 0;
  const mo = Number(moStr) || 0;
  const d = Number(dStr) || 0;
  const dim = daysInMonth(y, mo);

  useEffect(() => {
    const yValid = y >= minYear && y <= maxYear;
    const moValid = mo >= 1 && mo <= 12;
    const dValid = d >= 1 && d <= dim;
    if (yValid && moValid && dValid) {
      const safeDay = Math.min(d, dim);
      const v = `${y}-${String(mo).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
      if (v !== value) onChange(v);
    } else if (value) {
      onChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, mo, d, dim]);

  const inp = "w-full bg-[oklch(0.14_0.04_295)] border border-[oklch(0.78_0.10_80/0.25)] rounded-md px-3 py-3 text-ivory text-center tabular-nums tracking-wider focus:border-gold outline-none";

  function onlyDigits(s: string, max: number) {
    return s.replace(/\D/g, "").slice(0, max);
  }

  return (
    <div>
      {label && (
        <label className="block text-sm text-ivory/80 mb-2">
          {label}{required && <span className="text-gold/80"> *</span>}
        </label>
      )}
      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="bday-year"
          aria-label="Év"
          placeholder="ÉÉÉÉ"
          required={required}
          value={yStr}
          maxLength={4}
          onChange={(e) => {
            const v = onlyDigits(e.target.value, 4);
            setYStr(v);
            if (v.length === 4) moRef.current?.focus();
          }}
          className={inp}
        />
        <input
          ref={moRef}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="bday-month"
          aria-label="Hónap"
          placeholder="HH"
          required={required}
          value={moStr}
          maxLength={2}
          onChange={(e) => {
            const v = onlyDigits(e.target.value, 2);
            setMoStr(v);
            if (v.length === 2 || (v.length === 1 && Number(v) > 1)) dRef.current?.focus();
          }}
          className={inp}
        />
        <input
          ref={dRef}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="bday-day"
          aria-label="Nap"
          placeholder="NN"
          required={required}
          value={dStr}
          maxLength={2}
          onChange={(e) => setDStr(onlyDigits(e.target.value, 2))}
          className={inp}
        />
      </div>
      {helper && <p className="text-xs text-ivory/45 mt-1.5 font-editorial">{helper}</p>}
    </div>
  );
}
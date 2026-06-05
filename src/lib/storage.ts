const PREFIX = "jovod:";

export function saveLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function loadLocal<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(PREFIX + key);
    return v ? (JSON.parse(v) as T) : null;
  } catch { return null; }
}

export function pushHistory<T>(key: string, item: T, max = 50) {
  const arr = (loadLocal<T[]>(key) ?? []);
  arr.unshift(item);
  saveLocal(key, arr.slice(0, max));
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
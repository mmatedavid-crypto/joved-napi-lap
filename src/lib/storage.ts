import { huTodayKey } from "./dateKeys";

const PREFIX = "jovod:";

export function saveLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function loadLocal<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(PREFIX + key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function pushHistory<T>(key: string, item: T, max = 50) {
  const arr = loadLocal<T[]>(key) ?? [];
  arr.unshift(item);
  saveLocal(key, arr.slice(0, max));
}

export function saveCookie(key: string, value: string, maxAgeDays = 180) {
  if (typeof document === "undefined") return;
  try {
    const maxAge = Math.max(1, Math.round(maxAgeDays * 24 * 60 * 60));
    document.cookie = `${PREFIX}${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function deleteCookie(key: string) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${PREFIX}${key}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function loadCookie(key: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const name = `${PREFIX}${key}=`;
    const part = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(name));
    return part ? decodeURIComponent(part.slice(name.length)) : null;
  } catch {
    return null;
  }
}

export function todayKey() {
  return huTodayKey();
}

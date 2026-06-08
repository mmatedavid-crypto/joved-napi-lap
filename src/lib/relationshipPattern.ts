import { loadCookie, loadLocal, saveCookie, saveLocal } from "./storage";

type CompatibilityCheck = {
  at: string;
  partnerKey: string;
  status: string;
};

const KEY = "compatibility_checks";
const COOKIE_COUNT_KEY = "compatibility_distinct_30d";
const COOKIE_STATUS_KEY = "compatibility_last_status";

function partnerKey(name: string, birthDate: string): string {
  const label = `${name.trim().toLocaleLowerCase("hu-HU")}:${birthDate}`.trim();
  return label || "ismeretlen";
}

function recentChecks(): CompatibilityCheck[] {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return (loadLocal<CompatibilityCheck[]>(KEY) ?? []).filter(
    (item) => new Date(item.at).getTime() >= cutoff,
  );
}

export function recordCompatibilityCheck(input: {
  partnerName: string;
  partnerBirthDate: string;
  status: string;
}): { distinctCount: number; contextText: string; isComparing: boolean } {
  const next: CompatibilityCheck = {
    at: new Date().toISOString(),
    partnerKey: partnerKey(input.partnerName, input.partnerBirthDate),
    status: input.status,
  };
  const checks = [next, ...recentChecks()].slice(0, 24);
  saveLocal(KEY, checks);

  const distinctCount = new Set(checks.map((item) => item.partnerKey)).size;
  saveCookie(COOKIE_COUNT_KEY, String(distinctCount), 180);
  saveCookie(COOKIE_STATUS_KEY, input.status, 180);

  const isComparing = distinctCount >= 3;
  if (!isComparing) return { distinctCount, isComparing, contextText: "" };
  return {
    distinctCount,
    isComparing,
    contextText: `Böngészős mintázat: az elmúlt 30 napban legalább ${distinctCount} különböző összeillést nézett meg. Ne ítélkezz. Úgy reagálj, hogy lehet, hogy nem egyetlen kapcsolat sorsát keresi, hanem választási mintát, biztonságot, megerősítést vagy tisztább irányt több ember között.`,
  };
}

export function loadCompatibilityCookieSignal(): {
  distinctCount: number;
  lastStatus: string | null;
} {
  return {
    distinctCount: Number(loadCookie(COOKIE_COUNT_KEY) ?? "0") || 0,
    lastStatus: loadCookie(COOKIE_STATUS_KEY),
  };
}

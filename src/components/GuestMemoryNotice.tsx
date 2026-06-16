import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  clearGuestPersonalization,
  hasGuestPersonalizationDecision,
  isGuestPersonalizationEnabled,
  setGuestPersonalizationEnabled,
} from "@/lib/guestReadingMemory";
import { loadCookie, loadLocal, saveLocal } from "@/lib/storage";

const DISMISSED_KEY = "guest_memory_notice_dismissed";
const MEMORY_COUNT_COOKIE = "guest_reading_memory_count";

export function GuestMemoryNotice() {
  const [visible, setVisible] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [needsDecision, setNeedsDecision] = useState(false);

  useEffect(() => {
    const personalizationEnabled = isGuestPersonalizationEnabled();
    const hasDecision = hasGuestPersonalizationDecision();
    const dismissed = loadLocal<boolean>(DISMISSED_KEY);
    const memoryCount = Number(loadCookie(MEMORY_COUNT_COOKIE) ?? "0");

    setDisabled(!personalizationEnabled);
    setNeedsDecision(!hasDecision);
    setVisible(!hasDecision || (personalizationEnabled && !dismissed && memoryCount > 0));
  }, []);

  function enablePersonalization() {
    setGuestPersonalizationEnabled(true);
    setDisabled(false);
    setNeedsDecision(false);
    saveLocal(DISMISSED_KEY, true);
    setVisible(false);
  }

  function dismiss() {
    saveLocal(DISMISSED_KEY, true);
    setVisible(false);
  }

  function clearMemory() {
    clearGuestPersonalization();
    setCleared(true);
    saveLocal(DISMISSED_KEY, true);
  }

  function disablePersonalization() {
    setGuestPersonalizationEnabled(false);
    setDisabled(true);
    setNeedsDecision(false);
    setCleared(true);
    saveLocal(DISMISSED_KEY, true);
  }

  if (!visible && !cleared) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl rounded-md border border-gold/20 bg-[oklch(0.11_0.03_290/0.96)] px-4 py-3 shadow-2xl backdrop-blur md:bottom-5">
      {cleared ? (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm leading-relaxed text-ivory/70">
              {disabled
                ? "Kikapcsoltuk a helyi személyesítést ebben a böngészőben. Új vendégmintát nem mentünk."
                : "Töröltük a helyi olvasati mintát ebből a böngészőből."}
            </p>
            {disabled && (
              <p className="text-xs leading-relaxed text-ivory/48">
                Később az adatkezelési oldalon bármikor visszakapcsolhatod.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCleared(false)}
            className="shrink-0 text-sm text-gold"
          >
            Rendben
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ivory/72">
            A Jövőd.hu akkor tud igazán személyes ívet adni, ha ebben a böngészőben megjegyezhet
            néhány korábbi olvasati mintát, hogy ne minden alkalom idegenként induljon.
          </p>
          <p className="text-xs leading-relaxed text-ivory/48">
            A minta helyben marad ebben a böngészőben; nem bankkártyaadat, nem diagnózis, és nem
            készítünk belőle biztos jövőállítást. A személyesítés nem kötelező: kikapcsolhatod, és
            a törlés nem érinti a rendeléseidet.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {needsDecision ? (
              <>
                <button
                  type="button"
                  onClick={enablePersonalization}
                  className="text-gold hover:text-gold/80"
                >
                  Bekapcsolom
                </button>
                <button
                  type="button"
                  onClick={disablePersonalization}
                  className="text-ivory/62 hover:text-gold"
                >
                  Most nem
                </button>
              </>
            ) : (
              <>
                {disabled && (
                  <button
                    type="button"
                    onClick={enablePersonalization}
                    className="text-gold hover:text-gold/80"
                  >
                    Bekapcsolom
                  </button>
                )}
                <button type="button" onClick={dismiss} className="text-gold hover:text-gold/80">
                  Értem
                </button>
                <button
                  type="button"
                  onClick={clearMemory}
                  className="text-ivory/62 hover:text-gold"
                >
                  Helyi minta törlése
                </button>
                <button
                  type="button"
                  onClick={disablePersonalization}
                  className="text-ivory/62 hover:text-gold"
                >
                  Személyesítés kikapcsolása
                </button>
              </>
            )}
            <Link to="/adatkezelesi-tajekoztato" className="text-ivory/50 hover:text-gold">
              Adatkezelés
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

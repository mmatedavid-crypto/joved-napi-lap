import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { clearGuestPersonalization } from "@/lib/guestReadingMemory";
import { loadCookie, loadLocal, saveLocal } from "@/lib/storage";

const DISMISSED_KEY = "guest_memory_notice_dismissed";
const MEMORY_COUNT_COOKIE = "guest_reading_memory_count";

export function GuestMemoryNotice() {
  const [visible, setVisible] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const dismissed = loadLocal<boolean>(DISMISSED_KEY);
    const memoryCount = Number(loadCookie(MEMORY_COUNT_COOKIE) ?? "0");
    setVisible(!dismissed && memoryCount > 0);
  }, []);

  function dismiss() {
    saveLocal(DISMISSED_KEY, true);
    setVisible(false);
  }

  function clearMemory() {
    clearGuestPersonalization();
    setCleared(true);
    saveLocal(DISMISSED_KEY, true);
  }

  if (!visible && !cleared) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl rounded-md border border-gold/20 bg-[oklch(0.11_0.03_290/0.96)] px-4 py-3 shadow-2xl backdrop-blur md:bottom-5">
      {cleared ? (
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm leading-relaxed text-ivory/70">
            Töröltük a helyi olvasati mintát ebből a böngészőből.
          </p>
          <button type="button" onClick={() => setCleared(false)} className="text-sm text-gold">
            Rendben
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ivory/72">
            Ebből a böngészőből emlékszünk néhány korábbi olvasati mintára, hogy ne minden alkalom
            idegenként induljon. Ezt finoman használjuk, és bármikor törölheted.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <button type="button" onClick={dismiss} className="text-gold hover:text-gold/80">
              Értem
            </button>
            <button type="button" onClick={clearMemory} className="text-ivory/62 hover:text-gold">
              Helyi minta törlése
            </button>
            <Link to="/adatkezelesi-tajekoztato" className="text-ivory/50 hover:text-gold">
              Adatkezelés
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

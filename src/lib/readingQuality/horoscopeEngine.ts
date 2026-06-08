import { localHoroscope } from "../horoscope.hu";
import { SIGN_HU } from "../roxyNormalize";
import { guardQualityReading } from "./qualityGuard";
import { SAFETY_NOTE, type QualityReading } from "./styleRules";

const SIGN_TENSION: Record<string, string> = {
  aries: "a lendület és a türelem közti feszültség",
  taurus: "a biztonságigény és a változás lassú elfogadása",
  gemini: "a túl sok inger és a valódi fókusz közti billegés",
  cancer: "az érzelmi biztonság és a régi emlékek érzékeny határa",
  leo: "a láthatóság vágya és a sérülékeny büszkeség",
  virgo: "a rendteremtés és az önkritika közti vékony vonal",
  libra: "a harmóniaigény és a valódi döntés halogatása",
  scorpio: "a mélység és a kontroll közti belső feszültség",
  sagittarius: "a szabadságvágy és a vállalható ígéret határa",
  capricorn: "a felelősség, kontroll és időzítés kérdése",
  aquarius: "a távolság és a kapcsolódás szokatlan egyensúlya",
  pisces: "az intuíció és az elmosódó határok különbsége",
};

export function composeHoroscopeReading(opts: {
  sign: string;
  roxySource?: unknown;
  dateKey?: string;
}): QualityReading {
  const local = localHoroscope(opts.sign);
  const signName = SIGN_HU[opts.sign] ?? "Csillagjegy";
  const tension = SIGN_TENSION[opts.sign] ?? "a belső ritmus és a külső elvárások különbsége";
  const reading: QualityReading = {
    title: `${signName} · napi irány`,
    sections: [
      {
        heading: "Mai hangulat",
        text: `${local.mood} Ennél a jegynél ma különösen ${tension} lehet az a pont, ami nem nagy drámaként, inkább finom belső jelzésként jelenik meg.`,
      },
      { heading: "Szerelem", text: local.love },
      { heading: "Munka", text: local.work },
      { heading: "Mire figyelj?", text: local.warn },
      {
        heading: "A jegyed mai mintája",
        text: `A ${signName} számára ez a nap akkor lesz tisztább, ha nem mindent teljesítményként vagy visszajelzésként mér. A ${tension} most finoman megmutathatja, hol szorítasz rá valamire, amit elég lenne pontosabban időzíteni.`,
      },
      {
        heading: "Egy apró irány",
        text: "Válassz egyetlen helyzetet, ahol ma nem automatikusan reagálsz. Ha egy pillanattal később válaszolsz, könnyebb lesz észrevenni, mi a saját szándékod, és mi csak megszokott védekezés.",
      },
    ],
    oneSentence: local.oneLine,
    safetyNote: SAFETY_NOTE,
    meta: { fallbackUsed: true, readingType: "horoscope" },
  };
  const guard = guardQualityReading(reading, [signName, tension, opts.dateKey ?? ""]);
  reading.meta = { ...reading.meta, qualityIssues: guard.issues };
  return reading;
}

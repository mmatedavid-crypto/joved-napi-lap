import { SIGN_HU, SIGNS_HU_ORDERED } from "./roxyNormalize";

export const HOROSCOPE_PERIODS = ["napi", "heti", "havi"] as const;
export type HoroscopePeriodHU = (typeof HOROSCOPE_PERIODS)[number];
export type HoroscopePeriodRoxy = "daily" | "weekly" | "monthly";

export const SIGN_SLUGS: Record<(typeof SIGNS_HU_ORDERED)[number], string> = {
  aries: "kos",
  taurus: "bika",
  gemini: "ikrek",
  cancer: "rak",
  leo: "oroszlan",
  virgo: "szuz",
  libra: "merleg",
  scorpio: "skorpio",
  sagittarius: "nyilas",
  capricorn: "bak",
  aquarius: "vizonto",
  pisces: "halak",
};

export const SIGN_BY_SLUG = Object.fromEntries(
  Object.entries(SIGN_SLUGS).map(([sign, slug]) => [slug, sign]),
) as Record<string, (typeof SIGNS_HU_ORDERED)[number]>;

export const PERIOD_TO_ROXY: Record<HoroscopePeriodHU, HoroscopePeriodRoxy> = {
  napi: "daily",
  heti: "weekly",
  havi: "monthly",
};

export const PERIOD_LABEL: Record<HoroscopePeriodHU, string> = {
  napi: "Napi horoszkóp",
  heti: "Heti horoszkóp",
  havi: "Havi horoszkóp",
};

const DATE_FORMAT = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const MONTH_FORMAT = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "long",
});

function mondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
}

export function periodDateLabel(period: HoroscopePeriodHU, baseDate = new Date()): string {
  if (period === "havi") return MONTH_FORMAT.format(baseDate);
  if (period === "heti") {
    const start = mondayOfWeek(baseDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${DATE_FORMAT.format(start)} - ${DATE_FORMAT.format(end)}`;
  }
  return DATE_FORMAT.format(baseDate);
}

export function horoscopeSeoTitle(
  period: HoroscopePeriodHU,
  signName: string,
  baseDate = new Date(),
): string {
  return `${PERIOD_LABEL[period]} ${signName} jegyűeknek - ${periodDateLabel(period, baseDate)}`;
}

export function horoscopeSeoDescription(
  period: HoroscopePeriodHU,
  signName: string,
  baseDate = new Date(),
): string {
  return `${horoscopeSeoTitle(period, signName, baseDate)}. Friss magyar horoszkóp szerelem, munka, hangulat és önismereti irány szerint.`;
}

export type HoroscopeNewsSection = {
  heading: string;
  text: string;
};

export type HoroscopeNewsArticle = {
  period: HoroscopePeriodHU;
  sign: keyof typeof SIGN_SLUGS;
  signSlug: string;
  signName: string;
  dateKey: string;
  title: string;
  lead: string;
  sections: HoroscopeNewsSection[];
  luckyColor?: string;
  luckyNumber?: number;
  moonPhase?: string;
  sourceCached: boolean;
  translationCached: boolean;
  fallbackUsed: boolean;
};

export function horoscopeArticlePath(period: HoroscopePeriodHU, sign: keyof typeof SIGN_SLUGS) {
  return `/horoszkop/${period}/${SIGN_SLUGS[sign]}`;
}

export function allHoroscopeArticlePaths() {
  return HOROSCOPE_PERIODS.flatMap((period) =>
    SIGNS_HU_ORDERED.map((sign) => ({
      period,
      sign,
      signSlug: SIGN_SLUGS[sign],
      signName: SIGN_HU[sign],
      path: horoscopeArticlePath(period, sign),
    })),
  );
}

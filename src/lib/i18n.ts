// i18n: в App Router нет встроенной маршрутизации локалей (это была фича Pages
// Router). Паттерн — словари с ленивой подгрузкой + определение локали по
// Accept-Language (в proxy.ts можно редиректить на сегмент /[lang]). Для нашего
// стека это опционально — показан рабочий каркас; нетривиальный i18n
// (плюрализация, форматы дат) берут на next-intl.

export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

// Словари грузятся динамически — в бандл попадает только нужная локаль.
const dictionaries = {
  ru: () => import("@/dictionaries/ru.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["ru"]>>;

export function getDictionary(lang: string): Promise<Dictionary> {
  const key = isLocale(lang) ? lang : DEFAULT_LOCALE;
  return dictionaries[key]();
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

// Определение локали по заголовку Accept-Language (первый совпавший из наших).
export function resolveLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  for (const part of acceptLanguage.split(",")) {
    // trim ПОСЛЕ отсечения веса: RFC 7231 допускает пробел перед ';'
    // ("en ;q=0.9"), иначе в теге осталась бы концевая пробельная последовательность.
    const tag = part.split(";")[0].trim().toLowerCase();
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

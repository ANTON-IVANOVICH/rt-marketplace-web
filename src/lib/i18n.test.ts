import { describe, it, expect } from "vitest";
import { resolveLocale, isLocale, DEFAULT_LOCALE } from "./i18n";

describe("resolveLocale", () => {
  it("берёт первую поддерживаемую локаль из Accept-Language", () => {
    expect(resolveLocale("en-US,en;q=0.9,ru;q=0.8")).toBe("en");
    expect(resolveLocale("ru-RU,ru;q=0.9")).toBe("ru");
  });

  it("падает на дефолт для пустого/неизвестного заголовка", () => {
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale("de-DE,fr;q=0.9")).toBe(DEFAULT_LOCALE);
  });

  it("терпит пробел перед весом (RFC 7231 OWS)", () => {
    expect(resolveLocale("en ;q=0.9")).toBe("en");
    expect(resolveLocale("ru ; q=0.8")).toBe("ru");
  });
});

describe("isLocale", () => {
  it("сужает только известные локали", () => {
    expect(isLocale("ru")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});

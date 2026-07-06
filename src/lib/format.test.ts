import { describe, it, expect } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("переводит копейки в рубли", () => {
    const out = formatPrice(150000, "RUB");
    expect(out).toContain("1");
    expect(out).toContain("500");
  });

  it("ноль форматируется без падения", () => {
    expect(formatPrice(0, "RUB")).toContain("0");
  });

  it("уважает переданную валюту", () => {
    // Intl рендерит символ/код валюты в локали ru-RU.
    const usd = formatPrice(9900, "USD");
    expect(usd).toMatch(/\$|USD/);
  });
});

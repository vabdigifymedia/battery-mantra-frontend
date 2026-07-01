import { APP } from "@/constants/app";

const formatter = new Intl.NumberFormat(APP.locale, {
  style: "currency",
  currency: APP.currency,
  maximumFractionDigits: 0,
});

const formatterWithDecimals = new Intl.NumberFormat(APP.locale, {
  style: "currency",
  currency: APP.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | string | null | undefined, opts?: { decimals?: boolean }): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return opts?.decimals ? formatterWithDecimals.format(n) : formatter.format(n);
}

export function calcDiscountPercent(mrp: number, price: number): number {
  if (!mrp || mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

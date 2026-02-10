/* --- Integer Bounds --- */

const I32_MIN = -2147483648;
const I32_MAX = 2147483647;

export function isI32(n: number): boolean {
  return Number.isInteger(n) && n >= I32_MIN && n <= I32_MAX;
}

/** Clamp negative values to 0 (layout dimensions cannot be negative). */
export function clampNonNegative(n: number): number {
  return n < 0 ? 0 : n;
}

export function clampWithin(n: number, min: number, max: number): number {
  let v = n;
  if (v < min) v = min;
  if (v > max) v = max;
  return v;
}

export function toFiniteMax(n: number, fallback: number): number {
  return Number.isFinite(n) ? (n as number) : fallback;
}

export function isPercentString(v: unknown): v is `${number}%` {
  return typeof v === "string" && v.endsWith("%");
}
